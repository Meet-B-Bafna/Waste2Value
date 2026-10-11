"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, MapPin, RotateCcw, Send } from "lucide-react";

export default function DumpWastePage() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Identifies the most recent camera initialization request.
    const requestRef = useRef(0);

    const [photo, setPhoto] = useState<string | null>(null);
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [cameraError, setCameraError] = useState("");
    const [cameraReady, setCameraReady] = useState(false);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    // Stop the currently active camera.
    const stopCamera = useCallback(() => {
        // Invalidate pending getUserMedia() and play() operations.
        requestRef.current += 1;

        const stream = streamRef.current;
        streamRef.current = null;

        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
        }

        const video = videoRef.current;

        if (video) {
            video.pause();
            video.srcObject = null;
        }

        setCameraReady(false);
        setLoading(false);
    }, []);

    // Start the camera without allowing older requests to interfere.
    const startCamera = useCallback(async () => {
        const requestId = ++requestRef.current;

        setCameraError("");
        setCameraReady(false);
        setLoading(true);

        // Release the previous stream before requesting another.
        const previousStream = streamRef.current;
        streamRef.current = null;

        if (previousStream) {
            previousStream.getTracks().forEach((track) => track.stop());
        }

        const existingVideo = videoRef.current;

        if (existingVideo) {
            existingVideo.pause();
            existingVideo.srcObject = null;
        }

        let newStream: MediaStream | null = null;

        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error(
                    "Camera access is not supported. Use a supported browser on localhost or HTTPS."
                );
            }

            // "ideal" supports laptop webcams and phones with rear cameras.
            newStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: "environment" },
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
                audio: false,
            });

            // A newer request may have started while permission was pending.
            if (requestRef.current !== requestId) {
                newStream.getTracks().forEach((track) => track.stop());
                newStream = null;
                return;
            }

            const video = videoRef.current;

            if (!video) {
                newStream.getTracks().forEach((track) => track.stop());
                newStream = null;
                throw new Error("Camera preview is not ready. Please retry.");
            }

            streamRef.current = newStream;

            video.muted = true;
            video.playsInline = true;
            video.srcObject = newStream;

            // Wait for the video metadata so its dimensions are available.
            await new Promise<void>((resolve, reject) => {
                if (
                    video.readyState >=
                    HTMLMediaElement.HAVE_METADATA
                ) {
                    resolve();
                    return;
                }

                let settled = false;

                const cleanup = () => {
                    window.clearTimeout(timeout);
                    video.removeEventListener(
                        "loadedmetadata",
                        onMetadata
                    );
                    video.removeEventListener("error", onError);
                };

                const onMetadata = () => {
                    if (settled) return;

                    settled = true;
                    cleanup();
                    resolve();
                };

                const onError = () => {
                    if (settled) return;

                    settled = true;
                    cleanup();
                    reject(
                        new Error("The camera video could not be loaded.")
                    );
                };

                const timeout = window.setTimeout(() => {
                    if (settled) return;

                    settled = true;
                    cleanup();
                    reject(
                        new Error(
                            "The camera started, but the video did not become ready."
                        )
                    );
                }, 10000);

                video.addEventListener("loadedmetadata", onMetadata);
                video.addEventListener("error", onError);
            });

            // Check again before starting playback.
            if (
                requestRef.current !== requestId ||
                streamRef.current !== newStream ||
                videoRef.current !== video ||
                video.srcObject !== newStream
            ) {
                if (streamRef.current === newStream) {
                    newStream.getTracks().forEach((track) => track.stop());
                    streamRef.current = null;
                }

                return;
            }

            try {
                await video.play();
            } catch (playError) {
                // Playback can be interrupted when React cleans up an
                // effect or another request changes the video source.
                if (
                    requestRef.current !== requestId ||
                    streamRef.current !== newStream ||
                    videoRef.current !== video ||
                    video.srcObject !== newStream
                ) {
                    if (streamRef.current === newStream) {
                        newStream.getTracks().forEach((track) => track.stop());
                        streamRef.current = null;
                    }

                    return;
                }

                if (
                    playError instanceof Error &&
                    playError.name === "AbortError"
                ) {
                    // Retry once if this request still owns the video.
                    await new Promise<void>((resolve) => {
                        window.requestAnimationFrame(() => resolve());
                    });

                    if (
                        requestRef.current !== requestId ||
                        streamRef.current !== newStream ||
                        videoRef.current !== video ||
                        video.srcObject !== newStream
                    ) {
                        if (streamRef.current === newStream) {
                            newStream.getTracks().forEach((track) => track.stop());
                            streamRef.current = null;
                        }

                        return;
                    }

                    await video.play();
                } else {
                    throw playError;
                }
            }

            // Only the active request may mark the camera as ready.
            if (
                requestRef.current !== requestId ||
                streamRef.current !== newStream ||
                videoRef.current !== video ||
                video.srcObject !== newStream
            ) {
                if (streamRef.current === newStream) {
                    newStream.getTracks().forEach((track) => track.stop());
                    streamRef.current = null;
                }

                return;
            }

            setCameraReady(true);
            setCameraError("");
        } catch (error) {
            // Ignore failures from requests that have already been replaced.
            if (requestRef.current !== requestId) {
                if (newStream) {
                    newStream.getTracks().forEach((track) => track.stop());
                }

                return;
            }

            if (newStream) {
                newStream.getTracks().forEach((track) => track.stop());

                if (streamRef.current === newStream) {
                    streamRef.current = null;
                }

                const video = videoRef.current;

                if (video?.srcObject === newStream) {
                    video.pause();
                    video.srcObject = null;
                }
            }

            setCameraReady(false);

            console.error("Camera error:", error);

            let errorMessage =
                "Unable to access the camera. Please check browser permissions.";

            if (
                error instanceof Error &&
                error.name === "NotAllowedError"
            ) {
                errorMessage =
                    "Camera permission was denied. Allow camera access for localhost and retry.";
            } else if (
                error instanceof Error &&
                error.name === "NotFoundError"
            ) {
                errorMessage =
                    "No camera was found. Connect a camera or upload a photo instead.";
            } else if (
                error instanceof Error &&
                error.name === "NotReadableError"
            ) {
                errorMessage =
                    "The camera may be in use by another application. Close other camera apps and retry.";
            } else if (
                error instanceof Error &&
                error.name === "AbortError"
            ) {
                errorMessage =
                    "Camera playback was interrupted. Please retry the camera.";
            } else if (error instanceof Error && error.message) {
                errorMessage = error.message;
            }

            setCameraError(errorMessage);
        } finally {
            if (requestRef.current === requestId) {
                setLoading(false);
            }
        }
    }, []);

    // Camera lifecycle:
    // - Starts only when the video element is displayed.
    // - Stops on navigation and when a photo replaces the video.
    // - Invalidates pending requests during React Strict Mode cleanup.
    useEffect(() => {
        if (photo !== null) {
            return;
        }

        void startCamera();

        return () => {
            requestRef.current += 1;

            const stream = streamRef.current;
            streamRef.current = null;

            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }

            const video = videoRef.current;

            if (video) {
                video.pause();
                video.srcObject = null;
            }
        };
    }, [photo, startCamera]);

    // Capture location.
    useEffect(() => {
        if (!navigator.geolocation) {
            setMessage("Geolocation is not supported by this browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLatitude(position.coords.latitude);
                setLongitude(position.coords.longitude);
            },
            (error) => {
                console.warn("Location error:", error.message);

                setMessage(
                    "Location permission is required to identify the correct municipal office."
                );
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 60000,
            }
        );
    }, []);

    // Capture the photo.
    const capturePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (
            !video ||
            !canvas ||
            !video.videoWidth ||
            !video.videoHeight ||
            !streamRef.current
        ) {
            setCameraError("Camera is not ready. Please try again.");
            setCameraReady(false);
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context = canvas.getContext("2d");

        if (!context) {
            setCameraError("Unable to capture the photo.");
            return;
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        setPhoto(canvas.toDataURL("image/jpeg", 0.85));
        setMessage("");

        // Stop the camera and invalidate any pending camera operations.
        stopCamera();
    };

    // Retake a photo. The effect starts the camera after React renders
    // the video element again.
    const retakePhoto = () => {
        setPhoto(null);
        setMessage("");
        setCameraError("");
    };

    // Submit the community waste report.
    const submitReport = async () => {
        if (!photo) {
            setMessage("Please capture a photo first.");
            return;
        }

        if (latitude === null || longitude === null) {
            setMessage(
                "Location is unavailable. Please enable location access."
            );
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const response = await fetch("/api/report-waste", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    photo,
                    latitude,
                    longitude,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error || "Unable to submit the report."
                );
            }

            setMessage(
                result.message ||
                    "Your community waste report was submitted successfully."
            );
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-xl space-y-6 pb-6">
            <header>
                <h1 className="text-2xl font-bold text-gray-900">
                    Community Waste Reporting
                </h1>

                <p className="mt-2 text-sm text-gray-600">
                    Help keep your community clean by reporting waste dumped
                    in public areas.
                </p>
            </header>

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-950">
                    {photo ? (
                        <img
                            src={photo}
                            alt="Captured waste report"
                            className="h-full w-full object-contain"
                        />
                    ) : (
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="h-full w-full object-cover"
                            />

                            {loading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white">
                                    <p>Preparing camera...</p>
                                </div>
                            )}

                            {cameraError && !loading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4 text-center text-white">
                                    <Camera size={32} />

                                    <p className="text-sm">
                                        {cameraError}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() => void startCamera()}
                                        className="rounded-xl bg-white px-4 py-2 font-semibold text-gray-900"
                                    >
                                        Retry camera
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <canvas ref={canvasRef} className="hidden" />

                {photo ? (
                    <button
                        type="button"
                        onClick={retakePhoto}
                        disabled={loading}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-green-700 px-4 py-3 font-semibold text-green-800 disabled:opacity-50"
                    >
                        <RotateCcw size={19} />
                        Retake Photo
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={capturePhoto}
                        disabled={!cameraReady || loading || Boolean(cameraError)}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Camera size={20} />
                        Capture Waste Photo
                    </button>
                )}
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-3">
                    <MapPin className="text-green-700" size={24} />

                    <div>
                        <h2 className="font-semibold text-gray-900">
                            Report Location
                        </h2>

                        <p className="text-sm text-gray-600">
                            {latitude !== null && longitude !== null
                                ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
                                : "Waiting for location permission..."}
                        </p>
                    </div>
                </div>
            </section>

            <button
                type="button"
                onClick={submitReport}
                disabled={
                    !photo ||
                    latitude === null ||
                    longitude === null ||
                    loading
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-700 px-4 py-4 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
                <Send size={19} />
                {loading ? "Submitting Report..." : "Submit Waste Report"}
            </button>

            {message && (
                <div
                    role="status"
                    className="rounded-xl bg-gray-100 p-4 text-sm text-gray-800"
                >
                    {message}
                </div>
            )}

            <p className="text-center text-xs text-gray-500">
                Your photo and location will help identify the appropriate
                municipal authority.
            </p>
        </div>
    );
}