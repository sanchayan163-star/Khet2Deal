const express = require("express");
const db = require("../db");

const router = express.Router();

// Real nearby buyer recommendation
router.post("/", (req, res) => {
    const { farmer_id, listing_id } = req.body;

    if (!farmer_id) {
        return res.status(400).json({
            error: "farmer_id is required"
        });
    }

    // Get farmer GPS location
    const farmerSql = `
        SELECT latitude, longitude
        FROM farmer_profiles
        WHERE farmer_id = ?
    `;

    db.query(farmerSql, [farmer_id], (err, farmerResult) => {
        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        if (farmerResult.length === 0) {
            return res.status(404).json({
                error: "Farmer not found"
            });
        }

        const farmer = farmerResult[0];

        if (farmer.latitude == null || farmer.longitude == null) {
            return res.status(400).json({
                error: "Farmer GPS location not available"
            });
        }

        // Get buyers with GPS location
        const buyerSql = `
            SELECT
                bp.buyer_id,
                u.name AS buyer_name,
                bp.business_name,
                bp.latitude,
                bp.longitude,
                bp.rating
            FROM buyer_profiles bp
            JOIN users u
                ON bp.user_id = u.user_id
            WHERE bp.latitude IS NOT NULL
              AND bp.longitude IS NOT NULL
        `;

        db.query(buyerSql, (err, buyers) => {
            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (buyers.length === 0) {
                return res.status(404).json({
                    error: "No buyers with GPS location found"
                });
            }

            const farmerLat = Number(farmer.latitude);
            const farmerLon = Number(farmer.longitude);

            // Haversine distance in kilometers
            function calculateDistance(lat1, lon1, lat2, lon2) {
                const R = 6371;

                const dLat =
                    (lat2 - lat1) * Math.PI / 180;

                const dLon =
                    (lon2 - lon1) * Math.PI / 180;

                const a =
                    Math.sin(dLat / 2) ** 2 +
                    Math.cos(lat1 * Math.PI / 180) *
                    Math.cos(lat2 * Math.PI / 180) *
                    Math.sin(dLon / 2) ** 2;

                const c =
                    2 * Math.atan2(
                        Math.sqrt(a),
                        Math.sqrt(1 - a)
                    );

                return R * c;
            }

            buyers.forEach(buyer => {

                buyer.distance_km = Number(
                    calculateDistance(
                        farmerLat,
                        farmerLon,
                        Number(buyer.latitude),
                        Number(buyer.longitude)
                    ).toFixed(2)
                );

                // Temporary price until real buyer price is connected
                buyer.price_per_kg = 30;

                const priceScore =
                    (buyer.price_per_kg / 33) * 100;

                const distanceScore =
                    (1 / Math.max(buyer.distance_km, 1)) * 100;

                const ratingScore =
                    (Number(buyer.rating || 0) / 5) * 100;

                buyer.score = Number(
                    (
                        priceScore * 0.5 +
                        distanceScore * 0.2 +
                        ratingScore * 0.3
                    ).toFixed(2)
                );
            });

            // Highest score first
            buyers.sort((a, b) => b.score - a.score);

            const bestBuyer = buyers[0];

            const insertSql = `
                INSERT INTO recommendations
                (farmer_id, listing_id, buyer_id, score, reason)
                VALUES (?, ?, ?, ?, ?)
            `;

            db.query(
                insertSql,
                [
                    farmer_id,
                    listing_id || null,
                    bestBuyer.buyer_id,
                    bestBuyer.score,
                    "Recommended using buyer price, GPS distance and rating."
                ],
                (err, result) => {

                    if (err) {
                        return res.status(500).json({
                            error: err.message
                        });
                    }

                    res.status(201).json({
                        message:
                            "Real buyer recommendation created successfully ✅",

                        recommendation_id:
                            result.insertId,

                        recommended_buyer:
                            bestBuyer,

                        all_buyers:
                            buyers
                    });
                }
            );
        });
    });
});

module.exports = router;