const express = require("express");
const db = require("../db");

const router = express.Router();

router.post("/profile", (req, res) => {
    const {
        user_id,
        farm_name,
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

    const sql =
        "INSERT INTO farmer_profiles " +
        "(user_id, farm_name, address, district, state, pincode, latitude, longitude) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

    db.query(
        sql,
        [
            user_id,
            farm_name || null,
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
                message: "Farmer profile created successfully",
                farmer_id: result.insertId
            });
        }
    );
});

router.get("/profile/:user_id", (req, res) => {
    const user_id = req.params.user_id;

    const sql =
        "SELECT farmer_id, user_id, farm_name, address, district, state, " +
        "pincode, latitude, longitude, created_at " +
        "FROM farmer_profiles WHERE user_id = ?";

    db.query(sql, [user_id], (err, results) => {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                error: "Farmer profile not found"
            });
        }

        res.json({
            farmer: results[0]
        });
    });
});

router.get("/price-prediction/:crop_id", (req, res) => {
    const crop_id = req.params.crop_id;

    const sql =
        "SELECT prediction_id, crop_id, market_name, predicted_price, " +
        "unit, prediction_date, target_date, model_version " +
        "FROM price_predictions " +
        "WHERE crop_id = ? " +
        "ORDER BY prediction_date DESC LIMIT 1";

    db.query(sql, [crop_id], (err, results) => {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                error: "Price prediction not found"
            });
        }

        res.json({
            prediction: results[0]
        });
    });
});

router.get("/demand-prediction/:crop_id", (req, res) => {
    const crop_id = req.params.crop_id;

    const sql =
        "SELECT demand_prediction_id, crop_id, market_name, " +
        "demand_status, trend_value, prediction_date, target_date, model_version " +
        "FROM demand_predictions " +
        "WHERE crop_id = ? " +
        "ORDER BY prediction_date DESC LIMIT 1";

    db.query(sql, [crop_id], (err, results) => {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                error: "Demand prediction not found"
            });
        }

        res.json({
            prediction: results[0]
        });
    });
});

router.get("/test", (req, res) => {
    res.json({
        message: "Farmer route is working"
    });
});

module.exports = router;