import React, { useEffect, useState } from 'react';
import './orders.css';
import { cartItems as cartItemsAxios, cart as cartAxios } from "../AxiosCreate";
import Loader from '../Loader/Loader';

const Orders = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ordersByTable, setOrdersByTable] = useState({});
  const [totalBillByTable, setTotalBillByTable] = useState({});

  useEffect(() => {
    let active = true;
    const fetchOrders = async () => {
      try {
        const [itemsResponse, totalsResponse] = await Promise.all([
          cartItemsAxios.get('/'),
          cartAxios.get('/'),
        ]);
        if (!active) {
          return;
        }

        const groupedOrders = itemsResponse.data.data.reduce((grouped, item) => {
          const tableId = item.table_id;
          if (!grouped[tableId]) {
            grouped[tableId] = [];
          }
          grouped[tableId].push(item);
          return grouped;
        }, {});
        const totals = totalsResponse.data.data.reduce((byTable, cart) => {
          byTable[cart.table_id] = Number(cart.total_bill_amount);
          return byTable;
        }, {});

        setOrdersByTable(groupedOrders);
        setTotalBillByTable(totals);
        setError('');
      } catch (requestError) {
        console.error('Unable to load order details:', requestError);
        if (active) {
          setError('Order details could not be loaded. Please try again.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchOrders();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="admin-orders">
      <h1>Order Details</h1>
      {loading ? (
        <Loader />
      ) : error ? (
        <p className="orders-message" role="alert">{error}</p>
      ) : Object.keys(ordersByTable).length === 0 ? (
        <p className="orders-message">There are no active orders at the moment.</p>
      ) : (
        <section className="orders">
          {Object.entries(ordersByTable).map(([tableId, orders]) => (
            <article className="order" key={tableId}>
              <header className="order-heading">
                <h2>Table #{tableId}</h2>
                <span>{orders.length} item{orders.length === 1 ? '' : 's'}</span>
              </header>
              <div className="order-row order-column-headings">
                <span>Menu item</span>
                <span>Quantity</span>
                <span>Item price</span>
                <span>Total</span>
              </div>
              {orders.map((order) => (
                <div key={`${tableId}-${order.menu_name}`} className="order-row">
                  <span>{order.menu_name}</span>
                  <span>{order.quantity}</span>
                  <span>₹{Number(order.item_price).toLocaleString('en-IN')}</span>
                  <span>₹{Number(order.total_price).toLocaleString('en-IN')}</span>
                </div>
              ))}
              <p className="totalBillAmt">
                Current bill: ₹{(totalBillByTable[tableId] || 0).toLocaleString('en-IN')}
              </p>
            </article>
          ))}
        </section>
      )}
    </main>
  );
};

export default Orders;
