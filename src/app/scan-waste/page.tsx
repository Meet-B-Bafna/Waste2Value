"use client";

import React, { useEffect, useRef, useState } from "react";
import { MoonLoader } from "react-spinners";
import { ImageUp, Scan, Trash } from "lucide-react";
import Link from "next/link";
import Toast from "@/utils/toast";

interface WasteDetection {
    category: string;
    confidence: number;
    bounding_box: number[];
}

interface WastePrediction {
    waste_name: string;
    waste_type: string;
    material: string;
    total_count: number;
    serial_no: number;
    detections: WasteDetection[];
}

const Page: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [photoData, setPhotoData] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [aiLoading, setAiLoading] = useState<boolean>(false);
    const [aiData, setAiData] = useState<WastePrediction | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [cameraOn, setCameraOn] = useState<boolean>(false);

    const startCamera = async () => {
        setLoading(true);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraOn(true);
            }
        } catch (err) {
            setCameraOn(false);
            Toast.ErrorShowToast(
                "Camera not available - you can upload a photo instead"
            );
            console.error("Error accessing camera:", err);
        } finally {
            setLoading(false);
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current) return;

        const video = videoRef.current;
        const canvas = document.createElement("canvas");

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");

        if (ctx && canvas.width > 0 && canvas.height > 0) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const dataURL = canvas.toDataURL("image/jpeg");
            setPhotoData(dataURL);
            void scanImage(dataURL);
        }
    };

    const handleFileUpload = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        e.target.value = "";

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            Toast.ErrorShowToast(
                "Please choose an image file (JPG, PNG, WEBP)"
            );
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            Toast.ErrorShowToast("Image is too large (max 10 MB)");
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            const dataURL = reader.result as string;
            setPhotoData(dataURL);
            void scanImage(dataURL);
        };

        reader.onerror = () => {
            Toast.ErrorShowToast("Could not read that file");
        };

        reader.readAsDataURL(file);
    };

    // Send the image to the Waste2Value Flask YOLO API
    const scanImage = async (imageDataUrl: string) => {
        setAiLoading(true);
        setAiData(null);

        try {
            const response = await fetch(imageDataUrl);
            const imageBlob = await response.blob();

            const formData = new FormData();
            formData.append("image", imageBlob, "waste-image.jpg");

            const apiResponse = await fetch(
                "http://127.0.0.1:5000/predict",
                {
                    method: "POST",
                    body: formData,
                }
            );

            const result = await apiResponse.json();

            if (!apiResponse.ok || !result.success) {
                throw new Error(
                    result.error || "Waste prediction failed"
                );
            }

            const detections: WasteDetection[] =
                Array.isArray(result.detections)
                    ? result.detections
                    : [];

            const firstDetection = detections[0];
            const category = firstDetection
                ? firstDetection.category
                : "No waste detected";

            setAiData({
                waste_name: category,
                waste_type: "Requires verification",
                material: category,
                total_count: Number(
                    result.items_detected ?? detections.length
                ),
                serial_no: Number(result.serial_no),
                detections,
            });

            console.log("Waste2Value prediction:", result);
        } catch (err) {
            console.error("Error scanning image:", err);

            Toast.ErrorShowToast(
                "Could not analyse the image. Ensure the Waste2Value Flask API is running."
            );
        } finally {
            setAiLoading(false);
        }
    };

    useEffect(() => {
        void startCamera();

        return () => {
            const stream = videoRef.current?.srcObject;

            if (stream instanceof MediaStream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    return (
        <div className="flex relative flex-col mt-4 w-full mb-40">
            <h1 className="flex items-start justify-start mb-7 text-3xl font-bold text-start">
                Scan Waste
            </h1>

            {/* Camera preview */}
            <div>
                {loading ? (
                    <div
                        className="w-full rounded-lg relative animate-pulse bg-black/80"
                        style={{
                            height: "400px",
                            borderRadius: "50px",
                        }}
                    />
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full rounded-lg relative h-96"
                    />
                )}

                {/* Camera and upload buttons */}
                <div className="flex items-center justify-center gap-6 mt-7">
                    <button
                        onClick={capturePhoto}
                        disabled={!cameraOn}
                        aria-label="Capture photo"
                        className={`${
                            cameraOn
                                ? "bg-green-600"
                                : "bg-black/30 cursor-not-allowed"
                        } w-16 h-16 rounded-full flex items-center justify-center text-white p-4`}
                    >
                        <Scan size={40} />
                    </button>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 border-2 border-green-600 text-green-700 font-semibold rounded-full px-5 h-14"
                    >
                        <ImageUp size={22} />
                        Upload photo
                    </button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleFileUpload}
                    />
                </div>

                {/* Selected or captured image */}
                {photoData && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={photoData}
                        alt="Waste to scan"
                        className="w-full max-h-96 object-contain rounded-lg mt-6 border-2 border-black/10"
                    />
                )}
            </div>

            {/* Loading indicator */}
            {aiLoading ? (
                <div className="bg-black/80 w-full min-h-screen fixed left-0 right-0 top-0 z-50">
                    <div className="flex justify-center items-center min-h-screen">
                        <MoonLoader color="#fff" size={90} />
                    </div>
                </div>
            ) : (
                <>
                    {/* Classification results */}
                    {aiData && (
                        <div className="bg-black/5 shadow-lg w-full mt-12 mb-28 rounded-2xl border-2 border-black/10">
                            <div className="flex flex-col gap-4 p-4">
                                <h1 className="text-2xl uppercase font-bold">
                                    Waste Classification Results
                                </h1>

                                <p className="text-sm text-gray-600">
                                    Scan Serial Number:{" "}
                                    {aiData.serial_no}
                                </p>

                                <h2 className="text-lg font-bold">
                                    Total Waste Items Detected:{" "}
                                    {aiData.total_count}
                                </h2>

                                {aiData.detections.length > 0 ? (
                                    <div className="flex flex-col gap-3">
                                        <h2 className="text-xl font-semibold">
                                            Detected Items
                                        </h2>

                                        {aiData.detections.map(
                                            (detection, index) => (
                                                <div
                                                    key={`${detection.category}-${index}`}
                                                    className="rounded-lg border border-black/10 bg-white p-4"
                                                >
                                                    <h3 className="font-bold capitalize">
                                                        Item {index + 1}:{" "}
                                                        {detection.category.replace(
                                                            /_/g,
                                                            " "
                                                        )}
                                                    </h3>

                                                    <p className="mt-1 text-sm">
                                                        Confidence:{" "}
                                                        {detection.confidence.toFixed(
                                                            2
                                                        )}
                                                        %
                                                    </p>

                                                    <p className="mt-1 text-sm text-gray-600">
                                                        Bounding box:{" "}
                                                        {detection.bounding_box
                                                            .map((value) =>
                                                                value.toFixed(1)
                                                            )
                                                            .join(", ")}
                                                    </p>
                                                </div>
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-amber-700">
                                        No waste items were detected. Try
                                        another image with clearer visibility.
                                    </p>
                                )}

                                <p className="text-sm text-gray-600">
                                    Recyclability has not been assessed by
                                    this model. Please verify the category
                                    before disposal.
                                </p>

                                {aiData.total_count > 0 && (
                                    <Link
                                        href={`/dump-waste?recycle=false&wasteName=${encodeURIComponent(
                                            aiData.waste_name
                                        )}&wasteType=${encodeURIComponent(
                                            aiData.waste_type
                                        )}&material=${encodeURIComponent(
                                            aiData.material
                                        )}&totalwaste=${aiData.total_count}`}
                                        className="flex justify-center items-center gap-3 bg-green-600 text-white p-5 rounded-lg"
                                    >
                                        <Trash />
                                        Continue to Waste Disposal
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Page;