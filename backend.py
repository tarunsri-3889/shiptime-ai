"""Flask API for ShipTime AI shipment duration prediction."""
import json
import math
import os
from pathlib import Path

import joblib
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "shipment_delivery_time_model.joblib"
METADATA_PATH = BASE_DIR / "shipment_delivery_time_model_metadata.json"

app = Flask(__name__)
CORS(app)

if not MODEL_PATH.exists() or not METADATA_PATH.exists():
    raise FileNotFoundError("Model or metadata missing. Run train_model.py first.")

model = joblib.load(MODEL_PATH)
metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
FEATURE_COLUMNS = metadata.get("feature_columns", [])
EXPECTED_FEATURES = [
    "delivery_partner", "package_type", "vehicle_type", "delivery_mode",
    "distance_km", "package_weight_kg",
]
if FEATURE_COLUMNS != EXPECTED_FEATURES:
    raise RuntimeError(
        "The loaded model does not have the expected six features. "
        "Run train_model.py again before starting the API."
    )

VALID_PARTNERS = {
    "amazon logistics", "blue dart", "delhivery", "dhl", "ecom express",
    "ekart", "fedex", "shadowfax", "xpressbees",
}
VALID_PACKAGES = {
    "automobile parts", "clothing", "cosmetics", "documents", "electronics",
    "fragile items", "furniture", "groceries", "pharmacy",
}


def assign_vehicle(distance_km: float, weight_kg: float) -> str:
    """Distance + weight dispatch policy; returns model category."""
    if distance_km > 200:
        return "truck"
    if distance_km > 50:
        return "van" if weight_kg <= 25 else "truck"
    if weight_kg <= 5:
        return "bike"
    if weight_kg <= 25:
        return "van"
    return "truck"


def assign_delivery_mode(distance_km: float) -> str:
    return "express" if distance_km <= 50 else "standard"


@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "model": metadata.get("best_model", "Loaded model"),
        "features": FEATURE_COLUMNS,
        "metrics": metadata.get("metrics", {}),
    })


@app.post("/api/predict")
def predict():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"message": "Send shipment details as JSON."}), 400

    required = {"delivery_partner", "package_type", "distance_km", "package_weight_kg"}
    missing = sorted(required - set(data))
    if missing:
        return jsonify({"message": "Missing required fields.", "missing_fields": missing}), 400

    try:
        distance = float(data["distance_km"])
        weight = float(data["package_weight_kg"])
        if not math.isfinite(distance) or not math.isfinite(weight) or distance <= 0 or weight <= 0:
            raise ValueError("Distance and package weight must be positive finite numbers.")

        partner = str(data["delivery_partner"]).strip().lower()
        package = str(data["package_type"]).strip().lower()
        if partner not in VALID_PARTNERS:
            raise ValueError("Unsupported delivery partner. Select a listed partner.")
        if package not in VALID_PACKAGES:
            raise ValueError("Unsupported package type. Select a listed package type.")

        vehicle = assign_vehicle(distance, weight)
        mode = assign_delivery_mode(distance)
        row = {
            "delivery_partner": partner,
            "package_type": package,
            "vehicle_type": vehicle,
            "delivery_mode": mode,
            "distance_km": distance,
            "package_weight_kg": weight,
        }
        input_df = pd.DataFrame([{column: row[column] for column in FEATURE_COLUMNS}])
        predicted_hours = float(model.predict(input_df)[0])
        if not math.isfinite(predicted_hours) or predicted_hours < 0:
            raise ValueError("The model returned an invalid delivery-time estimate.")

        total_minutes = round(predicted_hours * 60)
        vehicle_labels = {"bike": "Motorcycle", "van": "Van", "truck": "Truck"}
        mae = metadata.get("metrics", {}).get("mae_hours")
        note = "Model estimate only; actual delivery time may vary with traffic, pickup queues, stops and operating conditions."
        if isinstance(mae, (int, float)):
            note += f" Historical test MAE: approximately {mae:.2f} hours."

        return jsonify({
            "duration_minutes": total_minutes,
            "predicted_duration_hours": round(predicted_hours, 2),
            "vehicle_type": vehicle,
            "vehicle_label": vehicle_labels[vehicle],
            "delivery_mode": mode,
            "status": "Estimate generated",
            "unit": "hours",
            "model": metadata.get("best_model", "Extra Trees"),
            "note": note,
        })
    except (TypeError, ValueError) as exc:
        return jsonify({"message": str(exc)}), 400
    except Exception:
        app.logger.exception("Prediction failed")
        return jsonify({"message": "The model could not process these shipment details."}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=False)
