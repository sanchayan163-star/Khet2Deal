const express = require("express");
const db = require("../db");

const router = express.Router();

// Create buyer profile
router.post("/profile", (req, res) => {
    const {
        user_id,
        business_name,
        address,
        district,
        state,
        pincode,
        latitude,
        longitude
    } = req.body;

    if (!user_id || !district || !state) {
        return res.status(400).json({
            error: "user_id, district and state are required"
        });
    }

    const sql = `
        INSERT INTO buyer_profiles
        (user_id, business_name, address, district, state, pincode, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            user_id,
            business_name || null,
            address || null,
            district,
            state,
            pincode || null,
            latitude || null,
            longitude || null
        ],
        (err, result) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.status(201).json({
                message: "Buyer profile created successfully ✅",
                buyer_id: result.insertId
            });
        }
    );
});

module.exports = router;