import React, { useEffect, useState } from "react";
import { orders as ordersAxios, restaurantMenu } from "../AxiosCreate";
import OrderCheckout from "../OrderCheckout/OrderCheckout";
import Loader from "../Loader/Loader";
import { toast } from "react-toastify";
import "./MyOrders.css";

const EDIT_WINDOW_MS = 5 * 60 * 1000;
const formatCurrency = (amount) => Number(amount).toLocaleString("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const canEditOrder = (order, now) => (
  order.status === "new" &&
  !order.paid &&
  now < new Date(order.created_at).getTime() + EDIT_WINDOW_MS
);

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [draftItems, setDraftItems] = useState([]);
  const [availableMenuItems, setAvailableMenuItems] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchOrders = async () => {
      try {
        const response = await ordersAxios.get("/mine");
        if (active) {
          setOrders(response.data.data);
          setError("");
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.response?.data?.message || "Unable to load your order history.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchOrders();
    const refreshTimer = window.setInterval(fetchOrders, 15000);
    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, [refreshKey]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const startEditing = async (order) => {
    try {
      const response = await restaurantMenu.get("/");
      setAvailableMenuItems(response.data.data);
      setDraftItems(order.items.map(({ menu_name, quantity }) => ({ menu_name, quantity: Number(quantity) })));
      setEditingOrderId(order.order_id);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Unable to load menu items for editing.");
    }
  };

  const updateDraftItem = (index, key, value) => {
    setDraftItems((items) => items.map((item, itemIndex) => (
      itemIndex === index
        ? { ...item, [key]: key === "quantity" ? Number(value) : value }
        : item
    )));
  };

  const addDraftItem = () => {
    const unusedItem = availableMenuItems.find(
      (menuItem) => !draftItems.some((item) => item.menu_name === menuItem.menu_name)
    );
    if (!unusedItem) {
      toast.info("All available menu items are already in this order.");
      return;
    }
    setDraftItems((items) => [...items, { menu_name: unusedItem.menu_name, quantity: 1 }]);
  };

  const saveEdit = async (orderId) => {
    setSaving(true);
    try {
      await ordersAxios.put(`/${orderId}`, { items: draftItems });
      setEditingOrderId(null);
      setRefreshKey((key) => key + 1);
      toast.success("Order updated.");
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Unable to update your order.");
    } finally {
      setSaving(false);
    }
  };

  const formatTimeRemaining = (order) => {
    const remaining = Math.max(
      0,
      new Date(order.created_at).getTime() + EDIT_WINDOW_MS - now
    );
    return `${Math.ceil(remaining / 60000)} minute${Math.ceil(remaining / 60000) === 1 ? "" : "s"} left`;
  };

  return (
    <main className="my-orders-page">
      <header className="my-orders-header">
        <h1>My Orders</h1>
        <p>Track order status and review previous orders.</p>
      </header>
      <OrderCheckout refreshKey={refreshKey} onPaymentSuccess={() => setRefreshKey((key) => key + 1)} />
      {loading ? (
        <Loader />
      ) : error ? (
        <p className="my-orders-message" role="alert">{error}</p>
      ) : orders.length === 0 ? (
        <p className="my-orders-message">You have not placed any orders yet.</p>
      ) : (
        <section className="my-orders-list">
          {orders.map((order) => {
            const editable = canEditOrder(order, now);
            const isEditing = editingOrderId === order.order_id && editable;
            return (
              <article className="my-order-card" key={order.order_id}>
                <header className="my-order-title">
                  <div>
                    <h2>Order #{order.order_id.slice(0, 8)}</h2>
                    <p>Placed {new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <span className={`order-status status-${order.status}`}>{order.status}</span>
                </header>
                {order.status === "ready" && (
                  <p className="order-ready-message" role="status">Your order is ready!</p>
                )}
                {order.status === "new" && (
                  <p className="order-waiting-message" role="status">
                    Thank you for your order. Please wait until it is ready.
                  </p>
                )}
                <p className="my-order-meta">Table #{order.table_id} · {order.paid ? "Paid" : "Unpaid"}</p>
                {isEditing ? (
                  <div className="order-edit-panel">
                    <p className="edit-time-left">{formatTimeRemaining(order)} to edit</p>
                    {draftItems.map((item, index) => (
                      <div className="order-edit-row" key={`${order.order_id}-${index}`}>
                        <select
                          aria-label="Menu item"
                          value={item.menu_name}
                          onChange={(event) => updateDraftItem(index, "menu_name", event.target.value)}
                        >
                          {availableMenuItems.map((menuItem) => (
                            <option
                              key={menuItem.menu_name}
                              value={menuItem.menu_name}
                              disabled={draftItems.some((draft, draftIndex) => draftIndex !== index && draft.menu_name === menuItem.menu_name)}
                            >
                              {menuItem.menu_name}
                            </option>
                          ))}
                        </select>
                        <input
                          aria-label={`Quantity for ${item.menu_name}`}
                          type="number"
                          min="1"
                          max="99"
                          value={item.quantity}
                          onChange={(event) => updateDraftItem(index, "quantity", event.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setDraftItems((items) => items.filter((_, itemIndex) => itemIndex !== index))}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <div className="order-edit-actions">
                      <button type="button" onClick={addDraftItem}>Add item</button>
                      <button type="button" onClick={() => saveEdit(order.order_id)} disabled={saving || draftItems.length === 0}>
                        {saving ? "Saving..." : "Save changes"}
                      </button>
                      <button type="button" onClick={() => setEditingOrderId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="my-order-items">
                      {order.items.map((item) => (
                        <div className="my-order-item" key={`${order.order_id}-${item.menu_name}`}>
                          <span>{item.menu_name} × {item.quantity}</span>
                          <span>₹{formatCurrency(item.total_price)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="my-order-totals">
                      <span>Subtotal: ₹{formatCurrency(order.subtotal_amount)}</span>
                      <span>Tax: ₹{formatCurrency(order.tax_amount)}</span>
                      <strong>Total: ₹{formatCurrency(order.grand_total)}</strong>
                    </div>
                    {editable && (
                      <button type="button" className="edit-order-button" onClick={() => startEditing(order)}>
                        Edit order · {formatTimeRemaining(order)}
                      </button>
                    )}
                  </>
                )}
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
