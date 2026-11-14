const jwt = require("jsonwebtoken");

const authenticateUser = (req, res, next) => {
    const authHeader = req.headers.authorization || "";
    const accessToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!accessToken) {
        return res.status(401).json({ message: "Please log in to continue." });
    }
    if (!process.env.ACCESS_TOKEN_SECRET) {
        return res.status(503).json({ message: "Authentication is not configured on the server." });
    }

    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (error, payload) => {
        if (error) {
            return res.status(401).json({ message: "Your session is invalid or has expired." });
        }
        if (!payload || payload.role !== "user" || !payload.user_email) {
            return res.status(403).json({ message: "A customer account is required." });
        }

        req.user = payload;
        return next();
    });
};

module.exports = authenticateUser;
