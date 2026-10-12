# Waste2Value

**AI-Powered Waste Detection and Segregation System**

## About the Project

Waste2Value is a web-based application that uses Artificial Intelligence (AI) and computer vision to detect and classify waste items from images. It aims to support efficient waste segregation and responsible waste management.

## What Does It Do?

* **Waste Detection:** Uses YOLO models to identify waste items in images.
* **Waste Classification:** Predicts the category of detected items.
* **Multiple Models:** Uses two trained YOLO models for detection.
* **Prediction Records:** Stores detection results in MongoDB.
* **Web Interface:** Provides a user-friendly interface built with Next.js.

## Technology Stack

* **Frontend:** Next.js, React, TypeScript
* **Backend:** Python, Flask
* **AI/ML:** YOLO (Ultralytics)
* **Database:** MongoDB

## Prerequisites

* Node.js
* Python 3.11
* MongoDB

## 1. Install Frontend Dependencies

Run in the project root:

```powershell
npm install
```

## 2. Run the AI Backend

Open Terminal 1:

```powershell
cd python-model
.\venv\Scripts\Activate.ps1
python app.py
```

Backend: http://127.0.0.1:5000

## 3. Run the Frontend

Open Terminal 2 in the project root:

```powershell
npm run dev
```

Frontend: http://localhost:3000

## Notes

* Ensure MongoDB is running before starting the backend.
* Keep both terminals open while using the application.
* YOLO model files must be present in `python-model/weights/`.
* The application uses AI predictions to support waste segregation; predictions may not always be accurate.
