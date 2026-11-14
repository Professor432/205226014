const assert = require("assert");
const { calculateOrderTotals } = require("../utils/orderTotals.js");

describe("order totals", () => {
    it("calculates five percent tax in cents", () => {
        assert.deepStrictEqual(calculateOrderTotals(101), {
            subtotal_amount: 101,
            tax_amount: 5.05,
            grand_total: 106.05
        });
    });

    it("returns zero totals for a zero subtotal", () => {
        assert.deepStrictEqual(calculateOrderTotals(0), {
            subtotal_amount: 0,
            tax_amount: 0,
            grand_total: 0
        });
    });

    it("calculates totals for decimal menu prices", () => {
        assert.deepStrictEqual(calculateOrderTotals(55.5), {
            subtotal_amount: 55.5,
            tax_amount: 2.78,
            grand_total: 58.28
        });
    });

    it("rejects amounts with more than two decimal places", () => {
        assert.throws(() => calculateOrderTotals(10.555), RangeError);
    });
});
