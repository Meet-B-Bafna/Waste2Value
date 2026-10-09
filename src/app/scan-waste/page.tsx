"use client";

import React, { useEffect, useRef, useState } from "react";
import { MoonLoader } from "react-spinners";
import {
    Leaf,
    Camera,
    ImageUp,
    ScanLine,
    Trash2,
    Recycle,
    ShieldCheck,
    Sprout,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
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
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [photoData, setPhotoData] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiData, setAiData] = useState<WastePrediction | null>(null);
    const [cameraOn, setCameraOn] = useState(false);
    const [cameraError, setCameraError] = useState(false);

    const startCamera = async () => {
        setLoading(true);
        setCameraError(false);

        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error("Camera is not supported by this browser.");
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                setCameraOn(true);
            } else {
                stream.getTracks().forEach((track) => track.stop());
            }
        } catch (err) {
            setCameraOn(false);
            setCameraError(true);

            Toast.ErrorShowToast(
                "Camera unavailable. You can upload an image instead."
            );

            console.error("Camera error:", err);
        } finally {
            setLoading(false);
        }
    };

    const stopCamera = () => {
        const stream = videoRef.current?.srcObject;

        if (stream instanceof MediaStream) {
            stream.getTracks().forEach((track) => track.stop());
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setCameraOn(false);
    };

    const capturePhoto = () => {
        const video = videoRef.current;

        if (!video || !video.videoWidth || !video.videoHeight) {
            Toast.ErrorShowToast("Camera is not ready yet.");
            return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");

        if (!ctx) {
            Toast.ErrorShowToast("Could not capture the image.");
            return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataURL = canvas.toDataURL("image/jpeg", 0.92);

        setPhotoData(dataURL);
        void scanImage(dataURL);
    };

    const handleFileUpload = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file) return;

        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            Toast.ErrorShowToast("Please select a JPG, PNG, or WEBP image.");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            Toast.ErrorShowToast("Image size must be 10 MB or less.");
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            const dataURL = reader.result as string;

            setPhotoData(dataURL);
            void scanImage(dataURL);
        };

        reader.onerror = () => {
            Toast.ErrorShowToast("Unable to read the selected image.");
        };

        reader.readAsDataURL(file);
    };

    // Run AI detection, upload the image, and save the scan to MongoDB.
    const scanImage = async (imageDataUrl: string) => {
        setAiLoading(true);
        setAiData(null);

        try {
            // Step 1: Send the image to the YOLO detection API.
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
                    result.error || "Waste prediction failed."
                );
            }

            const detections: WasteDetection[] = Array.isArray(
                result.detections
            )
                ? result.detections
                : [];

            const firstDetection = detections[0];
            const category = firstDetection
                ? firstDetection.category
                : "No waste detected";

            const prediction: WastePrediction = {
                waste_name: category,
                waste_type: "Requires verification",
                material: category,
                total_count: Number(
                    result.items_detected ?? detections.length
                ),
                serial_no: Number(result.serial_no),
                detections,
            };

            setAiData(prediction);

            console.log("Waste2Value prediction:", result);

            if (detections.length === 0) {
                Toast.ErrorShowToast(
                    "No waste detected. Try a clearer image."
                );
                return;
            }

            // Step 2: Upload the actual photo.
            const uploadForm = new FormData();
            uploadForm.append("image", imageBlob, "waste-image.jpg");

            const uploadResponse = await fetch(
                "/api/upload-scan-image",
                {
                    method: "POST",
                    body: uploadForm,
                }
            );

            const uploadResult = await uploadResponse.json();

            if (!uploadResponse.ok || !uploadResult.imagePath) {
                throw new Error(
                    uploadResult.error ||
                        "AI detection succeeded, but the photo could not be saved."
                );
            }

            // Step 3: Save scan details and photo path in MongoDB.
            const saveResponse = await fetch("/api/save-scan", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    imagePath: uploadResult.imagePath,
                    wasteNameByAi: prediction.waste_name,
                    wasteType: prediction.waste_type,
                    confidence: firstDetection?.confidence ?? 0,
                    detections: prediction.detections,
                }),
            });

            const saveResult = await saveResponse.json();

            if (!saveResponse.ok || !saveResult.success) {
                throw new Error(
                    saveResult.error ||
                        "Photo uploaded, but scan history could not be saved."
                );
            }

            Toast.SuccessShowToast("Scan saved to your history.");
        } catch (error) {
            console.error("Waste2Value scan error:", error);

            Toast.ErrorShowToast(
                error instanceof Error
                    ? error.message
                    : "Scan failed. Please try again."
            );
        } finally {
            setAiLoading(false);
        }
    };

    const resetScan = () => {
        setPhotoData(null);
        setAiData(null);
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
        <main className="min-h-screen w-full bg-[#f5f8f2] text-[#193b2a]">
            <header className="w-full border-b border-emerald-100 bg-white">
                <div className="flex w-full items-center justify-between gap-4 px-4 py-5 sm:px-8 lg:px-12 xl:px-16">
                    <Link
                        href="/"
                        className="flex items-center gap-3"
                        aria-label="Waste2Value home"
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-md shadow-emerald-900/10">
                            <Leaf size={27} />
                        </div>

                        <div>
                            <p className="text-xl font-extrabold tracking-tight sm:text-2xl">
                                Waste<span className="text-emerald-600">2</span>
                                Value
                            </p>
                            <p className="text-xs font-medium tracking-wide text-gray-500">
                                SMARTER WASTE. GREENER FUTURE.
                            </p>
                        </div>
                    </Link>

                    <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 sm:flex">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        AI Waste Detection
                    </div>
                </div>
            </header>

            <div className="w-full max-w-none px-4 py-8 sm:px-8 sm:py-12 lg:px-12 xl:px-16 2xl:px-20">
                <section className="mb-9">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800">
                        <Sprout size={17} />
                        Make Every Item Count
                    </div>

                    <h1 className="max-w-4xl text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                        Give your waste a{" "}
                        <span className="text-emerald-700">
                            second chance.
                        </span>
                    </h1>

                    <p className="mt-4 max-w-3xl text-base leading-7 text-gray-600 sm:text-lg">
                        Scan an item to identify waste materials with AI.
                        Take a step towards responsible segregation and a
                        cleaner environment.
                    </p>
                </section>

                <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                            <ScanLine size={24} />
                        </div>
                        <div>
                            <h2 className="font-bold">AI-Powered Scanning</h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Identify visible waste items
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-lime-50 text-lime-700">
                            <Recycle size={24} />
                        </div>
                        <div>
                            <h2 className="font-bold">Better Segregation</h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Understand detected materials
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h2 className="font-bold">Responsible Disposal</h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Check categories before disposal
                            </p>
                        </div>
                    </div>
                </section>

                <section className="grid w-full grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                    <div className="min-w-0 overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
                        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-5 sm:px-7">
                            <div>
                                <h2 className="text-xl font-bold">
                                    Waste Scanner
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Capture an image or upload a photo
                                </p>
                            </div>
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                <Camera size={23} />
                            </div>
                        </div>

                        <div className="p-4 sm:p-7">
                            <div className="relative flex min-h-[280px] items-center justify-center overflow-hidden rounded-2xl bg-[#10291d] sm:min-h-[390px] lg:min-h-[440px]">
                                {photoData ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={photoData}
                                        alt="Selected waste for AI analysis"
                                        className="max-h-[500px] w-full object-contain"
                                    />
                                ) : (
                                    <>
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            muted
                                            playsInline
                                            className={`h-full min-h-[280px] max-h-[500px] w-full object-cover sm:min-h-[390px] ${
                                                cameraOn ? "" : "hidden"
                                            }`}
                                        />

                                        {!cameraOn && (
                                            <div className="flex flex-col items-center px-6 py-12 text-center text-white">
                                                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10">
                                                    {loading ? (
                                                        <MoonLoader
                                                            color="#ffffff"
                                                            size={32}
                                                        />
                                                    ) : (
                                                        <ImageUp size={34} />
                                                    )}
                                                </div>
                                                <h3 className="text-lg font-bold">
                                                    {loading
                                                        ? "Preparing camera..."
                                                        : "Ready to scan waste"}
                                                </h3>
                                                <p className="mt-2 max-w-xs text-sm leading-6 text-white/70">
                                                    {cameraError
                                                        ? "Your camera is unavailable. Upload an image to continue."
                                                        : "Allow camera access or upload a clear image of the waste item."}
                                                </p>
                                            </div>
                                        )}

                                        {cameraOn && (
                                            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm">
                                                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                                                CAMERA LIVE
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <button
                                    type="button"
                                    onClick={capturePhoto}
                                    disabled={!cameraOn || loading || aiLoading}
                                    className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-4 font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <ScanLine size={20} />
                                    Capture &amp; Analyse
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    disabled={aiLoading}
                                    className="flex min-h-14 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
                                >
                                    <ImageUp size={20} />
                                    Upload Image
                                </button>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                            </div>

                            {photoData && (
                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 p-4">
                                    <p className="text-sm text-gray-600">
                                        {aiLoading
                                            ? "Analysing image and saving scan..."
                                            : "Image ready for analysis"}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={resetScan}
                                        disabled={aiLoading}
                                        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-900 disabled:opacity-50"
                                    >
                                        <RefreshCw size={16} />
                                        Scan another image
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="min-w-0 overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
                        <div className="border-b border-gray-100 px-5 py-5 sm:px-7">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                    <Recycle size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">
                                        Scan Results
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-500">
                                        AI-generated detection report
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 sm:p-7">
                            {aiLoading ? (
                                <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                                    <MoonLoader
                                        color="#047857"
                                        size={48}
                                    />
                                    <h3 className="mt-6 text-lg font-bold">
                                        Analysing your image
                                    </h3>
                                    <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">
                                        Our AI model is examining the image
                                        and saving the scan.
                                    </p>
                                </div>
                            ) : aiData ? (
                                <div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-2xl bg-emerald-50 p-4">
                                            <p className="text-sm font-medium text-emerald-800">
                                                Items detected
                                            </p>
                                            <p className="mt-2 text-3xl font-extrabold text-emerald-900">
                                                {aiData.total_count}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl bg-lime-50 p-4">
                                            <p className="text-sm font-medium text-lime-800">
                                                Scan number
                                            </p>
                                            <p className="mt-2 text-3xl font-extrabold text-lime-900">
                                                {aiData.serial_no}
                                            </p>
                                        </div>
                                    </div>

                                    {aiData.detections.length > 0 ? (
                                        <div className="mt-6">
                                            <div className="mb-3 flex items-center gap-2">
                                                <CheckCircle2
                                                    size={19}
                                                    className="text-emerald-600"
                                                />
                                                <h3 className="font-bold">
                                                    Detected Items
                                                </h3>
                                            </div>

                                            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                                                {aiData.detections.map(
                                                    (detection, index) => (
                                                        <div
                                                            key={`${detection.category}-${index}`}
                                                            className="rounded-2xl border border-gray-100 bg-[#fbfcfa] p-4 transition hover:border-emerald-200"
                                                        >
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="flex min-w-0 items-start gap-3">
                                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-sm font-bold text-emerald-800">
                                                                        {index + 1}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <h4 className="break-words font-bold capitalize text-gray-800">
                                                                            {detection.category.replace(
                                                                                /_/g,
                                                                                " "
                                                                            )}
                                                                        </h4>
                                                                        <p className="mt-1 text-xs text-gray-500">
                                                                            AI detection confidence
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
                                                                    {detection.confidence.toFixed(1)}%
                                                                </span>
                                                            </div>

                                                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
                                                                <div
                                                                    className="h-full rounded-full bg-emerald-600"
                                                                    style={{
                                                                        width: `${Math.min(
                                                                            100,
                                                                            Math.max(
                                                                                0,
                                                                                detection.confidence
                                                                            )
                                                                        )}%`,
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                                            <div className="flex items-start gap-3">
                                                <AlertCircle
                                                    className="mt-0.5 shrink-0 text-amber-700"
                                                    size={22}
                                                />
                                                <div>
                                                    <h3 className="font-bold text-amber-900">
                                                        No waste detected
                                                    </h3>
                                                    <p className="mt-1 text-sm leading-6 text-amber-800">
                                                        Try a clearer image
                                                        with the waste item
                                                        visible and well lit.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                                        <div className="flex items-start gap-3">
                                            <Leaf
                                                size={21}
                                                className="mt-0.5 shrink-0 text-emerald-700"
                                            />
                                            <div>
                                                <h4 className="font-bold text-emerald-900">
                                                    Dispose responsibly
                                                </h4>
                                                <p className="mt-1 text-sm leading-6 text-emerald-800">
                                                    AI predictions may be
                                                    incorrect. Verify the
                                                    material and local disposal
                                                    rules before disposing of
                                                    an item.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {aiData.total_count > 0 && (
                                        <Link
                                            href={`/dump-waste?recycle=false&wasteName=${encodeURIComponent(
                                                aiData.waste_name
                                            )}&wasteType=${encodeURIComponent(
                                                aiData.waste_type
                                            )}&material=${encodeURIComponent(
                                                aiData.material
                                            )}&totalwaste=${aiData.total_count}`}
                                            className="mt-5 flex min-h-14 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-4 text-center font-semibold text-white transition hover:bg-emerald-800"
                                        >
                                            <Trash2 size={19} />
                                            Continue to Disposal
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                                        <Leaf size={38} />
                                    </div>
                                    <h3 className="mt-5 text-lg font-bold">
                                        Your results will appear here
                                    </h3>
                                    <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">
                                        Capture a photo or upload an image to
                                        start identifying waste with
                                        Waste2Value.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <footer className="mt-10 w-full rounded-3xl bg-[#173d2b] px-6 py-10 text-center text-white sm:px-12 lg:px-20">
                    <div className="flex w-full flex-col items-center justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                            <Sprout size={34} />
                        </div>
                        <h2 className="mt-5 text-2xl font-bold sm:text-3xl lg:text-4xl">
                            Scan Smart. Segregate Better.
                        </h2>
                        <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-emerald-100 sm:text-base lg:text-lg">
                            Waste2Value — supporting responsible waste
                            identification, smarter segregation, and a
                            greener future through technology.
                        </p>
                        <div className="mt-6 h-1 w-24 rounded-full bg-emerald-400" />
                        <p className="mt-5 text-xs font-semibold tracking-[0.2em] text-emerald-200 sm:text-sm">
                            EVERY SMALL ACTION CAN MAKE A DIFFERENCE
                        </p>
                        <p className="mt-4 text-xs text-emerald-100/70">
                            Waste2Value © 2026 | Building a Sustainable
                            Tomorrow
                        </p>
                    </div>
                </footer>
            </div>
        </main>
    );
};

export default Page;