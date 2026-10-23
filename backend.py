import os
import json
import math

import joblib
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    BASE_DIR, "shipment_delivery_time_model.joblib"
)
METADATA_PATH = os.path.join(
    BASE_DIR, "shipment_delivery_time_model_metadata.json"
)

app = Flask(__name__)
CORS(app)

# Load the trained model and its feature configuration.
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")

if not os.path.exists(METADATA_PATH):
    raise FileNotFoundError(f"Metadata file not found: {METADATA_PATH}")

model = joblib.load(MODEL_PATH)

with open(METADATA_PATH, "r", encoding="utf-8") as file:
    metadata = json.load(file)

FEATURE_COLUMNS = metadata["feature_columns"]

EXPECTED_FIELDS = {
    "delivery_partner",
    "package_type",
    "vehicle_type",
    "delivery_mode",
    "region",
    "weather_condition",
    "distance_km",
    "package_weight_kg",
}


@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "model": metadata.get("best_model", "Loaded model"),
        "target_unit": metadata.get("target_unit", "hours"),
    })


@app.post("/api/predict")
def predict():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"message": "Send shipment details as JSON."}), 400

    missing = EXPECTED_FIELDS - set(data.keys())
    if missing:
        return jsonify({
            "message": "Missing required fields.",
            "missing_fields": sorted(missing),
        }), 400

    try:
        distance = float(data["distance_km"])
        weight = float(data["package_weight_kg"])

        if not math.isfinite(distance) or not math.isfinite(weight):
            raise ValueError("Distance and weight must be finite numbers.")

        if distance <= 0 or weight <= 0:
            raise ValueError("Distance and weight must be greater than zero.")

        # Match the feature names and ordering used during training.
        row = {
            "delivery_partner": str(data["delivery_partner"]),
            "package_type": str(data["package_type"]),
            "vehicle_type": str(data["vehicle_type"]),
            "delivery_mode": str(data["delivery_mode"]),
            "region": str(data["region"]),
            "weather_condition": str(data["weather_condition"]),
            "distance_km": distance,
            "package_weight_kg": weight,
        }

        input_df = pd.DataFrame(
            [{column: row[column] for column in FEATURE_COLUMNS}]
        )

        predicted_hours = float(model.predict(input_df)[0])

        if not math.isfinite(predicted_hours):
            raise ValueError("The model returned an invalid prediction.")

        # Convert predicted hours into the response expected by the frontend.
        total_minutes = max(0, round(predicted_hours * 60))

        return jsonify({
            "duration_minutes": total_minutes,
            "predicted_duration_hours": round(predicted_hours, 2),
            "status": "Estimate generated",
            "unit": "hours",
            "model": metadata.get("best_model", "Loaded model"),
            "note": "This is a model estimate, not real-time tracking.",
        })

    except (TypeError, ValueError) as error:
        return jsonify({"message": str(error)}), 400
    except Exception:
        app.logger.exception("Prediction failed")
        return jsonify({
            "message": "The model could not process these shipment details."
        }), 500


if __name__ == "__main__":
    print("Shipment prediction backend starting...")
    print(f"Model: {metadata.get('best_model', 'Loaded model')}")
    print(f"Features: {FEATURE_COLUMNS}")
    app.run(host="127.0.0.1", port=5000, debug=False)
