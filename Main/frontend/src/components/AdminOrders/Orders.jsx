import React, { useEffect, useState } from "react";
import "./orders.css";
import { orders as ordersAxios } from "../AxiosCreate";
import Loader from "../Loader/Loader";
import { toast } from "react-toastify";

const ORDER_FILTERS = [
  { value: "all", label: "All orders" },
  { value: "new", label: "New orders" },
  { value: "ready", label: "Ready orders" },
  { value: "completed", label: "Completed orders" },
];

const formatCurrency = (amount) => `₹${Number(amount).toLocaleString("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const Orders = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchOrders = async () => {
      try {
        const path = selectedStatus === "all" ? "/" : `/?status=${selectedStatus}`;
        const response = await ordersAxios.get(path);
        if (active) {
          setOrders(response.data.data);
          setError("");
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.response?.data?.message || "Order details could not be loaded.");
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
  }, [selectedStatus, refreshKey]);

  const updateStatus = async (order) => {
    const nextStatus = order.status === "new" ? "ready" : "completed";
    setUpdatingOrderId(order.order_id);
    try {
      await ordersAxios.patch(`/${order.order_id}/status`, { status: nextStatus });
      toast.success(`Order marked ${nextStatus}.`);
      setRefreshKey((key) => key + 1);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Unable to update order status.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  return (
    <main className="admin-orders">
      <header className="admin-orders-header">
        <h1>Order Management</h1>
        <label htmlFor="order-status-filter">Filter orders</label>
        <select
          id="order-status-filter"
          value={selectedStatus}
          onChange={(event) => {
            setLoading(true);
            setSelectedStatus(event.target.value);
          }}
        >
          {ORDER_FILTERS.map((filter) => (
            <option key={filter.value} value={filter.value}>{filter.label}</option>
          ))}
        </select>
      </header>
      {loading ? (
        <Loader />
      ) : error ? (
        <div className="orders-message" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => {
            setLoading(true);
            setRefreshKey((key) => key + 1);
          }}>Retry</button>
        </div>
      ) : orders.length === 0 ? (
        <p className="orders-message">There are no {selectedStatus === "all" ? "" : `${selectedStatus} `}orders.</p>
      ) : (
        <section className="orders">
          {orders.map((order) => (
            <article className="order" key={order.order_id}>
              <header className="order-heading">
                <div>
                  <h2>Order #{order.order_id.slice(0, 8)}</h2>
                  <p>{order.user_name} · {order.user_email} · Table #{order.table_id}</p>
                  <p>Placed {new Date(order.created_at).toLocaleString()}</p>
                </div>
                <span className={`admin-order-status status-${order.status}`}>{order.status}</span>
              </header>
              <div className="order-row order-column-headings">
                <span>Menu item</span>
                <span>Quantity</span>
                <span>Item price</span>
                <span>Total</span>
              </div>
              {order.items.map((item) => (
                <div key={`${order.order_id}-${item.menu_name}`} className="order-row">
                  <span>{item.menu_name}</span>
                  <span>{item.quantity}</span>
                  <span>{formatCurrency(item.item_price)}</span>
                  <span>{formatCurrency(item.total_price)}</span>
                </div>
              ))}
              <div className="admin-order-summary">
                <span>{order.paid ? "Paid" : "Unpaid"}</span>
                <span>Subtotal: {formatCurrency(order.subtotal_amount)}</span>
                <span>Tax: {formatCurrency(order.tax_amount)}</span>
                <strong>Total: {formatCurrency(order.grand_total)}</strong>
                {order.status !== "completed" && (
                  <button
                    type="button"
                    onClick={() => updateStatus(order)}
                    disabled={updatingOrderId === order.order_id}
                  >
                    {updatingOrderId === order.order_id
                      ? "Updating..."
                      : order.status === "new" ? "Mark Ready" : "Mark Completed"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
};

export default Orders;
