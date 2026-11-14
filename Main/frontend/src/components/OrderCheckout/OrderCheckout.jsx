import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { orders as ordersAxios } from "../AxiosCreate";
import { RAZORPAY_KEY_ID } from "../../config";
import Automn_logo from "../../assets/Automn_logo.png";
import { isUserAuthenticated } from "../../auth";
import { toast } from "react-toastify";
import LeaveTable from "../LeaveTable/LeaveTable";
import "./OrderCheckout.css";

const formatCurrency = (amount) => Number(amount).toLocaleString("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function OrderCheckout({ refreshKey = 0, onPaymentSuccess }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [pendingPayment, setPendingPayment] = useState(null);
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const fetchSummary = async () => {
      try {
        const response = await ordersAxios.get("/checkout-summary");
        if (active) {
          setSummary(response.data);
          setError("");
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.response?.data?.message || "Unable to load unpaid orders.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchSummary();
    const refreshTimer = window.setInterval(fetchSummary, 15000);
    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, [refreshKey, retryKey]);

  const recordPayment = async (paymentReference, orderIds) => {
    setRecordingPayment(true);
    try {
      await ordersAxios.post("/checkout/complete", {
        order_ids: orderIds,
        razorpay_payment_id: paymentReference,
      });
      setPendingPayment(null);
      toast.success("Payment successful. Your orders are recorded.");
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
      setRetryKey((key) => key + 1);
    } catch (requestError) {
      setPendingPayment({ order_ids: orderIds, payment_id: paymentReference });
      toast.error(
        requestError.response?.data?.message ||
        "Payment completed, but the order payment could not be recorded. Retry recording it without paying again."
      );
    } finally {
      setRecordingPayment(false);
      setCheckoutLoading(false);
    }
  };

  const handleCheckout = () => {
    if (!isUserAuthenticated()) {
      navigate("/signin");
      return;
    }
    if (!summary?.order_ids?.length) {
      toast.info("There are no unpaid orders to checkout.");
      return;
    }
    if (typeof window.Razorpay !== "function") {
      toast.error("Razorpay checkout is unavailable. Please try again.");
      return;
    }

    setCheckoutLoading(true);
    const checkoutOrderIds = summary.order_ids;
    const payment = new window.Razorpay({
      key: RAZORPAY_KEY_ID,
      amount: Math.round(Number(summary.grand_total) * 100),
      currency: "INR",
      name: "Automn Pay",
      description: "Pay Automn",
      image: Automn_logo,
      handler: (response) => recordPayment(response.razorpay_payment_id, checkoutOrderIds),
      modal: {
        ondismiss: () => setCheckoutLoading(false),
      },
      timeout: 120,
      prefill: {
        name: localStorage.getItem("user_name") || "",
        email: localStorage.getItem("user_email") || "",
        contact: "",
      },
      notes: { address: "" },
      theme: { color: "#942D2D" },
    });

    payment.open();
  };

  return (
    <section className="order-checkout" aria-label="Checkout unpaid orders">
      <h2>Unpaid orders checkout</h2>
      {loading ? (
        <p>Loading unpaid orders...</p>
      ) : error ? (
        <div role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setRetryKey((key) => key + 1)}>Retry</button>
        </div>
      ) : summary.order_count === 0 ? (
        <>
          <p>No unpaid orders. Place an order to checkout.</p>
          {localStorage.getItem("table_id") && (
            <div className="table-session-actions">
              <p>You can leave your table now or continue ordering.</p>
              <LeaveTable canLeave />
              <button type="button" onClick={() => navigate("/menu")}>Continue ordering</button>
            </div>
          )}
        </>
      ) : (
        <>
          <p>{summary.order_count} order{summary.order_count === 1 ? "" : "s"} awaiting payment</p>
          <div className="order-checkout-line"><span>Subtotal</span><span>₹{formatCurrency(summary.subtotal_amount)}</span></div>
          <div className="order-checkout-line"><span>Tax (5%)</span><span>₹{formatCurrency(summary.tax_amount)}</span></div>
          <div className="order-checkout-line order-checkout-total"><span>Grand total</span><span>₹{formatCurrency(summary.grand_total)}</span></div>
          <button type="button" onClick={handleCheckout} disabled={checkoutLoading || Boolean(pendingPayment)}>
            {checkoutLoading ? "Checkout open..." : "Checkout all unpaid orders"}
          </button>
        </>
      )}
      {pendingPayment && (
        <div className="order-payment-retry" role="alert">
          <p>Payment completed, but the order record still needs to be updated. Retry without paying again.</p>
          <button
            type="button"
            onClick={() => recordPayment(pendingPayment.payment_id, pendingPayment.order_ids)}
            disabled={recordingPayment}
          >
            {recordingPayment ? "Recording..." : "Retry payment recording"}
          </button>
        </div>
      )}
    </section>
  );
}
