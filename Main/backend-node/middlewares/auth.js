const jwt = require('jsonwebtoken');

// authentication of the token when loggedIn as Admin
const authenticateToken = (req, res, next) => {
    // console.log(req.headers)
    const authHeader = req.headers['authorization']
    // console.log(authHeader)
    if (authHeader) {
        const accessToken = authHeader.split(' ')[1]
        if (!accessToken) {
            return res.status(401).json({ message: "Unauthorized !!" })
        }
        if (!process.env.ACCESS_TOKEN_SECRET) {
            return res.status(503).json({ message: "Authentication is not configured on the server." })
        }
        // console.log(accessToken)
        jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
            if (err) {
                return res.status(403).json({ message: "Invalid accessToken !!" })
            }
            if (!payload || !payload.admin_id) {
                return res.status(403).json({ message: "Administrator access is required." })
            }
            req.admin = payload;
            return next()
        })
    }
    else return res.status(401).json({ message: "Unauthorized !!" })
}

module.exports = authenticateToken;