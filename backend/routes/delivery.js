const express = require("express");
const db = require("../db");

const router = express.Router();

// Create delivery
router.post("/", (req, res) => {
    const {
        order_id,
        delivery_address,
        delivery_date,
        transport_type,
        tracking_info
    } = req.body;

    if (!order_id || !delivery_address) {
        return res.status(400).json({
            error: "order_id and delivery_address are required"
        });
    }

    const sql = `
        INSERT INTO delivery
        (order_id, delivery_address, delivery_date, delivery_status, transport_type, tracking_info)
        VALUES (?, ?, ?, 'pending', ?, ?)
    `;

    db.query(
        sql,
        [
            order_id,
            delivery_address,
            delivery_date || null,
            transport_type || null,
            tracking_info || null
        ],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.status(201).json({
                message: "Delivery created successfully ✅",
                delivery_id: result.insertId
            });
        }
    );
});

module.exports = router;