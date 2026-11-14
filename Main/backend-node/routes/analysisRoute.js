const express = require("express");
const pool = require("../db.js");
const authenticateAdmin = require("../middlewares/auth.js");

const analysisRouter = express.Router();

analysisRouter.get("/", authenticateAdmin, async (req, res) => {
    const month = req.query.month ? Number(req.query.month) : null;
    if (month !== null && (!Number.isInteger(month) || month < 1 || month > 12)) {
        return res.status(400).json({ message: "Month must be between 1 and 12." });
    }

    try {
        const [dailySales, foodRatings, serviceRatings] = await Promise.all([
            pool.query(
                `SELECT day, SUM(order_count)::int AS order_count, SUM(profit)::numeric AS profit
                 FROM (
                     SELECT EXTRACT(DAY FROM date_time)::int AS day,
                            COUNT(DISTINCT table_id)::numeric AS order_count,
                            COALESCE(SUM(total_profit), 0)::numeric AS profit
                     FROM cart_items
                     WHERE ($1::int IS NULL OR EXTRACT(MONTH FROM date_time)::int = $1)
                     GROUP BY EXTRACT(DAY FROM date_time)::int
                     UNION ALL
                     SELECT EXTRACT(DAY FROM date_time)::int AS day,
                            COUNT(*)::numeric AS order_count,
                            COALESCE(SUM(total_bill_profit), 0)::numeric AS profit
                     FROM payment
                     WHERE ($1::int IS NULL OR EXTRACT(MONTH FROM date_time)::int = $1)
                     GROUP BY EXTRACT(DAY FROM date_time)::int
                 ) AS sales
                 GROUP BY day
                 ORDER BY day`,
                [month]
            ),
            pool.query(
                `SELECT starate2 AS rating, COUNT(*)::int AS count
                 FROM feedback
                 WHERE starate2 IS NOT NULL
                   AND ($1::int IS NULL OR EXTRACT(MONTH FROM date_time)::int = $1)
                 GROUP BY starate2
                 ORDER BY starate2`,
                [month]
            ),
            pool.query(
                `SELECT starate1 AS rating, COUNT(*)::int AS count
                 FROM feedback
                 WHERE starate1 IS NOT NULL
                   AND ($1::int IS NULL OR EXTRACT(MONTH FROM date_time)::int = $1)
                 GROUP BY starate1
                 ORDER BY starate1`,
                [month]
            )
        ]);

        res.setHeader("Cache-Control", "no-store");
        return res.status(200).json({
            data: {
                dailySales: dailySales.rows,
                foodRatings: foodRatings.rows,
                serviceRatings: serviceRatings.rows
            }
        });
    } catch (error) {
        console.error("Unable to load sales analysis:", error.message);
        return res.status(500).json({ message: "Unable to load sales analysis." });
    }
});

module.exports = analysisRouter;
