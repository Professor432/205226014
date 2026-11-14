const express = require("express");
const { randomUUID } = require("crypto");
const pool = require("../db.js");
const { RELATION2 } = require("../config.js");
const { calculateOrderTotals } = require("../utils/orderTotals.js");
const authenticateAdmin = require("../middlewares/auth.js");
const authenticateUser = require("../middlewares/userAuth.js");
const requireTableOwnership = require("../middlewares/tableOwnership.js");

const ordersRouter = express.Router();
const ORDER_STATUSES = ["new", "ready", "completed"];
const EDIT_WINDOW_MINUTES = 5;

const ORDER_SELECT = `
    SELECT o.order_id, o.user_email, u.user_name, o.table_id, o.status,
           o.created_at, o.subtotal_amount, o.tax_amount, o.grand_total,
           o.total_profit, o.paid_at, o.payment_id IS NOT NULL AS paid,
           COALESCE(item_data.items, '[]'::jsonb) AS items
    FROM food_orders o
    JOIN "User" u ON u.user_email = o.user_email
    LEFT JOIN LATERAL (
        SELECT jsonb_agg(jsonb_build_object(
                   'menu_name', i.menu_name,
                   'quantity', i.quantity,
                   'item_price', i.item_price,
                   'item_profit', i.item_profit,
                   'total_price', i.total_price,
                   'total_profit', i.total_profit
               ) ORDER BY i.menu_name) AS items
        FROM food_order_items i
        WHERE i.order_id = o.order_id
    ) item_data ON TRUE`;

const VALIDATE_ORDER_LIST = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
        return "An order must contain at least one menu item.";
    }

    const names = new Set();
    for (const item of items) {
        if (
            !item ||
            typeof item.menu_name !== "string" ||
            !item.menu_name.trim() ||
            !Number.isInteger(Number(item.quantity)) ||
            Number(item.quantity) < 1 ||
            Number(item.quantity) > 99
        ) {
            return "Each menu item needs a valid name and quantity.";
        }
        if (names.has(item.menu_name.trim())) {
            return "Each menu item can only appear once in an order.";
        }
        names.add(item.menu_name.trim());
    }
    return null;
};

ordersRouter.post("/", authenticateUser, requireTableOwnership, async (req, res) => {
    const tableId = Number(req.body.table_id);
    if (!Number.isInteger(tableId) || tableId < 1) {
        return res.status(400).json({ message: "A valid table number is required." });
    }

    let client;
    try {
        client = await pool.connect();
        await client.query("BEGIN");
        const table = await client.query(
            'SELECT table_id FROM "table" WHERE table_id = $1 AND booked_by = $2 FOR UPDATE',
            [tableId, req.user.user_email]
        );
        if (table.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(403).json({ message: "This table is not booked under your account." });
        }

        const cartResult = await client.query(
            `SELECT menu_name, quantity, item_price, item_profit, total_price, total_profit
             FROM cart_items WHERE table_id = $1 ORDER BY menu_name FOR UPDATE`,
            [tableId]
        );
        if (cartResult.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(400).json({ message: "Add at least one item before placing your order." });
        }

        const subtotal = cartResult.rows.reduce((sum, item) => sum + Number(item.total_price), 0);
        const totalProfit = cartResult.rows.reduce((sum, item) => sum + Number(item.total_profit), 0);
        const totals = calculateOrderTotals(subtotal);
        const orderId = randomUUID();
        const createdOrder = await client.query(
            `INSERT INTO food_orders
                (order_id, user_email, table_id, status, subtotal_amount, tax_amount, grand_total, total_profit)
             VALUES ($1, $2, $3, 'new', $4, $5, $6, $7)
             RETURNING order_id, table_id, status, created_at, subtotal_amount, tax_amount, grand_total, total_profit`,
            [orderId, req.user.user_email, tableId, subtotal, totals.tax_amount, totals.grand_total, totalProfit]
        );

        for (const item of cartResult.rows) {
            await client.query(
                `INSERT INTO food_order_items
                    (order_id, menu_name, quantity, item_price, item_profit, total_price, total_profit)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [orderId, item.menu_name, item.quantity, item.item_price, item.item_profit, item.total_price, item.total_profit]
            );
        }

        await client.query("DELETE FROM cart_items WHERE table_id = $1", [tableId]);
        await client.query("DELETE FROM cart WHERE table_id = $1", [tableId]);
        await client.query("COMMIT");
        return res.status(201).json({
            message: "Thank you for your order. Please wait until it is ready.",
            data: { ...createdOrder.rows[0], items: cartResult.rows, paid: false }
        });
    } catch (error) {
        if (client) {
            await client.query("ROLLBACK");
        }
        console.error("Unable to place order:", error.message);
        return res.status(500).json({ message: "Unable to place your order." });
    } finally {
        if (client) {
            client.release();
        }
    }
});

ordersRouter.get("/mine", authenticateUser, async (req, res) => {
    try {
        const result = await pool.query(
            `${ORDER_SELECT}
             WHERE o.user_email = $1
             ORDER BY o.created_at DESC`,
            [req.user.user_email]
        );
        res.setHeader("Cache-Control", "no-store");
        return res.status(200).json({ data: result.rows });
    } catch (error) {
        console.error("Unable to load customer order history:", error.message);
        return res.status(500).json({ message: "Unable to load your order history." });
    }
});

ordersRouter.get("/checkout-summary", authenticateUser, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT order_id, subtotal_amount
             FROM food_orders
             WHERE user_email = $1 AND payment_id IS NULL
             ORDER BY created_at ASC`,
            [req.user.user_email]
        );
        const subtotal = result.rows.reduce((sum, order) => sum + Number(order.subtotal_amount), 0);
        const totals = calculateOrderTotals(subtotal);
        res.setHeader("Cache-Control", "no-store");
        return res.status(200).json({
            order_ids: result.rows.map((order) => order.order_id),
            order_count: result.rowCount,
            ...totals
        });
    } catch (error) {
        console.error("Unable to calculate order checkout:", error.message);
        return res.status(500).json({ message: "Unable to calculate checkout total." });
    }
});

ordersRouter.post("/checkout/complete", authenticateUser, async (req, res) => {
    const requestedIds = req.body.order_ids;
    const paymentReference = typeof req.body.razorpay_payment_id === "string"
        ? req.body.razorpay_payment_id.trim()
        : "";
    if (
        !Array.isArray(requestedIds) ||
        requestedIds.length === 0 ||
        requestedIds.some((id) => typeof id !== "string" || !id) ||
        new Set(requestedIds).size !== requestedIds.length ||
        !paymentReference
    ) {
        return res.status(400).json({ message: "A valid payment reference and unpaid order list are required." });
    }

    let client;
    try {
        client = await pool.connect();
        await client.query("BEGIN");
        const existingPayment = await client.query(
            `SELECT order_id, subtotal_amount, tax_amount, grand_total_amount
             FROM payment
             WHERE razorpay_payment_id = $1 AND user_email = $2`,
            [paymentReference, req.user.user_email]
        );
        if (existingPayment.rowCount > 0) {
            const existing = existingPayment.rows[0];
            const linkedOrders = await client.query(
                "SELECT order_id FROM food_orders WHERE payment_id = $1",
                [existing.order_id]
            );
            const linkedIds = new Set(linkedOrders.rows.map((order) => order.order_id));
            if (requestedIds.every((id) => linkedIds.has(id)) && linkedIds.size === requestedIds.length) {
                await client.query("COMMIT");
                return res.status(200).json({
                    message: "Payment was already recorded.",
                    data: {
                        payment_id: existing.order_id,
                        subtotal_amount: existing.subtotal_amount,
                        tax_amount: existing.tax_amount,
                        grand_total: existing.grand_total_amount
                    }
                });
            }
            await client.query("ROLLBACK");
            return res.status(409).json({ message: "This payment is already linked to different orders." });
        }
        const orders = await client.query(
            `SELECT order_id, subtotal_amount, total_profit
             FROM food_orders
             WHERE user_email = $1 AND payment_id IS NULL AND order_id = ANY($2::varchar[])
             FOR UPDATE`,
            [req.user.user_email, requestedIds]
        );
        if (orders.rowCount !== requestedIds.length) {
            await client.query("ROLLBACK");
            return res.status(409).json({ message: "Some selected orders are no longer available for checkout." });
        }

        const subtotal = orders.rows.reduce((sum, order) => sum + Number(order.subtotal_amount), 0);
        const totalProfit = orders.rows.reduce((sum, order) => sum + Number(order.total_profit), 0);
        const totals = calculateOrderTotals(subtotal);
        const grandTotal = totals.grand_total;
        const paymentId = randomUUID();
        await client.query(
            `INSERT INTO payment
                (order_id, total_bill_amount, total_bill_profit, payment_mode, date_time,
                 user_email, subtotal_amount, tax_amount, grand_total_amount, razorpay_payment_id)
             VALUES ($1, $2, $3, 'Razorpay', NOW(), $4, $5, $6, $7, $8)`,
            [paymentId, Math.round(grandTotal), totalProfit, req.user.user_email, subtotal, totals.tax_amount, grandTotal, paymentReference]
        );
        await client.query(
            `UPDATE food_orders
             SET payment_id = $1, paid_at = NOW()
             WHERE order_id = ANY($2::varchar[]) AND user_email = $3`,
            [paymentId, requestedIds, req.user.user_email]
        );
        await client.query("COMMIT");
        return res.status(200).json({
            message: "Payment recorded successfully.",
            data: { payment_id: paymentId, ...totals }
        });
    } catch (error) {
        if (client) {
            await client.query("ROLLBACK");
        }
        if (error.code === "23505") {
            return res.status(409).json({ message: "This payment has already been recorded." });
        }
        console.error("Unable to record order payment:", error.message);
        return res.status(500).json({ message: "Unable to record your payment." });
    } finally {
        if (client) {
            client.release();
        }
    }
});

ordersRouter.get("/", authenticateAdmin, async (req, res) => {
    const status = req.query.status || null;
    if (status && !ORDER_STATUSES.includes(status)) {
        return res.status(400).json({ message: "Select a valid order status." });
    }
    try {
        const result = await pool.query(
            `${ORDER_SELECT}
             WHERE ($1::varchar IS NULL OR o.status = $1)
             ORDER BY o.created_at DESC`,
            [status]
        );
        res.setHeader("Cache-Control", "no-store");
        return res.status(200).json({ data: result.rows });
    } catch (error) {
        console.error("Unable to load admin orders:", error.message);
        return res.status(500).json({ message: "Unable to load orders." });
    }
});

ordersRouter.patch("/:orderId/status", authenticateAdmin, async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;
    if (!["ready", "completed"].includes(status)) {
        return res.status(400).json({ message: "Choose Ready or Completed." });
    }
    try {
        const allowedPreviousStatus = status === "ready" ? "new" : "ready";
        const result = await pool.query(
            `UPDATE food_orders SET status = $1
             WHERE order_id = $2 AND status = $3
             RETURNING order_id, status`,
            [status, orderId, allowedPreviousStatus]
        );
        if (result.rowCount === 0) {
            return res.status(409).json({ message: "This order has already changed status." });
        }
        return res.status(200).json({ message: "Order status updated.", data: result.rows[0] });
    } catch (error) {
        console.error("Unable to update order status:", error.message);
        return res.status(500).json({ message: "Unable to update order status." });
    }
});

ordersRouter.put("/:orderId", authenticateUser, async (req, res) => {
    const validationError = VALIDATE_ORDER_LIST(req.body.items);
    if (validationError) {
        return res.status(400).json({ message: validationError });
    }
    const requestedItems = req.body.items.map((item) => ({
        menu_name: item.menu_name.trim(),
        quantity: Number(item.quantity)
    }));

    let client;
    try {
        client = await pool.connect();
        await client.query("BEGIN");
        const orderResult = await client.query(
            `SELECT order_id, status, payment_id, created_at
             FROM food_orders
             WHERE order_id = $1 AND user_email = $2
             FOR UPDATE`,
            [req.params.orderId, req.user.user_email]
        );
        const order = orderResult.rows[0];
        if (!order) {
            await client.query("ROLLBACK");
            return res.status(404).json({ message: "Order not found." });
        }
        const editDeadline = new Date(order.created_at).getTime() + EDIT_WINDOW_MINUTES * 60 * 1000;
        if (order.status !== "new" || order.payment_id || Date.now() >= editDeadline) {
            await client.query("ROLLBACK");
            return res.status(409).json({ message: "Orders can only be edited while New and within five minutes of placement." });
        }

        const menuNames = requestedItems.map((item) => item.menu_name);
        const menuResult = await client.query(
            `SELECT menu_name, price, profit FROM "${RELATION2}"
             WHERE menu_name = ANY($1::varchar[])`,
            [menuNames]
        );
        if (menuResult.rowCount !== requestedItems.length) {
            await client.query("ROLLBACK");
            return res.status(400).json({ message: "One or more selected menu items are no longer available." });
        }
        const menuByName = new Map(menuResult.rows.map((item) => [item.menu_name, item]));
        const pricedItems = requestedItems.map((item) => {
            const menuItem = menuByName.get(item.menu_name);
            return {
                ...item,
                item_price: Number(menuItem.price),
                item_profit: Number(menuItem.profit),
                total_price: Number(menuItem.price) * item.quantity,
                total_profit: Number(menuItem.profit) * item.quantity
            };
        });
        const subtotal = pricedItems.reduce((sum, item) => sum + item.total_price, 0);
        const totalProfit = pricedItems.reduce((sum, item) => sum + item.total_profit, 0);
        const totals = calculateOrderTotals(subtotal);

        await client.query("DELETE FROM food_order_items WHERE order_id = $1", [order.order_id]);
        for (const item of pricedItems) {
            await client.query(
                `INSERT INTO food_order_items
                    (order_id, menu_name, quantity, item_price, item_profit, total_price, total_profit)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [order.order_id, item.menu_name, item.quantity, item.item_price, item.item_profit, item.total_price, item.total_profit]
            );
        }
        const updatedOrder = await client.query(
            `UPDATE food_orders
             SET subtotal_amount = $1, tax_amount = $2, grand_total = $3, total_profit = $4
             WHERE order_id = $5
             RETURNING order_id, table_id, status, created_at, subtotal_amount, tax_amount, grand_total, total_profit`,
            [subtotal, totals.tax_amount, totals.grand_total, totalProfit, order.order_id]
        );
        await client.query("COMMIT");
        return res.status(200).json({
            message: "Order updated successfully.",
            data: { ...updatedOrder.rows[0], items: pricedItems, paid: false }
        });
    } catch (error) {
        if (client) {
            await client.query("ROLLBACK");
        }
        console.error("Unable to edit customer order:", error.message);
        return res.status(500).json({ message: "Unable to update your order." });
    } finally {
        if (client) {
            client.release();
        }
    }
});

module.exports = ordersRouter;
