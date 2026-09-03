const express = require("express");
const db = require("../db");

const router = express.Router();

// Create review
router.post("/", (req, res) => {
    const {
        order_id,
        reviewer_id,
        reviewee_id,
        rating,
        comment
    } = req.body;

    if (!order_id || !reviewer_id || !reviewee_id || !rating) {
        return res.status(400).json({
            error: "order_id, reviewer_id, reviewee_id and rating are required"
        });
    }

    if (rating < 1 || rating > 5) {
        return res.status(400).json({
            error: "Rating must be between 1 and 5"
        });
    }

    const sql = `
        INSERT INTO reviews
        (order_id, reviewer_id, reviewee_id, rating, comment)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            order_id,
            reviewer_id,
            reviewee_id,
            rating,
            comment || null
        ],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.status(201).json({
                message: "Review submitted successfully ✅",
                review_id: result.insertId
            });
        }
    );
});

module.exports = router;