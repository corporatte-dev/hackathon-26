"""
Crop Recommendation - ML Data Preparation
==========================================
Prepares the crop recommendation dataset for use with scikit-learn classifiers.

Features:
    N           - Nitrogen content in soil (int)
    P           - Phosphorus content in soil (int)
    K           - Potassium content in soil (int)
    temperature - Temperature in Celsius (float)
    humidity    - Relative humidity in % (float)
    ph          - pH value of soil (float)
    rainfall    - Rainfall in mm (float)

Target:
    label       - Crop type (22 classes, 100 samples each)
"""

import pandas as pd
import numpy as np
from numpy.distutils.conv_template import header
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.pipeline import Pipeline
import joblib

# ── 1. Load ────────────────────────────────────────────────────────────────────
df = pd.read_csv("Crop_recommendation.csv")

print("=== Dataset Overview ===")
print(f"Shape: {df.shape}")
print(f"Classes ({df['label'].nunique()}): {sorted(df['label'].unique())}\n")

# ── 2. Validate ────────────────────────────────────────────────────────────────
assert df.isnull().sum().sum() == 0, "Unexpected nulls found!"
assert (df['label'].value_counts() == 100).all(), "Classes are not balanced!"
print("✓ No missing values")
print("✓ Perfectly balanced classes (100 samples each)\n")

# ── 3. Split features & target ─────────────────────────────────────────────────
FEATURE_COLS = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
TARGET_COL   = "label"

X = df[FEATURE_COLS]
y = df[TARGET_COL]

# ── 4. Encode target labels ────────────────────────────────────────────────────
le = LabelEncoder()
y_encoded = le.fit_transform(y)

print("=== Label Encoding ===")
for i, cls in enumerate(le.classes_):
    print(f"  {i:2d} → {cls}")
print()

# ── 5. Train / test split ──────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded,
    test_size=0.2,
    random_state=42,
    stratify=y_encoded      # preserves class balance in both splits
)

print("=== Split Sizes ===")
print(f"  Train: {X_train.shape[0]} samples")
print(f"  Test : {X_test.shape[0]} samples\n")

# ── 6. Scaler (fit on train only, transform both) ──────────────────────────────
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled  = scaler.transform(X_test)

print("=== Feature Statistics After Scaling (train set) ===")
scaled_df = pd.DataFrame(X_train_scaled, columns=FEATURE_COLS)
print(scaled_df.describe().round(3))
print()

# ── 7. Ready-to-use pipeline ───────────────────────────────────────────────────
# Wrap scaler in a Pipeline so you can pass raw data directly to any classifier.
preprocessing_pipeline = Pipeline([
    ("scaler", StandardScaler())
])

# ── 8. Save artefacts ──────────────────────────────────────────────────────────
joblib.dump(scaler,           "scaler.joblib")
joblib.dump(le,               "label_encoder.joblib")
joblib.dump(preprocessing_pipeline, "preprocessing_pipeline.joblib")

np.save("X_train.npy", X_train_scaled)
np.save("X_test.npy",  X_test_scaled)
np.save("y_train.npy", y_train)
np.save("y_test.npy",  y_test)

print("✓ Saved: scaler.joblib, label_encoder.joblib, preprocessing_pipeline.joblib")
print("✓ Saved: X_train.npy, X_test.npy, y_train.npy, y_test.npy\n")

# ── 9. Convenience function for downstream use ─────────────────────────────────
def get_prepared_data():
    """
    Returns pre-split, scaled numpy arrays ready for sklearn classifiers.

    Usage
    -----
    from crop_recommendation_prep import get_prepared_data

    X_train, X_test, y_train, y_test, le = get_prepared_data()
    model.fit(X_train, y_train)
    preds = le.inverse_transform(model.predict(X_test))
    """
    return (
        np.load("X_train.npy"),
        np.load("X_test.npy"),
        np.load("y_train.npy"),
        np.load("y_test.npy"),
        joblib.load("label_encoder.joblib"),
    )


def predict_crop(model, N, P, K, temperature, humidity, ph, rainfall):
    """
    Predict crop given raw soil / weather values.

    Parameters
    ----------
    model : fitted sklearn classifier
    N, P, K : soil nutrient ratios (int)
    temperature : °C (float)
    humidity    : % (float)
    ph          : soil pH (float)
    rainfall    : mm (float)

    Returns
    -------
    str  Predicted crop name
    """
    sc = joblib.load("scaler.joblib")
    le = joblib.load("label_encoder.joblib")
    raw = np.array([[N, P, K, temperature, humidity, ph, rainfall]])
    scaled = sc.transform(raw)
    return le.inverse_transform(model.predict(scaled))[0]

PEST_CSV = "crop_pests.csv"
def get_crop_pests(crop_name, severity_filter=None):

    #Return known pests for a given crop from the lookup table.
    pests = pd.read_csv(PEST_CSV)
    result = pests[pests["crop"] == crop_name.lower()].drop(columns="crop")
    if severity_filter:
        result = result[result["severity"] == severity_filter]
    return result[["pest_name", "scientific_name"]].head(3).reset_index(drop=True)


def recommend_with_pests(model, N, P, K, temperature, humidity, ph, rainfall,
                         top_n=3, severity_filter=None):

    crops = top_3_crops(model, N, P, K, temperature, humidity, ph, rainfall, top_n)
    for entry in crops:
        entry["pests"] = get_crop_pests(entry["crop"])
    return crops


def top_3_crops(model, N, P, K, temperature, humidity, ph, rainfall, top_n=3):
    """
    Returns
    -------
    list of dict, each with keys:
        rank        (int)   - 1 = best match
        crop        (str)   - crop name
        confidence  (float) - model probability, rounded to 4 dp
    """

    if not hasattr(model, "predict_proba"):
        raise ValueError(
            f"{type(model).__name__} does not support predict_proba. "
            "For SVC, set probability=True at construction time."
        )

    sc = joblib.load("scaler.joblib")
    le = joblib.load("label_encoder.joblib")

    raw = np.array([[N, P, K, temperature, humidity, ph, rainfall]])
    scaled = sc.transform(raw)

    proba = model.predict_proba(scaled)[0]  # shape: (n_classes,)
    top_idx = np.argsort(proba)[::-1][:top_n]  # indices of top-N, descending

    return [
        {
            "rank": rank + 1,
            "crop": le.classes_[idx],
            "confidence": round(float(proba[idx]), 4),
        }
        for rank, idx in enumerate(top_idx)
    ]


# ── 10. Example: quick baseline with Random Forest ─────────────────────────────
if __name__ == "__main__":
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.metrics import classification_report

    X_tr, X_te, y_tr, y_te, label_enc = get_prepared_data()

    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_tr, y_tr)

    print("=== Random Forest Baseline ===")
    print(classification_report(
        y_te, clf.predict(X_te),
        target_names=label_enc.classes_
    ))

    # Example single prediction
    """
    crop = predict_crop(clf, N=72, P=53, K=18,
                        temperature=21, humidity=63.0,
                        ph=5.6, rainfall=87.0)
    print(f"Example prediction → {crop}")
    """

    print("Top 3 crop Recommendation")
    sample = dict(N=90,P=42,K=43, temperature=20.9,humidity=82.0, ph=6.5, rainfall=203.0)
    results = recommend_with_pests(clf, **sample, severity_filter=None)

    for r in results:
        print(f"  #{r['rank']}  {r['crop']:<15} {r['confidence']:>6.1%}")
        print(r["pests"].to_string(index=False, header=False))
        print()
