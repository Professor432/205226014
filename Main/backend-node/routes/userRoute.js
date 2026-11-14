const express = require("express");
const pool = require("../db.js");
const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const authenticateUser = require("../middlewares/userAuth.js");
require("dotenv").config();

const userRoute = express.Router();
const scrypt = promisify(crypto.scrypt);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const hashPassword = async (password) => {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = await scrypt(password, salt, 64);
    return `scrypt$${salt}$${hash.toString("hex")}`;
};

const verifyPassword = async (password, storedHash) => {
    const [algorithm, salt, hashHex] = (storedHash || "").split("$");
    if (algorithm !== "scrypt" || !salt || !hashHex || !/^[a-f0-9]{128}$/i.test(hashHex)) {
        return false;
    }

    const expectedHash = Buffer.from(hashHex, "hex");
    const actualHash = await scrypt(password, salt, expectedHash.length);
    return crypto.timingSafeEqual(actualHash, expectedHash);
};

const createUserToken = (user) => jwt.sign(
    { user_email: user.user_email, user_name: user.user_name, role: "user" },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1d" }
);

userRoute.post("/register", async (req, res) => {
    try {
        const userName = typeof req.body.user_name === "string" ? req.body.user_name.trim() : "";
        const userEmail = typeof req.body.user_email === "string" ? req.body.user_email.trim().toLowerCase() : "";
        const password = typeof req.body.password === "string" ? req.body.password : "";

        if (!userName || !userEmail || !password) {
            return res.status(400).json({ message: "Name, email, and password are required." });
        }
        if (userName.length > 80 || !EMAIL_PATTERN.test(userEmail) || userEmail.length > 254) {
            return res.status(400).json({ message: "Enter a valid name and email address." });
        }
        if (password.length < 8 || password.length > 128) {
            return res.status(400).json({ message: "Password must be between 8 and 128 characters." });
        }
        if (!process.env.ACCESS_TOKEN_SECRET) {
            return res.status(503).json({ message: "Authentication is not configured on the server." });
        }

        const passwordHash = await hashPassword(password);
        const result = await pool.query(
            'INSERT INTO "User"(user_name, user_email, password_hash) VALUES($1, $2, $3) RETURNING user_name, user_email',
            [userName, userEmail, passwordHash]
        );
        const user = result.rows[0];
        return res.status(201).json({
            message: "Account created successfully.",
            user,
            accessToken: createUserToken(user)
        });
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({ message: "An account with this email already exists." });
        }
        console.error("User registration failed:", error.message);
        return res.status(500).json({ message: "Unable to create the account." });
    }
});

userRoute.post("/login", async (req, res) => {
    try {
        const userEmail = typeof req.body.user_email === "string" ? req.body.user_email.trim().toLowerCase() : "";
        const password = typeof req.body.password === "string" ? req.body.password : "";
        if (!userEmail || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }
        if (!process.env.ACCESS_TOKEN_SECRET) {
            return res.status(503).json({ message: "Authentication is not configured on the server." });
        }

        const result = await pool.query(
            'SELECT user_name, user_email, password_hash FROM "User" WHERE LOWER(user_email) = $1',
            [userEmail]
        );
        const user = result.rows[0];
        if (!user || !(await verifyPassword(password, user.password_hash))) {
            return res.status(401).json({ message: "Email or password is incorrect." });
        }

        return res.status(200).json({
            message: "Login successful.",
            user: { user_name: user.user_name, user_email: user.user_email },
            accessToken: createUserToken(user)
        });
    } catch (error) {
        console.error("User login failed:", error.message);
        return res.status(500).json({ message: "Unable to log in." });
    }
});

userRoute.get("/me", authenticateUser, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT user_name, user_email FROM "User" WHERE user_email = $1',
            [req.user.user_email]
        );
        if (!result.rows[0]) {
            return res.status(404).json({ message: "User not found." });
        }
        return res.status(200).json({ user: result.rows[0] });
    } catch (error) {
        console.error("Unable to retrieve user:", error.message);
        return res.status(500).json({ message: "Unable to retrieve user." });
    }
});

module.exports = userRoute;
