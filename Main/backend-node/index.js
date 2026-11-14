const express = require("express");
const compression = require('compression');
const cors = require("cors");
const { SERVER_PORT, RELATION1, RELATION2, RELATION3, RELATION4, 
    RELATION5, RELATION6, RELATION7, RELATION8, RELATION9, RELATION10 } = require("./config.js")
const pool = require("./db.js")
const categoryRouter = require("./routes/categoryRoute.js");
const restaurantMenuRouter = require("./routes/restaurantMenuRoute.js");
const tableRouter = require("./routes/table.js");
const feedbackRouter = require("./routes/feedbackRoute.js");
const adminRouter = require("./routes/adminRoute.js");
const cartRouter = require("./routes/cartRoute.js");
const cartItemsRouter = require("./routes/cartItemsRoute.js");
const userRouter = require("./routes/userRoute.js");
const analysisRouter = require("./routes/analysisRoute.js");
// const ordersRouter = require("./routes/ordersRoute.js");
// const paymentRouter = require("./routes/paymentRoute.js");

const app = express();

// middlewares::
app.use(cors())
app.use(express.json())
// compress all responses
app.use(compression());

app.use("/menu",restaurantMenuRouter)
app.use("/category",categoryRouter)
app.use("/table",tableRouter)
app.use("/feedback",feedbackRouter)
app.use("/admin",adminRouter)
app.use("/cart",cartRouter)
app.use("/cart_items",cartItemsRouter)
app.use("/users",userRouter)
app.use("/analysis",analysisRouter)
// app.use("/orders",ordersRouter)
// app.use("/payment",paymentRouter)

const initializeDatabase = async () => {
    await pool.query(`CREATE TABLE IF NOT EXISTS "${RELATION10}"(
                user_email VARCHAR PRIMARY KEY,
                user_name VARCHAR NOT NULL,
                password_hash VARCHAR);`);
    await pool.query(`ALTER TABLE "${RELATION10}" ADD COLUMN IF NOT EXISTS password_hash VARCHAR;`);
    await pool.query(`CREATE TABLE IF NOT EXISTS "${RELATION1}"(
                category_id VARCHAR PRIMARY KEY, 
                "categoryName" VARCHAR NOT NULL UNIQUE);`);
    await pool.query(`CREATE TABLE IF NOT EXISTS "${RELATION2}"(
                menu_id VARCHAR PRIMARY KEY, 
                "categoryName" VARCHAR NOT NULL REFERENCES category("categoryName") 
                    ON DELETE CASCADE
                    ON UPDATE CASCADE, 
                menu_name VARCHAR NOT NULL UNIQUE, 
                description TEXT, 
                price INT NOT NULL,
                profit INT NOT NULL, 
                img TEXT);`);
    await pool.query(`CREATE TABLE IF NOT EXISTS "${RELATION3}"(
                table_id INT PRIMARY KEY, 
                capacity INT NOT NULL, 
                availability_status VARCHAR NOT NULL,
                booked_by VARCHAR REFERENCES "${RELATION10}"(user_email));`);
    await pool.query(`ALTER TABLE "${RELATION3}" ADD COLUMN IF NOT EXISTS booked_by VARCHAR REFERENCES "${RELATION10}"(user_email);`);
    await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS unique_active_table_booking_per_user ON "${RELATION3}"(booked_by) WHERE booked_by IS NOT NULL;`);
    await pool.query(`CREATE TABLE IF NOT EXISTS ${RELATION4}(
                feedback_id VARCHAR PRIMARY KEY, 
                starate1 INT, 
                starate2 INT, 
                comments TEXT, 
                date_time TIMESTAMP NOT NULL);`);
    await pool.query(`CREATE TABLE IF NOT EXISTS "${RELATION5}"(
                admin_id VARCHAR PRIMARY KEY, 
                admin_name VARCHAR NOT NULL UNIQUE, 
                "password" VARCHAR NOT NULL);`);
    await pool.query(`CREATE TABLE IF NOT EXISTS ${RELATION6}(
                    table_id INT NOT NULL REFERENCES "${RELATION3}"(table_id) ON UPDATE CASCADE,
                    menu_name VARCHAR REFERENCES "${RELATION2}"(menu_name),
                    quantity INT NOT NULL,
                    item_price INT NOT NULL, 
                    total_price INT NOT NULL, 
                    item_profit INT NOT NULL,
                    total_profit INT NOT NULL,
                    date_time TIMESTAMP WITH TIME ZONE NOT NULL,
                    PRIMARY KEY (table_id, menu_name) );`);
    await pool.query(`CREATE TABLE IF NOT EXISTS ${RELATION7}(
                    table_id INT NOT NULL PRIMARY KEY REFERENCES "${RELATION3}"(table_id) ON UPDATE CASCADE,
                    total_bill_amount INT NOT NULL,
                    total_bill_profit INT NOT NULL,
                    date_time TIMESTAMP NOT NULL );`);
    await pool.query(`CREATE TABLE IF NOT EXISTS ${RELATION8}(
                    order_id VARCHAR PRIMARY KEY,
                    total_bill_amount INT NOT NULL,
                    total_bill_profit INT NOT NULL,
                    payment_mode VARCHAR NOT NULL,
                    date_time TIMESTAMP NOT NULL
    );`);
    await pool.query(`CREATE TABLE IF NOT EXISTS ${RELATION9}(
                    order_id VARCHAR REFERENCES ${RELATION8}(order_id),
                    menu_name VARCHAR NOT NULL,
                    quantity INT NOT NULL, 
                    total_price INT NOT NULL,
                    total_profit INT NOT NULL,
                    date_time TIMESTAMP NOT NULL,
                    PRIMARY KEY (order_id, menu_name) );`);
};

app.get('/', async (req, res) => {
    try {
        await initializeDatabase();
        return res.status(200).send("Welcome to PERN !!");
    } catch (error) {
        console.error("Unable to initialize database:", error.message);
        return res.status(500).json({ message: "Can't connect to DB!!" });
    }
});

if (require.main === module) {
    initializeDatabase().then(() => {
        app.listen(SERVER_PORT, () => {
            console.log(`SERVER listening on PORT_NO = ${SERVER_PORT}`);
        });
    }).catch((error) => {
        console.error("Unable to initialize database:", error.message);
        process.exitCode = 1;
    });
}

module.exports = app;