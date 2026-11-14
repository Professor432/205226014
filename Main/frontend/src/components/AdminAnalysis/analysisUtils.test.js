import { buildOrderSharePoints } from './analysisUtils';

test('order share percentages add up to exactly 100', () => {
  const points = buildOrderSharePoints([
    { day: 1, order_count: '1' },
    { day: 2, order_count: '1' },
    { day: 3, order_count: '1' },
  ]);

  expect(points.reduce((total, point) => total + point.y, 0)).toBe(100);
});

test('order share is empty when there are no orders', () => {
  expect(buildOrderSharePoints([])).toEqual([]);
});
