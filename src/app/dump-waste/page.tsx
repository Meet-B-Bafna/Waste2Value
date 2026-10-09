"use client";

import React, { useEffect, useRef, useState } from "react";
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { Coins, Scan, X, Camera, MapPin } from "lucide-react";
import { useSearchParams } from "next/navigation";

import SpinLoading from "@/components/loading/SpinLoading";
import Toast from "@/utils/toast";

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

interface Coupon {
    id: number;
    service: string;
    discount: string;
    code: string;
}

const Page: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [photoData, setPhotoData] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiData, setAiData] = useState<string | null>(null);
    const [claimRewards, setClaimRewards] = useState(false);
    const [disableCapture, setDisableCapture] = useState(false);
    const [dumpLoading, setDumpLoading] = useState(false);
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [disableClaimBtn, setDisableClaimBtn] = useState(false);
    const [isDryWaste, setIsDryWaste] = useState("");
    const [claimError, setClaimError] = useState(false);
    const [cameraError, setCameraError] = useState("");

    const searchParams = useSearchParams();

    const recycle = searchParams.get("recycle");
    const wasteName = searchParams.get("wasteName");
    const wasteType = searchParams.get("wasteType");
    const material = searchParams.get("material");
    const totalwaste = searchParams.get("totalwaste");
    const dryWaste = searchParams.get("dryWaste");

    useEffect(() => {
        const generateCouponCode = () => {
            const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            let code = "";

            for (let i = 0; i < 8; i++) {
                code += characters.charAt(Math.floor(Math.random() * characters.length));
            }

            return code;
        };

        const services = [
            "Zomato", "Swiggy", "Uber Eats", "Amazon", "Netflix",
            "Starbucks", "Gym", "Spa", "Movie Theater", "Bookstore",
        ];

        const generated: Coupon[] = Array.from({ length: 10 }, (_, index) => ({
            id: index + 1,
            service: services[Math.floor(Math.random() * services.length)],
            discount: "Buy one, get one free on any item",
            code: generateCouponCode(),
        }));

        setCoupons(generated.slice(0, 1));
    }, []);

    const stopCamera = () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const startCamera = async () => {
        setLoading(true);
        setCameraError("");

        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error("Camera access is not supported by this browser.");
            }

            stopCamera();

            let stream: MediaStream;

            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: {
                        facingMode: { exact: "environment" },
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                    },
                });
            } catch (rearCameraError) {
                console.warn("Exact rear camera unavailable; trying fallback.", rearCameraError);

                stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: {
                        facingMode: { ideal: "environment" },
                    },
                });
            }

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            } else {
                stream.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
        } catch (error) {
            console.error("Error accessing camera:", error);
            setCameraError("Unable to access the camera. Check browser permissions and try again.");
            Toast.ErrorShowToast("Unable to access the camera.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void startCamera();

        return () => {
            streamRef.current?.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        };
        // Start the camera when the page mounts.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!navigator.geolocation) {
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLatitude(position.coords.latitude);
                setLongitude(position.coords.longitude);
            },
            (error) => {
                console.warn("Location unavailable:", error.message);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    }, []);

    const capturePhoto = () => {
        const video = videoRef.current;

        if (!video || !video.videoWidth || !video.videoHeight) {
            Toast.ErrorShowToast("Camera is not ready. Please try again.");
            return;
        }

        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context = canvas.getContext("2d");

        if (!context) {
            Toast.ErrorShowToast("Unable to capture photo.");
            return;
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        setPhotoData(canvas.toDataURL("image/jpeg", 0.9));
        setAiData(null);
        setIsDryWaste("");
        setDisableCapture(true);
        setDisableClaimBtn(false);
        setClaimError(false);

        // Stop the camera after capture to free the device camera.
        stopCamera();
    };

    const getDustBinType = async (imageData: string) => {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error("Gemini API key is not configured.");
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            safetySettings,
        });

        const formatMatch = imageData.match(/^data:(image\/[\w+-]+);base64,/);

        if (!formatMatch) {
            throw new Error("Unsupported image format.");
        }

        const image = {
            inlineData: {
                data: imageData.replace(formatMatch[0], ""),
                mimeType: formatMatch[1],
            },
        };

        const result = await model.generateContent([
            "Does this look like a dry waste dustbin? Respond with only true or false.",
            image,
        ]);

        return result.response.text().trim().toLowerCase();
    };

    const scanImage = async (imageData: string) => {
        setAiLoading(true);
        setAiData(null);
        setIsDryWaste("");

        try {
            const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

            if (!apiKey) {
                throw new Error("Gemini API key is not configured.");
            }

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
                model: "gemini-1.5-pro",
                safetySettings,
            });

            const formatMatch = imageData.match(/^data:(image\/[\w+-]+);base64,/);

            if (!formatMatch) {
                throw new Error("Unsupported image format.");
            }

            const image = {
                inlineData: {
                    data: imageData.replace(formatMatch[0], ""),
                    mimeType: formatMatch[1],
                },
            };

            const [binResult, dryWasteResult] = await Promise.all([
                model.generateContent([
                    "Does this look like a dustbin? Respond with only yes or no.",
                    image,
                ]),
                getDustBinType(imageData),
            ]);

            setAiData(binResult.response.text().trim().toLowerCase());
            setIsDryWaste(dryWasteResult);
        } catch (error) {
            console.error("Error scanning image:", error);
            Toast.ErrorShowToast(
                error instanceof Error ? error.message : "Error verifying dustbin."
            );
        } finally {
            setAiLoading(false);
        }
    };

    useEffect(() => {
        if (photoData) {
            void scanImage(photoData);
        }
        // Scan only when a new photo is captured.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [photoData]);

    const isCorrectDustbin =
        aiData?.trim().toLowerCase() === "yes" &&
        (isDryWaste === "true" || isDryWaste === "false") &&
        (dryWaste?.trim().toLowerCase() === "true" ||
            dryWaste?.trim().toLowerCase() === "false") &&
        isDryWaste === dryWaste?.trim().toLowerCase();

    const retakePhoto = async () => {
        setPhotoData(null);
        setAiData(null);
        setIsDryWaste("");
        setDisableCapture(false);
        setDisableClaimBtn(false);
        setClaimError(false);
        await startCamera();
    };

    const claimPointsAndCoupon = async () => {
        if (disableClaimBtn || dumpLoading) return;

        if (!wasteName || !wasteType || !recycle) {
            Toast.ErrorShowToast("Waste details are missing.");
            return;
        }

        if (!isCorrectDustbin) {
            Toast.ErrorShowToast("Please verify the correct dustbin first.");
            return;
        }

        if (coupons.length === 0) {
            Toast.ErrorShowToast("Reward details are not ready.");
            return;
        }

        setDumpLoading(true);
        setClaimError(false);

        try {
            const res = await fetch("/api/add-points", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    wasteNameByAi: wasteName,
                    wasteType,
                    latitude,
                    longitude,
                    isRecyleable: recycle === "true",
                    wastepoints: recycle === "true" ? 12 : 5,
                    service: coupons[0].service,
                    discount: coupons[0].discount,
                    CouponCode: coupons[0].code,
                }),
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || "Error claiming rewards.");
            }

            setDisableClaimBtn(true);
            setClaimRewards(true);

            Toast.SuccessShowToast(
                `${data.pointsCredited ?? (recycle === "true" ? 12 : 5)} points credited`
            );

            console.log("Waste disposal recorded:", data);
        } catch (error) {
            console.error("Error claiming points:", error);
            setClaimError(true);

            Toast.ErrorShowToast(
                error instanceof Error ? error.message : "Error claiming rewards."
            );
        } finally {
            setDumpLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white px-4 pb-28 pt-6">
            <div className="mx-auto w-full max-w-3xl">
                <header className="mb-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-800">
                            <Camera size={25} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                                Dump Waste
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Capture the dustbin to verify your disposal.
                            </p>
                        </div>
                    </div>
                </header>

                {/* Camera card */}
                <section className="mx-auto w-full max-w-xl overflow-hidden rounded-3xl border border-gray-200 bg-white p-3 shadow-lg">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-950">
                        {!photoData && (
                            <>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="absolute inset-0 h-full w-full object-cover"
                                />

                                {loading && (
                                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
                                        <SpinLoading />
                                    </div>
                                )}
                            </>
                        )}

                        {photoData && (
                            <img
                                src={photoData}
                                alt="Captured dustbin"
                                className="absolute inset-0 h-full w-full object-contain"
                            />
                        )}

                        {!loading && cameraError && !photoData && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 text-center text-white">
                                <Camera size={36} />
                                <p className="text-sm">{cameraError}</p>
                                <button
                                    type="button"
                                    onClick={() => void startCamera()}
                                    className="rounded-xl bg-white px-4 py-2 font-semibold text-gray-900"
                                >
                                    Retry camera
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="px-2 pb-2 pt-4 text-center">
                        {!photoData ? (
                            <>
                                <p className="text-sm text-gray-600">
                                    Point the rear camera at the waste bin.
                                </p>

                                <button
                                    type="button"
                                    onClick={capturePhoto}
                                    disabled={loading || Boolean(cameraError)}
                                    className="mt-4 flex w-full items-center justify-center gap-3 rounded-xl bg-green-700 px-5 py-4 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Scan size={22} />
                                    Capture & Verify Disposal
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={() => void retakePhoto()}
                                disabled={aiLoading}
                                className="flex w-full items-center justify-center gap-3 rounded-xl border border-green-700 px-5 py-4 font-semibold text-green-800 transition hover:bg-green-50 disabled:opacity-50"
                            >
                                <Camera size={22} />
                                Retake Photo
                            </button>
                        )}

                        {latitude !== null && longitude !== null && (
                            <p className="mt-3 flex items-center justify-center gap-1 text-xs text-gray-500">
                                <MapPin size={13} />
                                Location captured
                            </p>
                        )}
                    </div>
                </section>

                {/* Gemini loading */}
                {aiLoading && (
                    <div className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center bg-black/70">
                        <div className="flex flex-col items-center gap-4 text-white">
                            <SpinLoading />
                            <p className="text-sm">Verifying dustbin with AI...</p>
                        </div>
                    </div>
                )}

                {/* Verification result */}
                {!aiLoading && aiData && (
                    <section className="mx-auto mb-8 mt-6 w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                        <h2 className="text-xl font-bold text-gray-900">
                            Disposal Verification
                        </h2>

                        <div className="mt-4 space-y-3 text-sm">
                            <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
                                <span className="text-gray-500">Is this a dustbin?</span>
                                <span className="font-semibold capitalize text-gray-900">
                                    {aiData}
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
                                <span className="text-gray-500">Dry waste bin?</span>
                                <span className="font-semibold capitalize text-gray-900">
                                    {isDryWaste}
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
                                <span className="text-gray-500">Recyclable</span>
                                <span className="font-semibold capitalize text-gray-900">
                                    {recycle}
                                </span>
                            </div>

                            <div>
                                <p className="text-gray-500">Waste name</p>
                                <p className="mt-1 font-semibold capitalize text-gray-900">
                                    {wasteName || "Not specified"}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-500">Waste type</p>
                                <p className="mt-1 font-semibold text-gray-900">
                                    {wasteType || "Not specified"}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-500">Material</p>
                                <p className="mt-1 font-semibold text-gray-900">
                                    {material || "Not specified"}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-500">Total waste</p>
                                <p className="mt-1 font-semibold text-gray-900">
                                    {totalwaste || "Not specified"}
                                </p>
                            </div>

                            <div>
                                <p className="text-gray-500">Expected bin category</p>
                                <p className="mt-1 font-semibold text-gray-900">
                                    {dryWaste === "true" ? "Dry waste" : dryWaste === "false" ? "Wet waste" : "Not specified"}
                                </p>
                            </div>
                        </div>

                        {isCorrectDustbin ? (
                            <button
                                type="button"
                                onClick={claimPointsAndCoupon}
                                disabled={disableClaimBtn || dumpLoading}
                                className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-green-700 p-4 font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-gray-400"
                            >
                                <Coins size={20} />
                                {dumpLoading
                                    ? "Processing..."
                                    : disableClaimBtn
                                      ? "Rewards Claimed"
                                      : `Claim ${recycle === "true" ? 12 : 5} Points & Reward`}
                            </button>
                        ) : (
                            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm font-medium text-red-700">
                                The bin verification did not match the expected waste category. Please retake the photo and try again.
                            </div>
                        )}

                        {claimError && (
                            <button
                                type="button"
                                onClick={claimPointsAndCoupon}
                                disabled={dumpLoading || disableClaimBtn}
                                className="mt-3 w-full rounded-xl border border-green-700 p-3 font-semibold text-green-800 disabled:opacity-50"
                            >
                                Retry Claim
                            </button>
                        )}
                    </section>
                )}

                {/* Reward modal */}
                {claimRewards && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
                        <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">
                                    Reward Claimed
                                </h2>

                                <button
                                    type="button"
                                    onClick={() => setClaimRewards(false)}
                                    aria-label="Close reward window"
                                    className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="mt-6 text-center">
                                <p className="text-sm text-gray-500">
                                    Congratulations! Your disposal has been recorded.
                                </p>

                                <p className="mt-3 text-3xl font-bold text-green-700">
                                    +{recycle === "true" ? 12 : 5} points
                                </p>

                                {coupons.slice(0, 1).map((coupon) => (
                                    <div key={coupon.id} className="mt-6 rounded-2xl bg-green-50 p-4">
                                        <p className="text-sm text-gray-600">Your reward</p>
                                        <p className="mt-1 text-xl font-bold text-gray-900">
                                            {coupon.service}
                                        </p>
                                        <p className="mt-3 text-sm text-gray-600">
                                            {coupon.discount}
                                        </p>
                                        <p className="mt-3 rounded-xl border border-dashed border-green-700 bg-white p-3 font-mono text-lg font-bold tracking-widest text-green-800">
                                            {coupon.code}
                                        </p>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => setClaimRewards(false)}
                                    className="mt-6 w-full rounded-xl bg-green-700 px-4 py-3 font-semibold text-white hover:bg-green-800"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
};

export default Page;