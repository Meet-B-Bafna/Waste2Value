"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    AlertCircle,
    Camera,
    CheckCircle2,
    Clock,
    Loader2,
    MapPin,
    RotateCcw,
    Satellite,
    Send,
} from "lucide-react";

const TIME_OPTIONS: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "medium",
};

export default function ReportWastePage() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [photo, setPhoto] = useState<string | null>(null);
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [accuracy, setAccuracy] = useState<number | null>(null);
    const [now, setNow] = useState<Date | null>(null);

    const [cameraReady, setCameraReady] = useState(false);
    const [cameraLoading, setCameraLoading] = useState(true);
    const [cameraError, setCameraError] = useState("");
    const [locationError, setLocationError] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);

    const hasLocation = latitude !== null && longitude !== null;

    /* ---------------------------- Camera ---------------------------- */

    const stopCamera = useCallback(() => {
        const stream = streamRef.current;
        streamRef.current = null;
        stream?.getTracks().forEach((track) => track.stop());

        const video = videoRef.current;
        if (video) {
            video.pause();
            video.srcObject = null;
        }
        setCameraReady(false);
    }, []);

    const startCamera = useCallback(async () => {
        setCameraError("");
        setCameraLoading(true);

        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error(
                    "Camera access is unavailable. Open the app using localhost or HTTPS."
                );
            }

            stopCamera();

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: "environment" } },
                audio: false,
            });

            streamRef.current = stream;
            const video = videoRef.current;

            if (!video) {
                stream.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
                return;
            }

            video.srcObject = stream;

            await new Promise<void>((resolve, reject) => {
                video.onloadedmetadata = () => resolve();
                video.onerror = () =>
                    reject(new Error("The camera video could not be loaded."));
            });

            try {
    await video.play();
} catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
        // The video was interrupted while loading; don't treat it as a camera failure.
        return;
    }
    throw error;
}

setCameraReady(true);

            setCameraReady(true);
        } catch (error) {
            console.error("Camera error:", error);
            stopCamera();
            setCameraError(
                error instanceof Error
                    ? error.message
                    : "Unable to open camera. Check camera permissions."
            );
        } finally {
            setCameraLoading(false);
        }
    }, [stopCamera]);

    /* ------------------- Camera + live location on open ------------------- */

    useEffect(() => {
    void startCamera();

    if (!navigator.geolocation) {
        setLocationError("Your browser does not support location detection.");
        return () => stopCamera();
    }

    const watchId = navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude, accuracy } = position.coords;

            // Always use the latest GPS reading.
            setLatitude(latitude);
            setLongitude(longitude);
            setAccuracy(accuracy);
            setLocationError("");
        },
        (error) => {
            if (error.code === error.PERMISSION_DENIED) {
                setLocationError(
                    "Location permission denied. Please allow location access."
                );
            } else {
                setLocationError(
                    "Unable to obtain GPS location. Move to an open area and try again."
                );
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 0,
        }
    );

    return () => {
        navigator.geolocation.clearWatch(watchId);
        stopCamera();
    };
}, [startCamera, stopCamera]);

    /* ---------------------------- Live clock ---------------------------- */

    // Set after mount only, so server and client HTML match (no hydration error).
    useEffect(() => {
        setNow(new Date());
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    /* ------------------------------ Capture ------------------------------ */

    const capturePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        setIsError(true);

        if (!video || !canvas || !video.videoWidth) {
            setMessage("Camera is not ready. Please try again.");
            return;
        }

        if (latitude === null || longitude === null) {
            setMessage("Waiting for your location. Allow location access and try again.");
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context = canvas.getContext("2d");
        if (!context) {
            setMessage("Could not capture the photo.");
            return;
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Geotag panel burned into the image (matches the live overlay).
        const panelHeight = Math.max(110, canvas.height * 0.2);
        const padding = Math.max(12, canvas.width * 0.025);
        const titleSize = Math.max(16, canvas.width * 0.026);
        const textSize = Math.max(12, canvas.width * 0.019);
        const top = canvas.height - panelHeight;

        context.fillStyle = "rgba(6, 30, 20, 0.78)";
        context.fillRect(0, top, canvas.width, panelHeight);

        context.fillStyle = "#4ade80";
        context.fillRect(0, top, Math.max(5, canvas.width * 0.008), panelHeight);

        context.textAlign = "left";
        context.textBaseline = "top";

        context.fillStyle = "#86efac";
        context.font = `bold ${titleSize}px Arial`;
        context.fillText("Waste2Value | Waste Report", padding * 1.4, top + padding);

        context.fillStyle = "#ffffff";
        context.font = `${textSize}px Arial`;

        const accText = accuracy !== null ? `  (±${Math.round(accuracy)} m)` : "";
        context.fillText(
            `GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}${accText}`,
            padding * 1.4,
            top + padding + titleSize + 8
        );
        context.fillText(
            `Captured: ${(now ?? new Date()).toLocaleString("en-IN", TIME_OPTIONS)}`,
            padding * 1.4,
            top + padding + titleSize + textSize + 16
        );

        setPhoto(canvas.toDataURL("image/jpeg", 0.9));
        setMessage("");
        setIsError(false);
        stopCamera();
    };

    const retakePhoto = () => {
        setPhoto(null);
        setMessage("");
        setSubmitted(false);
        // The <video> stays mounted, so the camera can restart right away.
        void startCamera();
    };

    /* ------------------------------ Submit ------------------------------ */

    const submitReport = async () => {
        if (!photo || latitude === null || longitude === null) {
            setIsError(true);
            setMessage("Capture a photo and allow location access first.");
            return;
        }

        setSubmitting(true);
        setMessage("");

        try {
            const response = await fetch("/api/report-waste", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ photo, latitude, longitude }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to submit report.");
            }

            setSubmitted(true);
            setIsError(false);
            setMessage(
                result.message || "Your waste report was submitted successfully."
            );
        } catch (error) {
            setIsError(true);
            setMessage(
                error instanceof Error
                    ? error.message
                    : "Something went wrong. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    /* ------------------------------ UI ------------------------------ */

    const accuracyLabel =
        accuracy === null
            ? "Locating..."
            : accuracy <= 20
              ? "Strong signal"
              : accuracy <= 60
                ? "Fair signal"
                : "Weak signal";

    const accuracyColor =
        accuracy === null
            ? "bg-amber-400"
            : accuracy <= 20
              ? "bg-green-400"
              : accuracy <= 60
                ? "bg-yellow-400"
                : "bg-orange-500";

    const signalLevel: "none" | "strong" | "fair" | "weak" =
        accuracy === null
            ? "none"
            : accuracy <= 20
              ? "strong"
              : accuracy <= 60
                ? "fair"
                : "weak";

    const signalGuide = [
        {
            key: "strong" as const,
            title: "Strong signal",
            range: "Within 20 m",
            dot: "bg-green-500",
            text: "Your location is very accurate. The report will point to the exact spot.",
        },
        {
            key: "fair" as const,
            title: "Fair signal",
            range: "20 to 60 m",
            dot: "bg-yellow-400",
            text: "Good enough for most reports. The pin may be off by a few buildings.",
        },
        {
            key: "weak" as const,
            title: "Weak signal",
            range: "More than 60 m",
            dot: "bg-orange-500",
            text: "The location may be far from the waste. Move to an open area, away from tall buildings or roofs, and wait a few seconds.",
        },
    ];

    return (
        <main className="mx-auto w-full max-w-[690px] space-y-5 px-4 pb-36 pt-6">
            {/* Header */}
            <header className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-700 text-white shadow-sm">
                    <Camera size={22} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-green-950">
                        Report Waste
                    </h1>
                    <p className="mt-1 text-sm leading-relaxed text-gray-600">
                        Take a photo of waste in a public place. Your location and
                        time are stamped on it automatically.
                    </p>
                </div>
            </header>

            {/* Viewfinder */}
            <section className="overflow-hidden rounded-3xl border border-green-900/10 bg-white p-3 shadow-sm">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-950">
                    {/* Video stays mounted so retake works instantly */}
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className={`h-full w-full object-cover ${photo ? "hidden" : ""}`}
                    />

                    {photo && (
                        <img
                            src={photo}
                            alt="Captured waste with location stamp"
                            className="h-full w-full object-contain"
                        />
                    )}

                    {/* Live HUD */}
                    {!photo && (
                        <>
                            {/* Corner brackets */}
                            <div className="pointer-events-none absolute inset-4">
                                <span className="absolute left-0 top-0 h-6 w-6 rounded-tl-lg border-l-2 border-t-2 border-white/80" />
                                <span className="absolute right-0 top-0 h-6 w-6 rounded-tr-lg border-r-2 border-t-2 border-white/80" />
                                <span className="absolute bottom-16 left-0 h-6 w-6 rounded-bl-lg border-b-2 border-l-2 border-white/80" />
                                <span className="absolute bottom-16 right-0 h-6 w-6 rounded-br-lg border-b-2 border-r-2 border-white/80" />
                            </div>

                            {/* Live status chip */}
                            <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
                                <span className="relative flex h-2 w-2">
                                    <span
                                        className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${accuracyColor}`}
                                    />
                                    <span
                                        className={`relative inline-flex h-2 w-2 rounded-full ${accuracyColor}`}
                                    />
                                </span>
                                {accuracyLabel}
                            </div>

                            {/* Geotag panel (live) */}
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 border-l-4 border-green-400 bg-green-950/80 px-4 py-3 text-white backdrop-blur-sm">
                                <p className="text-sm font-bold text-green-300">
                                    Waste2Value | Waste Report
                                </p>
                                <p className="mt-1 flex items-center gap-1.5 text-xs">
                                    <MapPin size={12} className="shrink-0 text-green-300" />
                                    {hasLocation
                                        ? `${latitude!.toFixed(6)}, ${longitude!.toFixed(6)}`
                                        : "Fetching location..."}
                                    {accuracy !== null && (
                                        <span className="text-white/70">
                                            (±{Math.round(accuracy)} m)
                                        </span>
                                    )}
                                </p>
                                <p className="mt-0.5 flex items-center gap-1.5 text-xs">
                                    <Clock size={12} className="shrink-0 text-green-300" />
                                    {now
                                        ? now.toLocaleString("en-IN", TIME_OPTIONS)
                                        : "Loading time..."}
                                </p>
                            </div>
                        </>
                    )}

                    {/* Camera loading / error overlay */}
                    {!photo && !cameraReady && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-950/90 px-6 text-center text-white">
                            {cameraError ? (
                                <>
                                    <AlertCircle size={30} className="text-red-400" />
                                    <p className="text-sm text-white/80">{cameraError}</p>
                                    <button
                                        type="button"
                                        onClick={() => void startCamera()}
                                        className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-900"
                                    >
                                        Try again
                                    </button>
                                </>
                            ) : (
                                cameraLoading && (
                                    <>
                                        <Loader2 size={28} className="animate-spin text-green-300" />
                                        <p className="text-sm text-white/80">Opening camera...</p>
                                    </>
                                )
                            )}
                        </div>
                    )}
                </div>

                <canvas ref={canvasRef} className="hidden" />

                {photo ? (
                    <button
                        type="button"
                        onClick={retakePhoto}
                        disabled={submitting}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-green-700 px-4 py-3 font-semibold text-green-800 transition active:scale-[0.99] disabled:opacity-50"
                    >
                        <RotateCcw size={19} />
                        Retake photo
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={capturePhoto}
                        disabled={!cameraReady || !hasLocation}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-green-700 px-4 py-3.5 font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-50"
                    >
                        <Camera size={20} />
                        {!cameraReady
                            ? "Preparing camera..."
                            : !hasLocation
                              ? "Waiting for location..."
                              : "Capture waste photo"}
                    </button>
                )}
            </section>

            {/* Status checklist */}
            <section className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-green-900/10 bg-white p-3">
                    <div className="flex items-center gap-2">
                        <span
                            className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                cameraReady || photo
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-500"
                            }`}
                        >
                            <Camera size={16} />
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Camera</p>
                            <p className="text-xs text-gray-600">
                                {photo ? "Photo taken" : cameraReady ? "Ready" : "Starting"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-green-900/10 bg-white p-3">
                    <div className="flex items-center gap-2">
                        <span
                            className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                hasLocation
                                    ? "bg-green-100 text-green-700"
                                    : locationError
                                      ? "bg-red-100 text-red-600"
                                      : "bg-gray-100 text-gray-500"
                            }`}
                        >
                            <Satellite size={16} />
                        </span>
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Location</p>
                            <p className="text-xs text-gray-600">
                                {hasLocation
                                    ? `±${Math.round(accuracy ?? 0)} m`
                                    : locationError
                                      ? "Blocked"
                                      : "Locating"}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Weak signal tip (shows only when relevant) */}
            {!photo && signalLevel === "weak" && (
                <p
                    role="status"
                    className="flex items-start gap-2 rounded-2xl bg-orange-50 p-3 text-sm text-orange-800"
                >
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    GPS signal is weak. Step into an open area and wait a few
                    seconds for a more accurate location.
                </p>
            )}

            {/* What the signal levels mean */}
            <section className="rounded-2xl border border-green-900/10 bg-white p-4">
                <h2 className="text-sm font-semibold text-gray-900">
                    What does the signal mean?
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">
                    The signal shows how accurate your GPS location is. The
                    number after ± is the possible error in metres.
                </p>

                <ul className="mt-3 space-y-2">
                    {signalGuide.map((item) => (
                        <li
                            key={item.key}
                            className={`flex items-start gap-3 rounded-xl p-3 ${
                                signalLevel === item.key
                                    ? "bg-green-50 ring-1 ring-green-600/30"
                                    : "bg-gray-50"
                            }`}
                        >
                            <span
                                className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${item.dot}`}
                            />
                            <div>
                                <p className="text-sm font-semibold text-gray-900">
                                    {item.title}
                                    <span className="ml-2 text-xs font-normal text-gray-500">
                                        {item.range}
                                    </span>
                                    {signalLevel === item.key && (
                                        <span className="ml-2 rounded-full bg-green-700 px-2 py-0.5 text-[10px] font-medium text-white">
                                            You are here
                                        </span>
                                    )}
                                </p>
                                <p className="mt-0.5 text-xs leading-relaxed text-gray-600">
                                    {item.text}
                                </p>
                            </div>
                        </li>
                    ))}

                    <li
                        className={`flex items-start gap-3 rounded-xl p-3 ${
                            signalLevel === "none"
                                ? "bg-green-50 ring-1 ring-green-600/30"
                                : "bg-gray-50"
                        }`}
                    >
                        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-400" />
                        <div>
                            <p className="text-sm font-semibold text-gray-900">
                                Locating...
                            </p>
                            <p className="mt-0.5 text-xs leading-relaxed text-gray-600">
                                Your phone is still finding your position. This
                                usually takes a few seconds.
                            </p>
                        </div>
                    </li>
                </ul>
            </section>

            {locationError && (
                <p
                    role="alert"
                    className="flex items-start gap-2 rounded-2xl bg-red-50 p-3 text-sm text-red-700"
                >
                    <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    {locationError}
                </p>
            )}

            {/* Submit */}
            <button
                type="button"
                onClick={submitReport}
                disabled={!photo || !hasLocation || submitting || submitted}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-4 font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
            >
                {submitting ? (
                    <Loader2 size={19} className="animate-spin" />
                ) : submitted ? (
                    <CheckCircle2 size={19} />
                ) : (
                    <Send size={19} />
                )}
                {submitting
                    ? "Submitting report..."
                    : submitted
                      ? "Report submitted"
                      : "Submit waste report"}
            </button>

            {message && (
                <p
                    role="status"
                    className={`flex items-start gap-2 rounded-2xl p-4 text-sm ${
                        isError
                            ? "bg-red-50 text-red-700"
                            : "bg-green-50 text-green-900"
                    }`}
                >
                    {isError ? (
                        <AlertCircle size={18} className="mt-0.5 shrink-0" />
                    ) : (
                        <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                    )}
                    {message}
                </p>
            )}
        </main>
    );
}
