import tensorflow as tf
import json
import numpy as np
from pathlib import Path
from datetime import datetime, timezone
from pymongo import MongoClient
from tensorflow.keras.utils import load_img, img_to_array

# File paths
BASE_DIR = Path(__file__).parent
MODEL_PATH = BASE_DIR / "waste_classifier.keras"
LABELS_PATH = BASE_DIR / "class_names.json"

# MongoDB connection
client = MongoClient(
    "mongodb://127.0.0.1:27017/",
    serverSelectionTimeoutMS=5000
)
db = client["WasteEasy"]
collection = db["waste_predictions"]

try:
    client.admin.command("ping")
    print("MongoDB connected successfully!")
except Exception as e:
    print("MongoDB connection failed:", e)
    raise SystemExit(1)

# Load model and labels
model = tf.keras.models.load_model(MODEL_PATH)

with open(LABELS_PATH, "r", encoding="utf-8") as f:
    class_names = json.load(f)

# Select image
image_path = input("Enter the full path of a waste image: ").strip().strip('"')

try:
    # Prepare image
    img = load_img(image_path, target_size=(224, 224))
    img_array = img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)

    # Predict
    predictions = model.predict(img_array, verbose=0)[0]
    predicted_index = int(np.argmax(predictions))

    category = class_names[predicted_index]
    confidence = float(predictions[predicted_index]) * 100

    # Store result in MongoDB
    record = {
        "image_path": str(Path(image_path).resolve()),
        "predicted_category": category,
        "confidence_percent": round(confidence, 2),
        "timestamp": datetime.now(timezone.utc)
    }

    result = collection.insert_one(record)

    print("\n===== WASTE PREDICTION =====")
    print("Category:", category)
    print(f"Confidence: {confidence:.2f}%")
    print("MongoDB record ID:", result.inserted_id)
    print("Saved successfully!")
    print("============================")

except Exception as e:
    print("Error:", e)

finally:
    client.close()