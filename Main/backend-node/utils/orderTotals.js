const ORDER_TAX_RATE = 0.05;

const calculateOrderTotals = (subtotal) => {
    const subtotalAmount = Number(subtotal);
    const subtotalCents = Math.round(subtotalAmount * 100);
    if (
        !Number.isFinite(subtotalAmount) ||
        subtotalAmount < 0 ||
        !Number.isSafeInteger(subtotalCents) ||
        Math.abs(subtotalAmount * 100 - subtotalCents) > 0.00001
    ) {
        throw new RangeError("Subtotal must be a non-negative amount with at most two decimal places.");
    }

    const taxCents = Math.round(subtotalCents * ORDER_TAX_RATE);
    const grandTotalCents = subtotalCents + taxCents;
    return {
        subtotal_amount: subtotalCents / 100,
        tax_amount: taxCents / 100,
        grand_total: grandTotalCents / 100
    };
};

module.exports = { calculateOrderTotals };
