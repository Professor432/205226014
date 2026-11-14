import React, { useEffect, useState } from "react";
import { CartItem } from "./cart-item";
import { useNavigate } from "react-router-dom";
import "./Cart.scss";
import { cartItems as cartItemsAxios, cart as cartAxios, orders as ordersAxios } from "../AxiosCreate";
import ButtonComponent from "../Button/ButtonComponent";
import OrderCheckout from "../OrderCheckout/OrderCheckout";
import Loader from "../Loader/Loader";
import { isUserAuthenticated } from "../../auth";
import { toast } from "react-toastify";

function Cart() {
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [totalBillAmt, setTotalBillAmt] = useState(0);
  const [totalBillProfit, setTotalBillProfit] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [cartItemsCnt, setCartItemsCnt] = useState(0);
  const [cartError, setCartError] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(null);
  const [checkoutRefreshKey, setCheckoutRefreshKey] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const tableId = localStorage.getItem("table_id");
    if (!tableId) {
      navigate("/");
      return;
    }

    let active = true;
    const fetchCartItems = async () => {
      try {
        const response = await cartItemsAxios.get(`/cart_table/${tableId}`);
        if (active) {
          setCartItems(response.data.data || []);
          setCartItemsCnt(response.data.count || 0);
          setCartError("");
        }
      } catch (requestError) {
        console.error("Unable to load cart items:", requestError);
        if (active) {
          setCartItems([]);
          setCartError(requestError.response?.data?.message || "Unable to load your cart.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchCartItems();
    return () => {
      active = false;
    };
  }, [cartItemsCnt, navigate]);

  useEffect(() => {
    const tableId = localStorage.getItem("table_id");
    if (!tableId) {
      return;
    }

    let active = true;
    const fetchTotals = async () => {
      try {
        const response = await cartAxios.get(`/${tableId}`);
        if (active) {
          setTotalBillAmt(Number(response.data.data.total_bill_amount) || 0);
          setTotalBillProfit(Number(response.data.data.total_bill_profit) || 0);
        }
      } catch (requestError) {
        if (requestError.response?.status !== 404) {
          console.error("Unable to load cart totals:", requestError);
        }
        if (active) {
          setTotalBillAmt(0);
          setTotalBillProfit(0);
        }
      }
    };
    fetchTotals();
    return () => {
      active = false;
    };
  }, [cartItemsCnt, totalBillAmt, totalBillProfit]);

  const placeOrder = async () => {
    if (!isUserAuthenticated()) {
      navigate("/signin");
      return;
    }
    if (!cartItems.length) {
      toast.info("Add at least one menu item before placing your order.");
      return;
    }

    setPlacingOrder(true);
    try {
      const response = await ordersAxios.post("/", {
        table_id: Number(localStorage.getItem("table_id")),
      });
      setOrderPlaced(response.data.data);
      setCartItems([]);
      setCartItemsCnt(0);
      setTotalBillAmt(0);
      setTotalBillProfit(0);
      setCheckoutRefreshKey((key) => key + 1);
      toast.success("Order placed successfully.");
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Unable to place your order.");
    } finally {
      setPlacingOrder(false);
    }
  };

  const subtotal = Number(totalBillAmt) || 0;
  const tax = Number((subtotal * 0.05).toFixed(2));

  return (
    <main className="customer-cart-page">
      <div className="foodcart">
        <h1>Food Cart</h1>
      </div>
      {orderPlaced && (
        <section className="order-placed-message" role="status">
          <h2>Thank you for your order!</h2>
          <p>Please wait until your order is ready. Order #{orderPlaced.order_id}</p>
          <ButtonComponent color="button4" message="View My Orders" func={() => navigate("/myorders")} />
        </section>
      )}
      {cartError && <p className="orders-message" role="alert">{cartError}</p>}
      {loading ? (
        <Loader />
      ) : cartItems.length > 0 ? (
        <section className="cart1">
          <div className="flex1">
            <div className="cart">
              {cartItems.map((product) => (
                <CartItem
                  key={product.menu_name}
                  item={product}
                  cartItemsCnt={cartItemsCnt}
                  setCartItemsCnt={setCartItemsCnt}
                  totalBillAmt={totalBillAmt}
                  setTotalBillAmt={setTotalBillAmt}
                  totalBillProfit={totalBillProfit}
                  setTotalBillProfit={setTotalBillProfit}
                />
              ))}
            </div>
          </div>
          <aside className="checkout">
            <div className="totals">
              <h2>Draft order estimate</h2>
              <div className="flexrow"><span>Subtotal:</span><span>₹{subtotal.toLocaleString("en-IN")}</span></div>
              <div className="flexrow"><span>Tax (5%):</span><span>₹{tax.toFixed(2)}</span></div>
              <div className="flexrow"><strong>Estimated total:</strong><strong>₹{(subtotal + tax).toFixed(2)}</strong></div>
            </div>
            <div className="checkingout">
              <button type="button" onClick={() => navigate("/menu")}>Menu</button>
              <button type="button" onClick={placeOrder} disabled={placingOrder}>
                {placingOrder ? "Placing..." : "Place Order"}
              </button>
            </div>
          </aside>
        </section>
      ) : (
        <section className="empty-cart-section">
          <h2 className="emptycart">Your cart is empty. Add items from the menu to place a new order.</h2>
          <ButtonComponent color="primary" message="View Menu" func={() => navigate("/menu")} />
        </section>
      )}
      <OrderCheckout refreshKey={checkoutRefreshKey} />
    </main>
  );
}

export default Cart;
