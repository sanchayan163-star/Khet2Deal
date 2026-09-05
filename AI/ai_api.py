
from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
import joblib

app = Flask(__name__)
CORS(app)

quality_model = tf.keras.models.load_model(
    "crop_quality_model.keras"
)

price_model = joblib.load(
    "tomato_price_model.pkl"
)

demand_rules = joblib.load(
    "demand_rules.pkl"
)

print("All models loaded ✅")


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "AI API is running"})


@app.route("/predict-quality", methods=["POST"])
def predict_quality():

    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    img = Image.open(request.files["image"]).convert("RGB")
    img = img.resize((224, 224))

    img_array = np.array(img)
    img_array = np.expand_dims(img_array, axis=0)

    prediction = quality_model.predict(
        img_array, verbose=0
    )[0][0]

    score = round(float(prediction * 100), 2)

    if score >= 80:
        grade = "Excellent"
    elif score >= 60:
        grade = "Good"
    elif score >= 40:
        grade = "Average"
    else:
        grade = "Poor"

    return jsonify({
        "quality_score": score,
        "grade": grade
    })


@app.route("/predict-price", methods=["POST"])
def predict_price():

    data = request.get_json()

    required = [
        "lag_1",
        "lag_2",
        "lag_3",
        "lag_7",
        "rolling_7"
    ]

    for feature in required:
        if feature not in data:
            return jsonify({
                "error": f"Missing feature: {feature}"
            }), 400

    X = np.array([[
        data["lag_1"],
        data["lag_2"],
        data["lag_3"],
        data["lag_7"],
        data["rolling_7"]
    ]])

    prediction = price_model.predict(X)[0]

    return jsonify({
        "crop": "Tomato",
        "predicted_price_per_kg": round(float(prediction), 2),
        "unit": "₹/kg"
    })


@app.route("/predict-demand", methods=["POST"])
def predict_demand():

    data = request.get_json()

    if "trend" not in data:
        return jsonify({
            "error": "Missing trend"
        }), 400

    trend = float(data["trend"])

    if trend > demand_rules["high_threshold"]:
        demand = "High ↑"
    elif trend < demand_rules["low_threshold"]:
        demand = "Low ↓"
    else:
        demand = "Stable →"

    return jsonify({
        "crop": "Tomato",
        "demand": demand,
        "trend": trend
    })


@app.route("/recommend-buyer", methods=["POST"])
def recommend_buyer_api():

    data = request.get_json()

    if "buyers" not in data:
        return jsonify({
            "error": "Buyers data is required"
        }), 400

    buyers = data["buyers"]

    for buyer in buyers:

        price_score = (
            buyer["price_per_kg"] / 33
        ) * 100

        distance_score = (
            1 / buyer["distance_km"]
        ) * 100

        rating_score = (
            buyer["rating"] / 5
        ) * 100

        buyer["score"] = round(
            price_score * 0.5 +
            distance_score * 0.2 +
            rating_score * 0.3,
            2
        )

    ranked = sorted(
        buyers,
        key=lambda x: x["score"],
        reverse=True
    )

    return jsonify({
        "recommended_buyer": ranked[0],
        "all_buyers": ranked
    })


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5004,
        debug=False
    )
