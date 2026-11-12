"""Train and evaluate the six-input ShipTime AI regression model.

Usage:
  python train_model.py --data "C:\\path\\Logistic_Shipment_Date_Time_Predictor_Clean.csv"

This script retains historical vehicle/mode labels in the training data. It does
not rewrite historical events to pretend the new dispatch policy was used.
It prints distance-band statistics so implausible or noisy source data can be
identified before interpreting short-distance predictions.
"""
import argparse
import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import ExtraTreesRegressor, RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

FEATURES = [
    "delivery_partner", "package_type", "vehicle_type", "delivery_mode",
    "distance_km", "package_weight_kg",
]
TARGET = "delivery_time_hours"
CATEGORICAL = FEATURES[:4]
NUMERIC = FEATURES[4:]


def make_pipeline(estimator):
    preprocessor = ColumnTransformer([
        ("categorical", Pipeline([
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ]), CATEGORICAL),
        ("numeric", Pipeline([
            ("imputer", SimpleImputer(strategy="median")),
            ("scale", StandardScaler()),
        ]), NUMERIC),
    ])
    return Pipeline([("preprocessor", preprocessor), ("model", estimator)])


def main():
    parser = argparse.ArgumentParser(description="Train ShipTime AI's six-feature model")
    parser.add_argument("--data", required=True, help="Path to shipment CSV")
    args = parser.parse_args()

    data_path = Path(args.data)
    if not data_path.exists():
        raise FileNotFoundError(f"Dataset not found: {data_path}")
    df = pd.read_csv(data_path)
    missing = sorted(set(FEATURES + [TARGET]) - set(df.columns))
    if missing:
        raise ValueError(f"Dataset is missing required columns: {missing}")

    df = df[FEATURES + [TARGET]].copy()
    for column in CATEGORICAL:
        df[column] = df[column].astype("string").str.strip().str.lower()
    for column in NUMERIC + [TARGET]:
        df[column] = pd.to_numeric(df[column], errors="coerce")
    df = df.replace([np.inf, -np.inf], np.nan).dropna(subset=FEATURES + [TARGET])
    df = df[(df["distance_km"] > 0) & (df["package_weight_kg"] > 0) & (df[TARGET] >= 0)]
    if len(df) < 100:
        raise ValueError(f"Only {len(df)} valid rows remain; at least 100 are required.")

    print("\nDELIVERY-TIME DATA AUDIT (actual historical labels)")
    bins = [0, 10, 25, 50, 100, 200, np.inf]
    labels = ["0-10 km", "10-25 km", "25-50 km", "50-100 km", "100-200 km", ">200 km"]
    df["distance_band"] = pd.cut(df["distance_km"], bins=bins, labels=labels, right=True)
    summary = df.groupby("distance_band", observed=False)[TARGET].agg(
        records="count", median_hours="median", mean_hours="mean", p90_hours=lambda x: x.quantile(0.9)
    ).round(2)
    print(summary.to_string())
    print("\nRows used:", len(df))

    X, y = df[FEATURES], df[TARGET]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    candidates = {
        "Extra Trees": ExtraTreesRegressor(
            n_estimators=400, random_state=42, n_jobs=-1, min_samples_leaf=2
        ),
        "Random Forest": RandomForestRegressor(
            n_estimators=300, random_state=42, n_jobs=-1, min_samples_leaf=2
        ),
    }
    results = []
    best = None
    for name, estimator in candidates.items():
        pipeline = make_pipeline(estimator)
        pipeline.fit(X_train, y_train)
        predictions = pipeline.predict(X_test)
        metrics = {
            "mae_hours": float(mean_absolute_error(y_test, predictions)),
            "rmse_hours": float(mean_squared_error(y_test, predictions) ** 0.5),
            "r2": float(r2_score(y_test, predictions)),
        }
        results.append({"model": name, **{k: round(v, 4) for k, v in metrics.items()}})
        if best is None or metrics["mae_hours"] < best["metrics"]["mae_hours"]:
            best = {"name": name, "pipeline": pipeline, "metrics": metrics}

    output_dir = Path(__file__).resolve().parent
    joblib.dump(best["pipeline"], output_dir / "shipment_delivery_time_model.joblib")
    metadata = {
        "project": "Logistic Shipment Date and Time Predictor",
        "target": TARGET,
        "best_model": best["name"],
        "feature_columns": FEATURES,
        "target_unit": "hours",
        "random_state": 42,
        "training_rows": len(X_train),
        "test_rows": len(X_test),
        "metrics": {k: round(float(v), 4) for k, v in best["metrics"].items()},
        "model_comparison": results,
        "distance_band_audit": {
            str(index): {
                "records": int(row["records"]),
                "median_hours": None if pd.isna(row["median_hours"]) else float(row["median_hours"]),
                "mean_hours": None if pd.isna(row["mean_hours"]) else float(row["mean_hours"]),
                "p90_hours": None if pd.isna(row["p90_hours"]) else float(row["p90_hours"]),
            }
            for index, row in summary.iterrows()
        },
        "training_note": "Historical vehicle and delivery-mode labels were retained; the API assigns these features using the configured dispatch policy. Validate new policy combinations against real operational data before production use.",
    }
    (output_dir / "shipment_delivery_time_model_metadata.json").write_text(
        json.dumps(metadata, indent=2), encoding="utf-8"
    )
    print("\nMODEL COMPARISON")
    print(json.dumps(results, indent=2))
    print("\nSELECTED MODEL")
    print(json.dumps({"best_model": metadata["best_model"], "metrics": metadata["metrics"]}, indent=2))
    print("\nSaved model and metadata beside train_model.py")


if __name__ == "__main__":
    main()
