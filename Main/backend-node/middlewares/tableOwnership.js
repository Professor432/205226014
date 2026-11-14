const pool = require("../db.js");

const requireTableOwnership = async (req, res, next) => {
    const tableId = req.params.table_id || req.params.id || (req.body && req.body.table_id);
    if (!tableId) {
        return res.status(400).json({ message: "A table ID is required." });
    }

    try {
        const result = await pool.query(
            'SELECT 1 FROM "table" WHERE table_id = $1 AND booked_by = $2',
            [tableId, req.user.user_email]
        );
        if (result.rowCount === 0) {
            return res.status(403).json({ message: "This table is not booked under your account." });
        }
        return next();
    } catch (error) {
        console.error("Unable to verify table ownership:", error.message);
        return res.status(500).json({ message: "Unable to verify table access." });
    }
};

module.exports = requireTableOwnership;
