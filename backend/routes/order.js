const express = require("express");
const db = require("../db");

const router = express.Router();


// ==========================================
// CREATE ORDER
// POST /api/orders
// ==========================================

router.post("/", (req, res) => {

    const {
        request_id,
        farmer_id,
        buyer_id,
        listing_id,
        quantity,
        agreed_price
    } = req.body;

    if (
        !request_id ||
        !farmer_id ||
        !buyer_id ||
        !listing_id ||
        !quantity ||
        agreed_price === undefined
    ) {
        return res.status(400).json({
            error: "All order fields are required"
        });
    }

    if (Number(quantity) <= 0) {
        return res.status(400).json({
            error: "Quantity must be greater than 0"
        });
    }

    if (Number(agreed_price) < 0) {
        return res.status(400).json({
            error: "Agreed price cannot be negative"
        });
    }

    const total_amount =
        Number(quantity) * Number(agreed_price);

    const sql =
        "INSERT INTO orders " +
        "(request_id, farmer_id, buyer_id, listing_id, quantity, agreed_price, total_amount) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?)";

    db.query(
        sql,
        [
            request_id,
            farmer_id,
            buyer_id,
            listing_id,
            quantity,
            agreed_price,
            total_amount
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.status(201).json({
                message: "Order created successfully",
                order_id: result.insertId,
                total_amount: total_amount
            });
        }
    );
});


// ==========================================
// GET BUYER ORDERS
// GET /api/orders/buyer/:buyer_id
// ==========================================

router.get("/buyer/:buyer_id", (req, res) => {

    const buyer_id = req.params.buyer_id;

    const sql =
        "SELECT " +
        "o.order_id, " +
        "o.request_id, " +
        "o.farmer_id, " +
        "o.buyer_id, " +
        "o.listing_id, " +
        "o.quantity, " +
        "o.agreed_price, " +
        "o.total_amount, " +
        "o.status, " +
        "o.order_date, " +
        "o.updated_at, " +

        "c.crop_name, " +

        "fp.farm_name, " +
        "fp.address AS farmer_address, " +
        "fp.district AS farmer_district, " +
        "fp.state AS farmer_state, " +

        "u.name AS farmer_name, " +
        "u.phone AS farmer_phone, " +
        "u.email AS farmer_email, " +

        "p.payment_id, " +
        "p.payment_status, " +
        "p.payment_method, " +
        "p.transaction_id, " +
        "p.payment_date " +

        "FROM orders o " +

        "JOIN crop_listings cl " +
        "ON o.listing_id = cl.listing_id " +

        "JOIN crops c " +
        "ON cl.crop_id = c.crop_id " +

        "JOIN farmer_profiles fp " +
        "ON o.farmer_id = fp.farmer_id " +

        "JOIN users u " +
        "ON fp.user_id = u.user_id " +

        "LEFT JOIN payments p " +
        "ON o.order_id = p.order_id " +

        "WHERE o.buyer_id = ? " +

        "ORDER BY o.order_date DESC";

    db.query(
        sql,
        [buyer_id],
        (err, results) => {

            if (err) {
                console.error(
                    "Get buyer orders error:",
                    err.message
                );

                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                orders: results
            });
        }
    );
});


// ==========================================
// GET FARMER ORDERS
// GET /api/orders/farmer/:farmer_id
// ==========================================

router.get("/farmer/:farmer_id", (req, res) => {

    const farmer_id = req.params.farmer_id;

    const sql =
        "SELECT " +
        "o.order_id, " +
        "o.request_id, " +
        "o.farmer_id, " +
        "o.buyer_id, " +
        "o.listing_id, " +
        "o.quantity, " +
        "o.agreed_price, " +
        "o.total_amount, " +
        "o.status, " +
        "o.order_date, " +
        "o.updated_at, " +

        "c.crop_name, " +

        "bp.business_name, " +
        "bp.address AS buyer_address, " +
        "bp.district AS buyer_district, " +
        "bp.state AS buyer_state, " +
        "bp.rating AS buyer_rating, " +

        "u.name AS buyer_name, " +
        "u.phone AS buyer_phone, " +
        "u.email AS buyer_email, " +

        "p.payment_id, " +
        "p.payment_status, " +
        "p.payment_method, " +
        "p.transaction_id, " +
        "p.payment_date " +

        "FROM orders o " +

        "JOIN crop_listings cl " +
        "ON o.listing_id = cl.listing_id " +

        "JOIN crops c " +
        "ON cl.crop_id = c.crop_id " +

        "JOIN buyer_profiles bp " +
        "ON o.buyer_id = bp.buyer_id " +

        "JOIN users u " +
        "ON bp.user_id = u.user_id " +

        "LEFT JOIN payments p " +
        "ON o.order_id = p.order_id " +

        "WHERE o.farmer_id = ? " +

        "ORDER BY o.order_date DESC";

    db.query(
        sql,
        [farmer_id],
        (err, results) => {

            if (err) {
                console.error(
                    "Get farmer orders error:",
                    err.message
                );

                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                orders: results
            });
        }
    );
});


// ==========================================
// GET SINGLE ORDER
// GET /api/orders/:order_id
// ==========================================

router.get("/:order_id", (req, res) => {

    const order_id = req.params.order_id;

    const sql =
        "SELECT " +
        "o.order_id, " +
        "o.request_id, " +
        "o.farmer_id, " +
        "o.buyer_id, " +
        "o.listing_id, " +
        "o.quantity, " +
        "o.agreed_price, " +
        "o.total_amount, " +
        "o.status, " +
        "o.order_date, " +
        "o.updated_at, " +

        "c.crop_name, " +

        "p.payment_id, " +
        "p.payment_status, " +
        "p.payment_method, " +
        "p.transaction_id, " +
        "p.payment_date " +

        "FROM orders o " +

        "JOIN crop_listings cl " +
        "ON o.listing_id = cl.listing_id " +

        "JOIN crops c " +
        "ON cl.crop_id = c.crop_id " +

        "LEFT JOIN payments p " +
        "ON o.order_id = p.order_id " +

        "WHERE o.order_id = ?";

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
                    error: "Order not found"
                });
            }

            res.json({
                order: results[0]
            });
        }
    );
});


// ==========================================
// TEST
// GET /api/orders/test
// ==========================================

router.get("/test", (req, res) => {

    res.json({
        message: "Order route is working"
    });
});


module.exports = router;
