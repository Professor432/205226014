const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./config/db");

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test backend route
app.get("/", (req, res) => {
  res.json({
    message: "DineFlow backend is running!"
  });
});

// Test PostgreSQL connection
app.get("/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      message: "PostgreSQL connection successful!",
      time: result.rows[0].now
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      message: "PostgreSQL connection failed"
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});