const express = require("express");
const db = require("../db");

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                error: "Message is required"
            });
        }

        const text = message.toLowerCase();

        // =========================
        // ACTUAL CROP PRICE
        // =========================
        if (
            text.includes("price") ||
            text.includes("দাম")
        ) {
            let cropName = "Tomato";

            if (text.includes("potato")) {
                cropName = "Potato";
            } else if (text.includes("onion")) {
                cropName = "Onion";
            }

            const [rows] = await db.query(
                `
                SELECT 
                    c.crop_name,
                    pp.predicted_price,
                    pp.unit,
                    pp.target_date
                FROM price_predictions pp
                JOIN crops c 
                    ON pp.crop_id = c.crop_id
                WHERE c.crop_name = ?
                ORDER BY pp.prediction_id DESC
                LIMIT 1
                `,
                [cropName]
            );

            if (rows.length > 0) {
                const price = Number(rows[0].predicted_price).toFixed(2);

                return res.json({
                    success: true,
                    reply:
                        `🌱 ${rows[0].crop_name} predicted price: ₹${price} ${rows[0].unit}. ` +
                        `This prediction is for ${new Date(rows[0].target_date).toLocaleDateString("en-IN")}.`
                });
            }

            return res.json({
                success: true,
                reply: `Sorry, I don't have a price prediction available for ${cropName} right now.`
            });
        }

        // =========================
        // DEMAND
        // =========================
        else if (
    text.includes("demand") ||
    text.includes("চাহিদা")
) {
    const [rows] = await db.query(
        `
        SELECT
            c.crop_name,
            dp.demand_status,
            dp.trend_value,
            dp.target_date
        FROM demand_predictions dp
        JOIN crops c
            ON dp.crop_id = c.crop_id
        WHERE c.crop_name = ?
        ORDER BY dp.demand_prediction_id DESC
        LIMIT 1
        `,
        ["Tomato"]
    );

    if (rows.length > 0) {
        return res.json({
            success: true,
            reply:
                `📈 ${rows[0].crop_name} demand forecast: ` +
                `${rows[0].demand_status} ${rows[0].trend_value > 0 ? "↑" : rows[0].trend_value < 0 ? "↓" : "→"}. ` +
                `Forecast date: ${new Date(rows[0].target_date).toLocaleDateString("en-IN")}.`
        });
    }

    reply =
        "Sorry, demand forecast is not available right now.";
}         // =========================
        // BUYER
        // =========================
        else if (
    text.includes("buyer") ||
    text.includes("ক্রেতা")
) {
    const [rows] = await db.query(
        `
        SELECT
            bp.buyer_id,
            u.name AS buyer_name,
            bp.business_name,
            bp.district,
            bp.state,
            bp.rating
        FROM buyer_profiles bp
        JOIN users u
            ON bp.user_id = u.user_id
        WHERE bp.latitude IS NOT NULL
          AND bp.longitude IS NOT NULL
        ORDER BY bp.rating DESC
        LIMIT 1
        `
    );

    if (rows.length > 0) {
        const buyer = rows[0];

        return res.json({
            success: true,
            reply:
                `🤝 Best nearby buyer: ${buyer.business_name}. ` +
                `Buyer: ${buyer.buyer_name}. ` +
                `Location: ${buyer.district}, ${buyer.state}. ` +
                `Rating: ⭐ ${Number(buyer.rating).toFixed(1)}.`
        });
    }

    return res.json({
        success: true,
        reply: "Sorry, no nearby buyer is available right now."
    });
}
        // =========================
        // QUALITY
        // =========================
        else if (
            text.includes("quality") ||
            text.includes("গুণমান")
        ) {
            reply =
                "Upload your crop image while adding a crop listing. AI will estimate the crop quality percentage and grade.";
        }

        // =========================
        // ORDER
        // =========================
        else if (
            text.includes("order") ||
            text.includes("অর্ডার")
        ) {
            reply =
                "After a buyer sends a Buy Request, the farmer can accept it. Then an Order is created and the buyer can make the payment.";
        }

        // =========================
        // PAYMENT
        // =========================
        else if (
            text.includes("payment") ||
            text.includes("পেমেন্ট")
        ) {
            reply =
                "After an order is confirmed, the buyer can complete the payment from the Payments section.";
        }

        // =========================
        // HELLO
        // =========================
        else if (
            text.includes("hello") ||
            text.includes("hi") ||
            text.includes("হ্যালো")
        ) {
            reply =
                "Hello! 👋 I am Khet2Deal Assistant. I can help you with crop quality, price prediction, demand, buyers, orders and payments.";
        }

        // =========================
        // DEFAULT
        // =========================
        else {
            reply =
                "I can help you with Crop Quality, Price Prediction, Demand Forecasting, Best Buyer, Orders and Payments.";
        }

        res.json({
            success: true,
            reply
        });

    } catch (error) {
        console.error("Chat Assistant Error:", error);

        res.status(500).json({
            error: "Chat assistant failed"
        });
    }
});

module.exports = router;