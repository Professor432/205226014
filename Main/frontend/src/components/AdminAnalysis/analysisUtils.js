export function buildOrderSharePoints(dailySales) {
  const totalOrders = dailySales.reduce((total, item) => total + Number(item.order_count), 0);
  if (totalOrders === 0) {
    return [];
  }

  let assignedPercentage = 0;
  return dailySales.map((item, index) => {
    const percentage = index === dailySales.length - 1
      ? Number((100 - assignedPercentage).toFixed(2))
      : Number(((Number(item.order_count) / totalOrders) * 100).toFixed(2));
    assignedPercentage += percentage;
    return { label: `Day ${item.day}`, y: percentage };
  });
}
