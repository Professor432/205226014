const express = require("express");
const pool = require("../db.js");
const authenticateAdmin = require('../middlewares/auth.js');
const authenticateUser = require('../middlewares/userAuth.js');
require('dotenv').config();

const tableRouter = express.Router();


tableRouter.post("/", authenticateAdmin, async (req, res) => {
    // console.log(req.body)
    try {
        if (!req.body.table_id || !req.body.capacity || !req.body.availability_status) {
            return res.status(400).json({ message: "All fields are mandatory !!" })
        }
        const newTable = await pool.query("INSERT INTO \"table\"(table_id, capacity, availability_status) VALUES($1,$2,$3)",
            [req.body.table_id, req.body.capacity, req.body.availability_status]);
        res.status(201).json({
            message: "Table created successfully !!",
            // data: newTable
        })
    } catch (error) {
        console.log("ERROR MESSAGE ::", error.message);
        res.status(500).json({ message: "Can't create a new Table!!" });
    }
});

tableRouter.get("/mine", authenticateUser, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT table_id, capacity FROM "table" WHERE booked_by = $1 AND availability_status = $2 LIMIT 1',
            [req.user.user_email, "Occupied"]
        );
        return res.status(200).json({ data: result.rows[0] || null });
    } catch (error) {
        console.error("Unable to retrieve customer booking:", error.message);
        return res.status(500).json({ message: "Unable to retrieve your booking." });
    }
});

tableRouter.post("/:id/book", authenticateUser, async (req, res) => {
    const members = Number(req.body.members);
    if (!Number.isInteger(members) || members < 1) {
        return res.status(400).json({ message: "Enter a valid number of guests." });
    }

    try {
        const result = await pool.query(
            `UPDATE "table"
             SET availability_status = $1, booked_by = $2
             WHERE table_id = $3 AND availability_status = $4 AND capacity >= $5
             RETURNING table_id, capacity`,
            ["Occupied", req.user.user_email, req.params.id, "Available", members]
        );
        if (result.rowCount === 0) {
            return res.status(409).json({ message: "That table is no longer available for your party size." });
        }
        return res.status(201).json({ message: "Table booked successfully.", data: result.rows[0] });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({ message: "You already have an active table booking." });
        }
        console.error("Unable to book table:", error.message);
        return res.status(500).json({ message: "Unable to book the table." });
    }
});

tableRouter.post("/:id/release", authenticateUser, async (req, res) => {
    let client;
    try {
        client = await pool.connect();
        await client.query("BEGIN");
        const result = await client.query(
            `UPDATE "table"
             SET availability_status = $1, booked_by = NULL
             WHERE table_id = $2 AND booked_by = $3
             RETURNING table_id`,
            ["Available", req.params.id, req.user.user_email]
        );
        if (result.rowCount === 0) {
            await client.query("ROLLBACK");
            return res.status(403).json({ message: "This table is not booked under your account." });
        }
        await client.query("DELETE FROM cart_items WHERE table_id = $1", [req.params.id]);
        await client.query("DELETE FROM cart WHERE table_id = $1", [req.params.id]);
        await client.query("COMMIT");
        return res.status(200).json({ message: "Table released successfully." });
    } catch (error) {
        if (client) {
            await client.query("ROLLBACK");
        }
        console.error("Unable to release table:", error.message);
        return res.status(500).json({ message: "Unable to release the table." });
    } finally {
        if (client) {
            client.release();
        }
    }
});

// get Tables
tableRouter.get("/", async (req, res) => {
    try {
        const allTables = await pool.query(`SELECT table_id, capacity, availability_status FROM \"table\" ORDER BY table_id ASC;`);

        res.setHeader('Cache-Control', 'no-store');

        return res.status(200).json({
            message: "All Tables received !!",
            count: allTables.rows.length,
            data: allTables.rows
        });
    } catch (error) {
        console.log("ERROR MESSAGE ::", error.message)
        res.status(500).json({ message: "Can't get all Tables!!" })
    }
});


// get Tables based on availability_status
tableRouter.get("/availability_status/:availability_status", async (req, res) => {
    try {
        const {availability_status} = req.params
        const allTables = await pool.query(`SELECT table_id, capacity, availability_status FROM \"table\" WHERE availability_status = $1;`,[availability_status]);
        return res.status(200).json({
            message: "All Tables received based on availability_status !!",
            count: allTables.rows.length,
            data: allTables.rows
        });
    } catch (error) {
        console.log("ERROR MESSAGE ::", error.message)
        res.status(500).json({ message: "Can't get all Tables based on availability_status!!" })
    }
});


// get Tables based on capacity
tableRouter.get("/capacity/:capacity", async (req, res) => {
    try {
        const {capacity} = req.params
        const allTables = await pool.query(`SELECT table_id, capacity, availability_status FROM \"table\" WHERE availability_status = 'Available'AND capacity >= $1 ORDER BY capacity ASC, table_id ASC;`,[capacity]);
        return res.status(200).json({
            message: "All Tables received based on capacity !!",
            count: allTables.rows.length,
            data: allTables.rows
        });
    } catch (error) {
        console.log("ERROR MESSAGE ::", error.message)
        res.status(500).json({ message: "Can't get all Tables based on capacity!!" })
    }
});


tableRouter.get("/:id", async (req, res) => {
    try {
        const { id } = req.params
        const oneTable = await pool.query("SELECT table_id, capacity, availability_status FROM \"table\" WHERE table_id = $1", [id]);
        // console.log(oneTable.rows)
        if (!oneTable.rows[0]) {
            return res.status(404).json({ message: "Table not found !!" })
        }
        return res.status(200).json({
            message: "Table received !!",
            data: oneTable.rows[0]
        })
    } catch (error) {
        console.log("ERROR MESSAGE ::", error.message)
        res.status(500).json({ message: "Can't get the Table!!" })
    }
});


tableRouter.put("/:id", authenticateAdmin, async (req, res) => {
    try {
        const tableId = Number(req.body.table_id);
        const capacity = Number(req.body.capacity);
        const originalTableId = Number(req.params.id);
        const { availability_status: availabilityStatus } = req.body;

        if (
            !Number.isInteger(tableId) || tableId < 1 || tableId >= 50 ||
            !Number.isInteger(capacity) || capacity < 1 || capacity >= 20 ||
            !Number.isInteger(originalTableId) ||
            !["Available", "Occupied"].includes(availabilityStatus)
        ) {
            return res.status(400).json({ message: "Enter a valid table number, capacity, and availability status." });
        }
        await pool.query(`DO $$
        BEGIN
            IF to_regclass('"cart_items"') IS NOT NULL THEN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint
                    WHERE conrelid = '"cart_items"'::regclass
                      AND conname = 'cart_items_table_id_fkey'
                      AND confupdtype = 'c'
                ) THEN
                    ALTER TABLE "cart_items" DROP CONSTRAINT IF EXISTS cart_items_table_id_fkey;
                    ALTER TABLE "cart_items" ADD CONSTRAINT cart_items_table_id_fkey
                        FOREIGN KEY (table_id) REFERENCES "table"(table_id) ON UPDATE CASCADE;
                END IF;
            END IF;
            IF to_regclass('cart') IS NOT NULL THEN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint
                    WHERE conrelid = 'cart'::regclass
                      AND conname = 'cart_table_id_fkey'
                      AND confupdtype = 'c'
                ) THEN
                    ALTER TABLE "cart" DROP CONSTRAINT IF EXISTS cart_table_id_fkey;
                    ALTER TABLE "cart" ADD CONSTRAINT cart_table_id_fkey
                        FOREIGN KEY (table_id) REFERENCES "table"(table_id) ON UPDATE CASCADE;
                END IF;
            END IF;
        END $$;`);
        const result = await pool.query(
            `UPDATE "table"
             SET table_id = $1,
                 capacity = $2,
                 availability_status = $3,
                 booked_by = CASE WHEN $3 = 'Available' THEN NULL ELSE booked_by END
             WHERE table_id = $4
             RETURNING table_id, capacity, availability_status`,
            [tableId, capacity, availabilityStatus, originalTableId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Table not found." });
        }
        return res.status(200).json({ message: "Table updated successfully.", data: result.rows[0] });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({ message: "A table with that number already exists." });
        }
        if (error.code === "23503") {
            return res.status(409).json({ message: "The table number cannot be changed while it has linked orders or bookings." });
        }
        console.log("ERROR MESSAGE ::", error.message)
        res.status(500).json({ message: "Can't update !!" })
    }
});


tableRouter.delete("/:id", authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params
        const deleteTable = await pool.query("DELETE FROM \"table\" WHERE table_id = $1;", [id]);
        if (deleteTable.rowCount == 0) {
            return res.status(404).json({ message: "Table not found !!" });
        }
        return res.status(200).json({
            message: "Deleted successfully !!",
            // data: deleteTable
        })
    } catch (error) {
        console.log("ERROR MESSAGE ::", error.message)
        res.status(500).json({ message: "Can't delete!!" })
    }
});


module.exports = tableRouter;