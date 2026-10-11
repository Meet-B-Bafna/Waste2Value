from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
from pathlib import Path
from datetime import datetime, timezone
from pymongo import MongoClient, ReturnDocument
from werkzeug.utils import secure_filename
from io import BytesIO
from PIL import Image

app = Flask(__name__)
CORS(app)

# Load both trained YOLO models
BASE_DIR = Path(__file__).resolve().parent
MODEL_1_PATH = BASE_DIR / "weights" / "waste_detector_best.pt"
MODEL_2_PATH = BASE_DIR / "weights" / "waste_detector_20_best.pt"

for model_path in (MODEL_1_PATH, MODEL_2_PATH):
    if not model_path.is_file():
        raise FileNotFoundError(f"Trained YOLO model not found: {model_path}")

model_1 = YOLO(str(MODEL_1_PATH))
model_2 = YOLO(str(MODEL_2_PATH))

# MongoDB connection
client = MongoClient(
    "mongodb://127.0.0.1:27017/",
    serverSelectionTimeoutMS=5000
)
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
        "models": {
            "1": {"categories": len(model_1.names)},
            "2": {"categories": len(model_2.names)}
        }
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

    model_choice = request.form.get("model", "1")

    if model_choice not in {"1", "2"}:
        return jsonify({
            "error": "Invalid model. Choose '1' or '2'."
        }), 400

    selected_model = model_1 if model_choice == "1" else model_2

    try:
        image = Image.open(BytesIO(image_file.read())).convert("RGB")

        predictions = selected_model.predict(
            source=image,
            conf=CONFIDENCE_THRESHOLD,
            imgsz=416,
            verbose=False
        )

        detections = []
        timestamp = datetime.now(timezone.utc)

        for prediction in predictions:
            if prediction.boxes is None:
                continue

            for box in prediction.boxes:
                class_id = int(box.cls.item())
                confidence = float(box.conf.item())

                detections.append({
                    "category": selected_model.names[class_id],
                    "confidence": round(confidence * 100, 2),
                    "bounding_box": [
                        round(float(value), 2)
                        for value in box.xyxy[0].tolist()
                    ]
                })

        serial_doc = counter_collection.find_one_and_update(
            {"_id": "photo_serial"},
            {"$inc": {"sequence": 1}},
            upsert=True,
            return_document=ReturnDocument.AFTER
        )
        serial_no = serial_doc["sequence"]

        records = [
            {
                "serial_no": serial_no,
                "item_no": item_no,
                "image_filename": filename,
                "model_used": model_choice,
                "predicted_category": detection["category"],
                "confidence_percent": detection["confidence"],
                "bounding_box": detection["bounding_box"],
                "timestamp": timestamp
            }
            for item_no, detection in enumerate(detections, start=1)
        ]

        if records:
            result = collection.insert_many(records)
            record_ids = [str(record_id) for record_id in result.inserted_ids]
        else:
            record_ids = []

        return jsonify({
            "success": True,
            "serial_no": serial_no,
            "image_filename": filename,
            "model_used": model_choice,
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