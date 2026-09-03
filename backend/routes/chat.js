const express = require("express");
const db = require("../db");

const router = express.Router();

// Send chat message
router.post("/", (req, res) => {
    const {
        sender_id,
        receiver_id,
        order_id,
        message
    } = req.body;

    if (!sender_id || !receiver_id || !message) {
        return res.status(400).json({
            error: "sender_id, receiver_id and message are required"
        });
    }

    const sql = `
        INSERT INTO chat_messages
        (sender_id, receiver_id, order_id, message, is_read)
        VALUES (?, ?, ?, ?, FALSE)
    `;

    db.query(
        sql,
        [
            sender_id,
            receiver_id,
            order_id || null,
            message
        ],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.status(201).json({
                message: "Chat message sent successfully ✅",
                message_id: result.insertId
            });
        }
    );
});

module.exports = router;