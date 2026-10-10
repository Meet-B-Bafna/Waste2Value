"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Chart, registerables } from "chart.js";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowRight,
    Award,
    CheckCircle2,
    Cloud,
    Edit,
    Flame,
    Leaf,
    Landmark,
    LogOut,
    MapPin,
    Recycle,
    Settings,
    ShieldCheck,
    Sparkles,
    Target,
} from "lucide-react";

import SpinLoading from "@/components/loading/SpinLoading";
import Toast from "@/utils/toast";

Chart.register(...registerables);

const DEFAULT_AVATAR =
    "https://i.pinimg.com/564x/58/79/29/5879293da8bd698f308f19b15d3aba9a.jpg";

const Page = () => {
    const [user, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [chartReady, setChartReady] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const router = useRouter();
    const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const chartInstanceRef = useRef<Chart | null>(null);

    // Fetch profile information
    useEffect(() => {
        let cancelled = false;

        const getUserData = async () => {
            try {
                const response = await fetch("/api/auth/profile", {
                    credentials: "include",
                });

                if (!response.ok) {
                    if (response.status === 401) {
                        router.replace("/login");
                        return;
                    }

                    throw new globalThis.Error("Unable to load profile");
                }

                const data = await response.json();

                if (!cancelled) {
                    setUserData(data);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error("Profile loading failed:", error);
                    Toast.ErrorShowToast("Unable to load profile data");
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        getUserData();

        return () => {
            cancelled = true;
        };
    }, [router]);

    // Logout
    const handleLogout = async () => {
        if (loggingOut) return;

        setLoggingOut(true);

        try {
            await axios.get("/api/auth/logout");

            Toast.SuccessShowToast("Logged out successfully");
            router.replace("/login");
            router.refresh();
        } catch (error) {
            console.error("Logout failed:", error);
            Toast.ErrorShowToast("Logout failed. Please try again.");
            setLoggingOut(false);
        }
    };

    // Profile data
    const wasteDumped = user?.userData?.wasteDumped ?? [];
    const totalPoints = Number(user?.userData?.totalPointsEarned ?? 0);

    const totalCO2Saved = useMemo(
        () =>
            wasteDumped.reduce(
                (total: number, waste: any) =>
                    total + Number(waste?.wastePoints ?? 0),
                0
            ),
        [wasteDumped]
    );

    const recycledCount = wasteDumped.filter(
        (waste: any) => waste?.isRecyleable
    ).length;

    const nonRecycledCount = Math.max(
        wasteDumped.length - recycledCount,
        0
    );

    const recycledPercentage =
        wasteDumped.length > 0
            ? Math.round((recycledCount / wasteDumped.length) * 100)
            : 0;

    const username =
        user?.userData?.username?.trim() || "Eco Member";

    // Recycling chart
    useEffect(() => {
        const canvas = chartCanvasRef.current;

        if (!canvas || wasteDumped.length === 0) {
            chartInstanceRef.current?.destroy();
            chartInstanceRef.current = null;
            setChartReady(false);
            return;
        }

        chartInstanceRef.current?.destroy();
        chartInstanceRef.current = null;

        chartInstanceRef.current = new Chart(canvas, {
            type: "doughnut",
            data: {
                labels: ["Recycled", "Non-Recycled"],
                datasets: [
                    {
                        data: [recycledCount, nonRecycledCount],
                        backgroundColor: ["#16a34a", "#FDBA74"],
                        hoverBackgroundColor: ["#15803d", "#FB923C"],
                        borderWidth: 0,
                        hoverOffset: 6,
                        spacing: 4,
                        borderRadius: 6,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: "72%",
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        backgroundColor: "#14532d",
                        padding: 12,
                        cornerRadius: 10,
                    },
                },
            },
        });

        setChartReady(true);

        return () => {
            chartInstanceRef.current?.destroy();
            chartInstanceRef.current = null;
        };
    }, [wasteDumped, recycledCount, nonRecycledCount]);

    // Loading screen
    if (loading) {
        return (
            <div className="flex min-h-screen w-full items-center justify-center bg-[#f5faf6]">
                <SpinLoading />
            </div>
        );
    }

    return (
        <main className="min-h-screen w-full overflow-x-hidden bg-[#f5faf6] text-slate-800">
            <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-6 px-4 pb-36 pt-5 sm:px-6 sm:pt-7 lg:px-8">

                {/* Top bar */}
                <header className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-700">
                            Waste2Value
                        </p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            Profile
                        </h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/edit-profile"
                            aria-label="Profile settings"
                            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:text-green-700"
                        >
                            <Settings size={19} />
                        </Link>

                        <button
                            type="button"
                            onClick={handleLogout}
                            disabled={loggingOut}
                            aria-label="Log out"
                            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-100 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <LogOut size={19} />
                        </button>
                    </div>
                </header>

                {/* Profile hero */}
                <section className="relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br from-green-600 via-green-600 to-teal-600 px-5 py-8 text-center text-white shadow-[0_16px_40px_rgba(22,163,74,0.18)] sm:py-10">
                    <div className="pointer-events-none absolute -right-12 -top-16 -z-10 h-52 w-52 rounded-full bg-white/[0.09]" />
                    <div className="pointer-events-none absolute -bottom-24 -left-10 -z-10 h-56 w-56 rounded-full bg-teal-200/[0.12]" />
                    <div className="pointer-events-none absolute right-[18%] top-10 -z-10 h-12 w-12 rounded-full border border-white/15" />

                    <div className="relative mx-auto flex max-w-md flex-col items-center">
                        <div className="relative">
                            <img
                                src={
                                    user?.userData?.profilePicture ||
                                    DEFAULT_AVATAR
                                }
                                alt={`${username}'s profile`}
                                className="h-24 w-24 rounded-full border-4 border-white/90 object-cover shadow-xl sm:h-28 sm:w-28"
                            />

                            <Link
                                href="/edit-profile"
                                aria-label="Edit profile picture"
                                className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-green-600 bg-white text-green-700 shadow-md transition hover:scale-105"
                            >
                                <Edit size={15} />
                            </Link>
                        </div>

                        <h2 className="mt-4 text-2xl font-extrabold capitalize tracking-tight sm:text-3xl">
                            {username}
                        </h2>

                        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-sm font-medium text-white/95 backdrop-blur-sm">
                            <MapPin size={15} />
                            <span>
                                {[
                                    user?.userData?.city || "Pune",
                                    user?.userData?.state || "Maharashtra",
                                ].join(", ")}
                            </span>
                        </div>

                        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-green-800 shadow-sm">
                            <ShieldCheck size={17} />
                            Eco Warrior
                        </div>

                        <p className="mt-4 max-w-xs text-sm leading-6 text-white/85">
                            Every small action makes a greener tomorrow.
                            Keep building your impact.
                        </p>
                    </div>
                </section>

                {/* Stats */}
                <section className="grid grid-cols-3 gap-3 sm:gap-4">
                    <StatCard
                        icon={<Landmark size={20} />}
                        value={totalPoints.toLocaleString("en-IN")}
                        label="Points"
                        iconBg="bg-amber-100"
                        iconColor="text-amber-700"
                    />

                    <StatCard
                        icon={<Cloud size={20} />}
                        value={`${totalCO2Saved.toLocaleString("en-IN")}g`}
                        label="CO₂ Saved"
                        iconBg="bg-blue-100"
                        iconColor="text-blue-700"
                    />

                    <StatCard
                        icon={<Recycle size={20} />}
                        value={recycledCount.toLocaleString("en-IN")}
                        label="Recycled"
                        iconBg="bg-emerald-100"
                        iconColor="text-emerald-700"
                    />
                </section>

                {/* Recycling overview */}
                <section className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.04)] sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                                Recycling overview
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                A look at your waste scans
                            </p>
                        </div>

                        <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
                            {wasteDumped.length}{" "}
                            {wasteDumped.length === 1 ? "scan" : "scans"}
                        </span>
                    </div>

                    {wasteDumped.length === 0 ? (
                        <div className="flex flex-col items-center py-8 text-center sm:py-10">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                                <Recycle size={30} />
                            </div>

                            <h3 className="mt-4 text-base font-bold text-slate-800">
                                No scans yet
                            </h3>

                            <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                                Scan your first item to see your impact!
                            </p>

                            <Link
                                href="/scan-waste"
                                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-green-600/15 transition hover:bg-green-700"
                            >
                                <Recycle size={17} />
                                Scan Waste
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    ) : (
                        <div className="mt-6 grid grid-cols-1 items-center gap-6 sm:grid-cols-2 sm:gap-8">
                            <div className="relative mx-auto w-full max-w-[230px]">
                                <canvas ref={chartCanvasRef} />

                                {chartReady && (
                                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-extrabold text-slate-900">
                                            {recycledPercentage}%
                                        </span>
                                        <span className="mt-1 text-xs font-medium text-slate-500">
                                            Recycled
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-4">
                                <LegendRow
                                    color="bg-green-600"
                                    label="Recycled"
                                    count={recycledCount}
                                    total={wasteDumped.length}
                                />

                                <LegendRow
                                    color="bg-orange-300"
                                    label="Non-Recycled"
                                    count={nonRecycledCount}
                                    total={wasteDumped.length}
                                />

                                <div className="rounded-2xl bg-green-50 p-4">
                                    <div className="flex items-center gap-2 text-green-800">
                                        <Leaf size={18} />
                                        <span className="text-sm font-bold">
                                            Keep it up!
                                        </span>
                                    </div>

                                    <p className="mt-1 text-sm leading-5 text-green-700">
                                        {recycledPercentage === 100
                                            ? "All your recorded scans are recyclable. Excellent work!"
                                            : "Keep sorting waste correctly to improve your recycling impact."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </section>

                {/* Reward progress */}
                <section className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.04)] sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                                <Target size={22} />
                            </div>

                            <div>
                                <h2 className="font-bold text-slate-900">
                                    Next reward
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    You&apos;re on your way!
                                </p>
                            </div>
                        </div>

                        <span className="whitespace-nowrap text-sm font-bold text-green-700">
                            {Math.min(Math.max(totalPoints, 0), 100)} / 100 points
                        </span>
                    </div>

                    <div
                        className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100"
                        role="progressbar"
                        aria-label="Progress toward next reward"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.min(Math.max(totalPoints, 0), 100)}
                    >
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-green-500 to-teal-500 transition-all duration-700"
                            style={{
                                width: `${Math.min(
                                    Math.max(totalPoints, 0),
                                    100
                                )}%`,
                            }}
                        />
                    </div>

                    <p className="mt-3 text-xs text-slate-500">
                        {totalPoints >= 100
                            ? "You've reached the points target. Keep earning!"
                            : `${Math.max(100 - totalPoints, 0)} more points to reach your next reward.`}
                    </p>
                </section>

                {/* Recent activity */}
                <section className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.04)] sm:p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Recent activity
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Your latest waste scans
                            </p>
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-700">
                            <Flame size={20} />
                        </div>
                    </div>

                    {wasteDumped.length === 0 ? (
                        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
                                <Recycle size={19} />
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-slate-700">
                                    Nothing here yet
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    Your activity will appear after your first scan.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-4 divide-y divide-slate-100">
                            {[...wasteDumped]
                                .slice(-4)
                                .reverse()
                                .map((waste: any, index: number) => (
                                    <div
                                        key={
                                            waste?._id ||
                                            waste?.id ||
                                            `activity-${index}`
                                        }
                                        className="flex items-center gap-3 py-4 first:pt-1 last:pb-1"
                                    >
                                        <div
                                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                                                waste?.isRecyleable
                                                    ? "bg-green-50 text-green-700"
                                                    : "bg-orange-50 text-orange-600"
                                            }`}
                                        >
                                            {waste?.isRecyleable ? (
                                                <CheckCircle2 size={21} />
                                            ) : (
                                                <Recycle size={21} />
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-bold text-slate-800">
                                                {waste?.wasteType ||
                                                    waste?.category ||
                                                    waste?.name ||
                                                    "Waste scan"}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                                {waste?.isRecyleable
                                                    ? "Recyclable item"
                                                    : "Non-recyclable item"}
                                            </p>
                                        </div>

                                        <span
                                            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                                waste?.isRecyleable
                                                    ? "bg-green-50 text-green-700"
                                                    : "bg-orange-50 text-orange-700"
                                            }`}
                                        >
                                            {waste?.isRecyleable
                                                ? "Recycled"
                                                : "Non-Recycled"}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    )}
                </section>

                {/* Achievements */}
                <section className="rounded-[24px] border border-slate-100 bg-white p-5 shadow-[0_6px_24px_rgba(15,23,42,0.04)] sm:p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Achievements
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Celebrate your green journey
                            </p>
                        </div>

                        <Award className="text-amber-500" size={23} />
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-3">
                        <Achievement
                            icon={<Leaf size={22} />}
                            label="Eco Starter"
                            active={wasteDumped.length >= 1}
                            color="bg-green-100 text-green-700"
                        />

                        <Achievement
                            icon={<Recycle size={22} />}
                            label="Recycler"
                            active={recycledCount >= 5}
                            color="bg-blue-100 text-blue-700"
                        />

                        <Achievement
                            icon={<Sparkles size={22} />}
                            label="Eco Champion"
                            active={totalPoints >= 100}
                            color="bg-amber-100 text-amber-700"
                        />
                    </div>
                </section>

                {/* Bottom logout button */}
                <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-white px-5 py-4 font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <LogOut size={19} />
                    {loggingOut ? "Logging out..." : "Log out of your account"}
                </button>

                <p className="pb-2 text-center text-xs text-slate-400">
                    Making every item count for a greener future.
                </p>
            </div>
        </main>
    );
};

// Statistics card
function StatCard({
    icon,
    value,
    label,
    iconBg,
    iconColor,
}: {
    icon: React.ReactNode;
    value: string;
    label: string;
    iconBg: string;
    iconColor: string;
}) {
    return (
        <div className="min-w-0 rounded-[20px] border border-slate-100 bg-white p-3 shadow-[0_5px_20px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-1 hover:shadow-md sm:p-5">
            <div
                className={`mx-auto flex h-10 w-10 items-center justify-center rounded-2xl sm:mx-0 sm:h-11 sm:w-11 ${iconBg} ${iconColor}`}
            >
                {icon}
            </div>

            <p className="mt-3 break-words text-center text-lg font-extrabold tracking-tight text-slate-900 sm:text-left sm:text-2xl">
                {value}
            </p>

            <p className="mt-1 text-center text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500 sm:text-left sm:text-[11px] sm:tracking-[0.12em]">
                {label}
            </p>
        </div>
    );
}

// Chart legend row
function LegendRow({
    color,
    label,
    count,
    total,
}: {
    color: string;
    label: string;
    count: number;
    total: number;
}) {
    const percentage =
        total > 0 ? Math.round((count / total) * 100) : 0;

    return (
        <div className="flex items-center gap-3">
            <span className={`h-3 w-3 shrink-0 rounded-full ${color}`} />

            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-700">
                    {label}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                    {count} {count === 1 ? "item" : "items"}
                </p>
            </div>

            <span className="text-sm font-bold text-slate-800">
                {percentage}%
            </span>
        </div>
    );
}

// Achievement badge
function Achievement({
    icon,
    label,
    active,
    color,
}: {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    color: string;
}) {
    return (
        <div
            className={`flex min-w-0 flex-col items-center rounded-2xl p-3 text-center ${
                active ? "bg-slate-50" : "bg-slate-50/60 opacity-50"
            }`}
        >
            <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    active ? color : "bg-slate-200 text-slate-500"
                }`}
            >
                {icon}
            </div>

            <p className="mt-2 text-xs font-bold text-slate-700">
                {label}
            </p>

            <p className="mt-1 text-[10px] font-medium text-slate-500">
                {active ? "Unlocked" : "Locked"}
            </p>
        </div>
    );
}

export default Page;