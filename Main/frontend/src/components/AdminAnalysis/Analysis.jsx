import React, { useEffect, useMemo, useState } from 'react';
import CanvasJSReact from '@canvasjs/react-charts';
import { analysis as analysisAxios } from '../AxiosCreate';
import Loader from '../Loader/Loader';
import './Analysis.css';
import { buildOrderSharePoints } from './analysisUtils';

const CanvasJSChart = CanvasJSReact.CanvasJSChart;
const DARKER_GROTESQUE_FONT = 'Darker Grotesque';

const chartTheme = {
  animationEnabled: true,
  exportEnabled: true,
  backgroundColor: '#942D2D',
  theme: 'dark2',
  height: 320,
};

const ratingPoints = (ratings) => ratings.map(({ rating, count }) => ({
  label: `${rating} star${Number(rating) === 1 ? '' : 's'}`,
  y: Number(count),
}));

export default function Analysis() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [dailySales, setDailySales] = useState([]);
  const [foodRatings, setFoodRatings] = useState([]);
  const [serviceRatings, setServiceRatings] = useState([]);

  useEffect(() => {
    let active = true;
    const fetchAnalysis = async () => {
      setLoading(true);
      setError('');
      try {
        const params = selectedMonth ? `?month=${selectedMonth}` : '';
        const response = await analysisAxios.get(`/${params}`);
        if (active) {
          setDailySales(response.data.data.dailySales);
          setFoodRatings(response.data.data.foodRatings);
          setServiceRatings(response.data.data.serviceRatings);
        }
      } catch (requestError) {
        console.error('Unable to load sales analysis:', requestError);
        if (active) {
          setError(requestError.response?.data?.message || requestError.message || 'Sales analysis could not be loaded.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchAnalysis();
    return () => {
      active = false;
    };
  }, [selectedMonth, refreshKey]);

  const totalOrders = useMemo(
    () => dailySales.reduce((total, item) => total + Number(item.order_count), 0),
    [dailySales]
  );
  const totalProfit = useMemo(
    () => dailySales.reduce((total, item) => total + Number(item.profit), 0),
    [dailySales]
  );
  const orderSharePoints = useMemo(() => buildOrderSharePoints(dailySales), [dailySales]);

  const orderCountOptions = {
    ...chartTheme,
    title: { text: 'Day-wise Order Share' },
    data: [{
      type: 'pie',
      startAngle: -90,
      indexLabel: '{label}: {y}%',
      toolTipContent: '{label}: {y}%',
      dataPoints: orderSharePoints,
    }],
  };

  const profitOptions = {
    ...chartTheme,
    title: { text: 'Day-wise Profit' },
    axisY: {
      title: 'Profit (₹)',
      includeZero: true,
      gridColor: 'rgba(235, 242, 213, 0.18)',
    },
    axisX: { title: 'Day of month' },
    data: [{
      type: 'column',
      color: '#E8B45B',
      dataPointWidth: 24,
      indexLabel: '{y}',
      indexLabelFontColor: '#EBF2D5',
      toolTipContent: '{label}: ₹{y}',
      dataPoints: dailySales.map((item) => ({
        label: `Day ${item.day}`,
        y: Number(item.profit),
      })),
    }],
  };

  const foodRatingOptions = {
    ...chartTheme,
    title: { text: 'Food Ratings' },
    axisY: { title: 'Number of reviews', includeZero: true },
    data: [{
      type: 'column',
      color: '#D46C5D',
      dataPointWidth: 30,
      dataPoints: ratingPoints(foodRatings),
    }],
  };

  const serviceRatingOptions = {
    ...chartTheme,
    title: { text: 'Service Ratings' },
    axisY: { title: 'Number of reviews', includeZero: true },
    data: [{
      type: 'column',
      color: '#8AB17D',
      dataPointWidth: 30,
      dataPoints: ratingPoints(serviceRatings),
    }],
  };

  return (
    <main className="sales-analysis" style={{
      backgroundColor: '#EBF2D5',
      color: '#942D2D',
      padding: '24px clamp(16px, 5vw, 64px)',
      fontFamily: `${DARKER_GROTESQUE_FONT}, sans-serif`,
    }}>
      <header className="sales-analysis-header">
        <div>
          <h1>Live Restaurant Analysis</h1>
          <p>Sales use persistent placed-order history; ratings are based on saved customer feedback.</p>
        </div>
        <label htmlFor="monthDropdown">
          Month
          <select
            id="monthDropdown"
            onChange={(event) => setSelectedMonth(event.target.value)}
            value={selectedMonth}
          >
            <option value="">All months</option>
            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
              .map((month, index) => <option key={month} value={index + 1}>{month}</option>)}
          </select>
        </label>
      </header>

      {loading ? (
        <Loader />
      ) : error ? (
        <div className="sales-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setRefreshKey((key) => key + 1)}>Retry</button>
        </div>
      ) : (
        <>
          <section className="sales-summary" aria-label="Sales summary">
            <article>
              <span>Orders</span>
              <strong>{totalOrders}</strong>
            </article>
            <article>
              <span>Profit</span>
              <strong>₹{totalProfit.toLocaleString('en-IN')}</strong>
            </article>
          </section>
          {totalOrders === 0 && (
            <p className="sales-empty">No sales data was found for this period.</p>
          )}
          <section className="sales-charts">
            <div className="sales-chart"><CanvasJSChart options={orderCountOptions} /></div>
            <div className="sales-chart"><CanvasJSChart options={profitOptions} /></div>
            <div className="sales-chart"><CanvasJSChart options={foodRatingOptions} /></div>
            <div className="sales-chart"><CanvasJSChart options={serviceRatingOptions} /></div>
          </section>
        </>
      )}
    </main>
  );
}
