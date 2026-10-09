from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
from pathlib import Path
from datetime import datetime, timezone
from pymongo import MongoClient
from pymongo import ReturnDocument
from werkzeug.utils import secure_filename
from io import BytesIO
from PIL import Image
import os

app = Flask(__name__)
CORS(app)

# Trained YOLO model
MODEL_PATH = Path(
    r"D:\TechPorjectAllFiles 2025\Waste2Value_Training"
    r"\waste_detector_20\weights\best.pt"
)
model = YOLO(str(MODEL_PATH))

# MongoDB connection
client = MongoClient("mongodb://127.0.0.1:27017/")
db = client["WasteEasy"]
collection = db["waste_predictions"]
counter_collection = db["counters"]

# Configuration
CONFIDENCE_THRESHOLD = 0.25
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Waste2Value YOLO AI API is running",
        "model_categories": len(model.names)
    })


@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({
            "error": "Upload an image using the 'image' field"
        }), 400

    image_file = request.files["image"]

    if not image_file.filename:
        return jsonify({"error": "No image selected"}), 400

    filename = secure_filename(image_file.filename)

    if Path(filename).suffix.lower() not in IMAGE_EXTENSIONS:
        return jsonify({"error": "Unsupported image format"}), 400

    try:
        image_bytes = image_file.read()
        image = Image.open(BytesIO(image_bytes)).convert("RGB")

        # Detect multiple objects in one image
        predictions = model.predict(
            source=image,
            conf=CONFIDENCE_THRESHOLD,
            imgsz=416,
            device=0,
            verbose=False
        )

        detections = []
        timestamp = datetime.now(timezone.utc)

        for prediction in predictions:
            boxes = prediction.boxes

            if boxes is None:
                continue

            for box in boxes:
                class_id = int(box.cls.item())
                confidence = float(box.conf.item())

                detections.append({
                    "category": model.names[class_id],
                    "confidence": round(confidence * 100, 2),
                    "bounding_box": [
                        round(float(value), 2)
                        for value in box.xyxy[0].tolist()
                    ]
                })

        # Allocate one serial number per uploaded photo
        serial_doc = counter_collection.find_one_and_update(
            {"_id": "photo_serial"},
            {"$inc": {"sequence": 1}},
            upsert=True,
            return_document=ReturnDocument.AFTER
        )
        serial_no = serial_doc["sequence"]

        records = []

        for item_no, detection in enumerate(detections, start=1):
            records.append({
                "serial_no": serial_no,
                "item_no": item_no,
                "image_filename": filename,
                "predicted_category": detection["category"],
                "confidence_percent": detection["confidence"],
                "bounding_box": detection["bounding_box"],
                "timestamp": timestamp
            })

        if records:
            result = collection.insert_many(records)
            record_ids = [str(record_id) for record_id in result.inserted_ids]
        else:
            record_ids = []

        return jsonify({
            "success": True,
            "serial_no": serial_no,
            "image_filename": filename,
            "items_detected": len(detections),
            "detections": detections,
            "record_ids": record_ids,
            "message": (
                "Detection completed"
                if detections
                else "No waste items detected. Try another image."
            )
        }), 200

    except Exception:
        app.logger.exception("YOLO prediction failed")
        return jsonify({
            "error": "Image prediction failed. Check the Flask terminal."
        }), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)