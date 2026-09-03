const express = require("express");
const db = require("../db");

const router = express.Router();


// ==========================================
// CREATE PAYMENT
// POST /api/payments
// ==========================================

router.post("/", (req, res) => {

    const {
        order_id,
        amount,
        payment_method,
        transaction_id
    } = req.body;


    // Basic validation
    if (!order_id || !amount || !payment_method) {
        return res.status(400).json({
            error: "order_id, amount and payment_method are required"
        });
    }


    if (Number(amount) <= 0) {
        return res.status(400).json({
            error: "Payment amount must be greater than 0"
        });
    }


    const orderSql =
        "SELECT order_id, total_amount, status " +
        "FROM orders " +
        "WHERE order_id = ?";


    db.query(
        orderSql,
        [order_id],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }


            if (results.length === 0) {
                return res.status(404).json({
                    error: "Order not found"
                });
            }


            const order = results[0];

            const orderAmount =
                Number(order.total_amount);

            const paymentAmount =
                Number(amount);


            // Check payment amount
            if (paymentAmount !== orderAmount) {
                return res.status(400).json({
                    error:
                        "Payment amount must match order total amount",
                    order_total:
                        orderAmount,
                    payment_amount:
                        paymentAmount
                });
            }


            // Check whether payment already exists
            const existingPaymentSql =
                "SELECT payment_id, payment_status " +
                "FROM payments " +
                "WHERE order_id = ?";


            db.query(
                existingPaymentSql,
                [order_id],
                (err, existingPayments) => {

                    if (err) {
                        return res.status(500).json({
                            error: err.message
                        });
                    }


                    if (existingPayments.length > 0) {
                        return res.status(400).json({
                            error:
                                "Payment already exists for this order",
                            payment_id:
                                existingPayments[0].payment_id,
                            payment_status:
                                existingPayments[0].payment_status
                        });
                    }


                    // Insert payment
                    const paymentSql =
                        "INSERT INTO payments " +
                        "(order_id, amount, payment_method, payment_status, transaction_id, payment_date) " +
                        "VALUES (?, ?, ?, 'paid', ?, NOW())";


                    db.query(
                        paymentSql,
                        [
                            order_id,
                            paymentAmount,
                            payment_method,
                            transaction_id || null
                        ],
                        (err, result) => {

                            if (err) {
                                return res.status(500).json({
                                    error: err.message
                                });
                            }


                            res.status(201).json({

                                message:
                                    "Payment recorded successfully",

                                payment_id:
                                    result.insertId,

                                order_id:
                                    order_id,

                                amount:
                                    paymentAmount,

                                payment_method:
                                    payment_method,

                                payment_status:
                                    "paid"
                            });

                        }
                    );

                }
            );

        }
    );

});


// ==========================================
// GET PAYMENT BY ORDER
// GET /api/payments/order/:order_id
// ==========================================

router.get("/order/:order_id", (req, res) => {

    const order_id = req.params.order_id;


    const sql =
        "SELECT " +
        "payment_id, " +
        "order_id, " +
        "amount, " +
        "payment_method, " +
        "payment_status, " +
        "transaction_id, " +
        "payment_date, " +
        "created_at " +

        "FROM payments " +

        "WHERE order_id = ?";


    db.query(
        sql,
        [order_id],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }


            if (results.length === 0) {
                return res.status(404).json({
                    error: "Payment not found"
                });
            }


            res.json({
                payment: results[0]
            });

        }
    );

});


// ==========================================
// TEST
// GET /api/payments/test
// ==========================================

router.get("/test", (req, res) => {

    res.json({
        message: "Payment route is working"
    });

});


module.exports = router;