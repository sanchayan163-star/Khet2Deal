const express = require("express");
const db = require("../db");

const router = express.Router();

// Create notification
router.post("/", (req, res) => {
    const {
        user_id,
        title,
        message,
        type
    } = req.body;

    if (!user_id || !title || !message || !type) {
        return res.status(400).json({
            error: "user_id, title, message and type are required"
        });
    }

    const sql = `
        INSERT INTO notifications
        (user_id, title, message, type, is_read)
        VALUES (?, ?, ?, ?, FALSE)
    `;

    db.query(
        sql,
        [user_id, title, message, type],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.status(201).json({
                message: "Notification created successfully ✅",
                notification_id: result.insertId
            });
        }
    );
});

module.exports = router;