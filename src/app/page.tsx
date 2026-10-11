"use client";

import React, { useEffect, useState } from "react";
import {
    ArrowRight,
    ArrowUpRight,
    Bell,
    CircleCheck,
    CircleX,
    Cloud,
    History,
    Landmark,
    Leaf,
    Lightbulb,
    MapPin,
    Recycle,
    ScanLine,
    Sprout,
    Trash2,
    X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import metal from "@/assets/aluminium.jpg";
import bottle from "@/assets/bottle.jpg";
import glass from "@/assets/glass.jpg";
import paper from "@/assets/paper.jpg";
import SpinLoading from "@/components/loading/SpinLoading";

export interface ApiResponse {
    message: string;
    userData: UserData;
}

export interface UserData {
    city: string;
    email: string;
    isVerified: boolean;
    isWorker: boolean;
    phoneNumber: string;
    profilePicture: string;
    state: string;
    totalPointsEarned: number;
    userDescription: string;
    username: string;
    wasteDumped: any[];
}

interface MaterialData {
    [key: string]: {
        merits: string;
        demerits: string;
    };
}

const materialData: MaterialData = {
    Plastic: {
        merits: "Plastic is versatile and lightweight.",
        demerits: "Plastic is non-biodegradable and contributes to pollution.",
    },
    Glass: {
        merits: "Glass is recyclable and does not degrade over time.",
        demerits: "Glass production requires a lot of energy.",
    },
    Paper: {
        merits: "Paper is biodegradable and recyclable.",
        demerits: "Paper production can lead to deforestation.",
    },
    Metal: {
        merits: "Metal is durable and can be recycled repeatedly.",
        demerits: "Metal extraction and processing can be energy-intensive.",
    },
};

const materials = [
    {
        name: "Plastic",
        image: bottle,
        subtitle: "Bottles, containers & more",
        count: "12 items accepted",
        card: "bg-gradient-to-b from-emerald-100/80 to-white",
        glow: "bg-emerald-300/50",
        chip: "bg-emerald-600/10 text-emerald-800",
    },
    {
        name: "Glass",
        image: glass,
        subtitle: "Bottles & glass jars",
        count: "8 items accepted",
        card: "bg-gradient-to-b from-sky-100/80 to-white",
        glow: "bg-sky-300/50",
        chip: "bg-sky-600/10 text-sky-800",
    },
    {
        name: "Paper",
        image: paper,
        subtitle: "Newspapers & cardboard",
        count: "10 items accepted",
        card: "bg-gradient-to-b from-amber-100/80 to-white",
        glow: "bg-amber-300/50",
        chip: "bg-amber-600/10 text-amber-800",
    },
    {
        name: "Metal",
        image: metal,
        subtitle: "Cans & metal containers",
        count: "6 items accepted",
        card: "bg-gradient-to-b from-violet-100/80 to-white",
        glow: "bg-violet-300/50",
        chip: "bg-violet-600/10 text-violet-800",
    },
];

const glassCard =
    "rounded-[28px] border border-white/70 bg-white/70 shadow-[0_8px_30px_rgba(20,83,45,0.07)] backdrop-blur-xl";

const Page = () => {
    const [user, setUserData] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [openNotification, setOpenNotification] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
    const [openModal, setOpenModal] = useState(false);

    useEffect(() => {
        const getUserData = async () => {
            try {
                const response = await fetch("/api/auth/profile");

                if (!response.ok) {
                    throw new Error("Unable to load profile");
                }

                const data = await response.json();
                setUserData(data);
            } catch (error) {
                console.error("Profile loading error:", error);
                setUserData(null);
            } finally {
                setLoading(false);
            }
        };

        getUserData();
    }, []);

    const handleMaterialClick = (material: string) => {
        setSelectedMaterial(material);
        setOpenModal(true);
    };

    const calculateTotalCO2Saved = () => {
        if (!user?.userData?.wasteDumped) return 0;

        return user.userData.wasteDumped.reduce(
            (total, waste) => total + (Number(waste?.wastePoints) || 0),
            0
        );
    };

    if (loading) {
        return (
            <main className="flex min-h-[80vh] w-full items-center justify-center bg-[#eefaf2]">
                <SpinLoading />
            </main>
        );
    }

    if (!user?.userData) {
        return (
            <main className="flex min-h-[80vh] w-full items-center justify-center bg-[#eefaf2] px-6">
                <div className={`${glassCard} max-w-sm p-8 text-center`}>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
                        <Leaf size={30} />
                    </div>
                    <h1 className="text-xl font-bold text-green-950">
                        Welcome to Waste-ease
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">
                        We couldn&apos;t load your profile. Please sign in and try again.
                    </p>
                    <Link
                        href="/login"
                        className="mt-6 inline-flex rounded-2xl bg-green-700 px-7 py-3 font-semibold text-white shadow-lg shadow-green-700/25 transition hover:bg-green-800"
                    >
                        Sign in
                    </Link>
                </div>
            </main>
        );
    }

    const userData = user.userData;
    const firstName = userData.username?.trim().split(/\s+/)[0] || "there";

    return (
        <main className="relative isolate min-h-screen w-full overflow-x-hidden bg-[#eefaf2] text-[#14532d]">
            {/* Ambient background */}
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-emerald-300/40 blur-3xl" />
                <div className="absolute -right-24 top-64 h-72 w-72 rounded-full bg-teal-200/50 blur-3xl" />
                <div className="absolute -left-20 top-[900px] h-72 w-72 rounded-full bg-lime-200/40 blur-3xl" />
            </div>

            <div className="mx-auto flex w-full max-w-[690px] flex-col gap-7 px-4 pb-36 pt-6 sm:px-5">

                {/* Header */}
                <header className="flex items-center justify-between gap-3">
                    <Link href="/profile" className="flex min-w-0 items-center gap-3">
                        <div className="relative shrink-0">
                            <div className="h-14 w-14 overflow-hidden rounded-[20px] border-2 border-white bg-green-100 shadow-md shadow-green-900/10 ring-2 ring-emerald-400/60">
                                <img
                                    src={
                                        userData.profilePicture ||
                                        "https://i.pinimg.com/564x/58/79/29/5879293da8bd698f308f19b15d3aba9a.jpg"
                                    }
                                    alt="Profile"
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
                        </div>

                        <div className="min-w-0">
                            <p className="text-sm font-medium text-green-900/60">
                                Welcome back,
                            </p>
                            <h1 className="truncate text-[22px] font-extrabold capitalize leading-tight tracking-tight text-green-950">
                                Hi, {firstName}
                            </h1>
                            <p className="mt-0.5 truncate text-xs text-green-900/60">
                                Let&apos;s make Pune greener today
                            </p>
                        </div>
                    </Link>

                    <div className="flex shrink-0 items-center gap-2">
                        <Link
                            href="/history"
                            aria-label="History"
                            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white/70 text-green-800 shadow-sm backdrop-blur transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500"
                        >
                            <History size={20} />
                        </Link>

                        <button
                            type="button"
                            aria-label="Notifications"
                            onClick={() => setOpenNotification(!openNotification)}
                            className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white/70 text-green-800 shadow-sm backdrop-blur transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500"
                        >
                            <Bell size={20} />
                            <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-orange-500 ring-2 ring-white" />
                        </button>
                    </div>
                </header>

                {/* Location chip */}
                <div className="-mt-3 flex items-center gap-2 self-start rounded-full border border-white/80 bg-white/70 py-1.5 pl-1.5 pr-4 text-xs font-medium text-green-900/80 shadow-sm backdrop-blur">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <MapPin size={14} />
                    </span>
                    <span className="max-w-[280px] truncate">
                        {userData.city || "Your city"}, {userData.state || "India"}
                    </span>
                </div>

                {/* Notification panel */}
                {openNotification && (
                    <div className={`${glassCard} p-4`}>
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-green-950">Notifications</h2>
                            <button
                                type="button"
                                aria-label="Close notifications"
                                onClick={() => setOpenNotification(false)}
                                className="rounded-xl p-1.5 text-gray-500 transition hover:bg-gray-100"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                            You&apos;re all caught up. Keep recycling to make a difference.
                        </p>
                    </div>
                )}

                {/* Hero */}
                <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0f5132] via-[#116b3f] to-[#0d7a6b] p-7 text-white shadow-[0_24px_50px_-12px_rgba(15,81,50,0.55)]">
                    {/* decorative rings */}
                    <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border border-white/10" />
                    <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full border border-white/10" />
                    <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-emerald-300/10 blur-2xl" />
                    <div className="pointer-events-none absolute -right-10 bottom-0 h-44 w-44 rounded-full bg-teal-300/20 blur-3xl" />

                    <Recycle
                        size={150}
                        strokeWidth={0.9}
                        className="pointer-events-none absolute -bottom-6 -right-6 rotate-[-15deg] text-white/10"
                    />

                    <div className="relative z-10">
                        <div className="flex items-center justify-between">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
                                <Sprout size={25} />
                            </div>

                            <div className="flex items-center gap-2 rounded-full bg-white/15 py-1.5 pl-2 pr-3.5 text-xs font-semibold ring-1 ring-white/25 backdrop-blur">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-300 text-amber-900">
                                    <Landmark size={13} />
                                </span>
                                {userData.totalPointsEarned ?? 0} pts
                            </div>
                        </div>

                        <p className="mt-7 text-sm font-medium text-emerald-100/90">
                            Small actions. Big impact.
                        </p>

                        <h2 className="mt-2 max-w-[340px] text-[40px] font-extrabold leading-[1.05] tracking-tight">
                            Turn waste
                            <br />
                            into rewards.
                        </h2>

                        <p className="mt-4 max-w-[300px] text-[15px] leading-6 text-white/80">
                            Scan your recyclables, build greener habits, and earn points along the way.
                        </p>

                        <Link
                            href="/scan-waste"
                            className="group mt-7 inline-flex items-center gap-3 rounded-full bg-white py-2 pl-6 pr-2 text-sm font-bold text-green-900 shadow-xl shadow-black/20 transition hover:bg-emerald-50 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        >
                            Scan Waste
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-700 text-white transition group-hover:translate-x-0.5">
                                <ScanLine size={19} />
                            </span>
                        </Link>
                    </div>
                </section>

                {/* Impact statistics */}
                <section>
                    <div className="mb-3 px-1">
                        <p className="text-sm font-semibold text-emerald-700">
                            Your progress
                        </p>
                        <h2 className="text-[22px] font-extrabold tracking-tight text-green-950">
                            Your green impact
                        </h2>
                    </div>

                    <div className={`${glassCard} grid grid-cols-3 divide-x divide-green-900/10 p-2`}>
                        <div className="flex min-w-0 flex-col items-center px-2 py-4 text-center">
                            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-200 to-amber-300 text-amber-800 shadow-sm">
                                <Landmark size={20} />
                            </div>
                            <p className="max-w-full truncate text-2xl font-extrabold tracking-tight text-green-950">
                                {userData.totalPointsEarned ?? 0}
                            </p>
                            <p className="mt-0.5 text-xs font-medium text-green-900/60">
                                Points
                            </p>
                        </div>

                        <div className="flex min-w-0 flex-col items-center px-2 py-4 text-center">
                            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-200 to-sky-300 text-sky-800 shadow-sm">
                                <Cloud size={20} />
                            </div>
                            <p className="max-w-full truncate text-2xl font-extrabold tracking-tight text-green-950">
                                {calculateTotalCO2Saved()}g
                            </p>
                            <p className="mt-0.5 text-xs font-medium text-green-900/60">
                                CO₂ Saved
                            </p>
                        </div>

                        <div className="flex min-w-0 flex-col items-center px-2 py-4 text-center">
                            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-200 to-emerald-300 text-emerald-800 shadow-sm">
                                <Recycle size={20} />
                            </div>
                            <p className="max-w-full truncate text-2xl font-extrabold tracking-tight text-green-950">
                                {userData.wasteDumped?.length ?? 0}
                            </p>
                            <p className="mt-0.5 text-xs font-medium text-green-900/60">
                                Recycled
                            </p>
                        </div>
                    </div>
                </section>

                {/* Materials */}
                <section>
                    <div className="mb-4 flex items-end justify-between gap-2 px-1">
                        <div>
                            <p className="text-sm font-semibold text-emerald-700">
                                Recycle right
                            </p>
                            <h2 className="text-[22px] font-extrabold tracking-tight text-green-950">
                                Explore materials
                            </h2>
                        </div>
                        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-medium text-green-900/70 ring-1 ring-white">
                            4 categories
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                        {materials.map((material) => (
                            <button
                                key={material.name}
                                type="button"
                                onClick={() => handleMaterialClick(material.name)}
                                className={`group relative flex min-w-0 flex-col overflow-hidden rounded-[28px] border border-white ${material.card} p-3.5 text-left shadow-[0_8px_24px_rgba(20,83,45,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(20,83,45,0.14)] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500`}
                            >
                                <div className="relative flex h-[120px] w-full items-center justify-center">
                                    <div
                                        className={`absolute h-24 w-24 rounded-full blur-2xl ${material.glow}`}
                                    />
                                    <Image
                                        src={material.image}
                                        alt={material.name}
                                        width={200}
                                        height={200}
                                        className="relative h-[104px] w-[104px] object-contain drop-shadow-xl transition duration-300 group-hover:scale-110 group-hover:-rotate-3"
                                    />
                                    <span className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-green-800 shadow-sm transition group-hover:bg-green-700 group-hover:text-white">
                                        <ArrowUpRight size={16} />
                                    </span>
                                </div>

                                <h3 className="mt-3 text-lg font-extrabold tracking-tight text-green-950">
                                    {material.name}
                                </h3>

                                <p className="mt-0.5 text-xs leading-5 text-green-900/60">
                                    {material.subtitle}
                                </p>

                                <span
                                    className={`mt-3 self-start rounded-full px-2.5 py-1 text-[11px] font-semibold ${material.chip}`}
                                >
                                    {material.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* How it works */}
                <section className={`${glassCard} p-5`}>
                    <h2 className="text-lg font-extrabold text-green-950">
                        How it works
                    </h2>
                    <p className="mt-1 text-sm text-green-900/60">
                        Three simple steps to make a difference.
                    </p>

                    <div className="relative mt-6 grid grid-cols-3 gap-2">
                        {/* connector line */}
                        <div className="pointer-events-none absolute left-[16%] right-[16%] top-7 border-t-2 border-dashed border-emerald-300" />

                        <div className="relative flex flex-col items-center text-center">
                            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 text-white shadow-lg shadow-emerald-500/30">
                                <ScanLine size={24} />
                                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-green-800 shadow">
                                    1
                                </span>
                            </div>
                            <span className="mt-3 text-sm font-bold text-green-950">
                                Scan
                            </span>
                            <span className="mt-0.5 text-[11px] text-green-900/60">
                                Identify waste
                            </span>
                        </div>

                        <div className="relative flex flex-col items-center text-center">
                            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-400 text-white shadow-lg shadow-amber-500/30">
                                <Trash2 size={24} />
                                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-amber-800 shadow">
                                    2
                                </span>
                            </div>
                            <span className="mt-3 text-sm font-bold text-green-950">
                                Sort
                            </span>
                            <span className="mt-0.5 text-[11px] text-green-900/60">
                                Dispose correctly
                            </span>
                        </div>

                        <div className="relative flex flex-col items-center text-center">
                            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 text-white shadow-lg shadow-sky-500/30">
                                <Landmark size={24} />
                                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-sky-800 shadow">
                                    3
                                </span>
                            </div>
                            <span className="mt-3 text-sm font-bold text-green-950">
                                Earn
                            </span>
                            <span className="mt-0.5 text-[11px] text-green-900/60">
                                Collect points
                            </span>
                        </div>
                    </div>
                </section>

                {/* Nearby bin stations */}
                <Link
                    href="/location"
                    className="group relative flex items-center gap-4 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#14532d] to-[#0f766e] p-5 text-white shadow-[0_18px_40px_-12px_rgba(15,81,50,0.5)] transition hover:-translate-y-0.5 active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                >
                    <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full border border-white/10" />
                    <div className="pointer-events-none absolute -right-2 -top-2 h-20 w-20 rounded-full border border-white/10" />

                    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
                        <MapPin size={27} />
                    </div>

                    <div className="relative min-w-0 flex-1">
                        <p className="text-xs font-medium text-emerald-100/80">
                            Find a station
                        </p>
                        <h2 className="mt-0.5 text-lg font-extrabold tracking-tight">
                            Nearby Bin Stations
                        </h2>
                        <p className="mt-1 text-xs leading-5 text-white/75">
                            Find a suitable place to dispose of your waste.
                        </p>
                    </div>

                    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-green-800 transition group-hover:translate-x-1">
                        <ArrowRight size={20} />
                    </span>
                </Link>

                {/* Eco tip */}
                <section className="relative overflow-hidden rounded-[28px] border border-white bg-gradient-to-br from-lime-100 via-emerald-100 to-teal-100 p-5 shadow-[0_8px_24px_rgba(20,83,45,0.07)]">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-500 shadow-md">
                            <Lightbulb size={24} />
                        </div>

                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-emerald-800">
                                Eco tip of the day
                            </p>
                            <h2 className="mt-1 text-base font-extrabold text-green-950">
                                Keep recyclables clean and dry
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-green-900/70">
                                Empty bottles and containers, rinse off residue, and let them dry before recycling.
                            </p>
                        </div>
                    </div>
                    <Leaf
                        size={90}
                        className="pointer-events-none absolute -bottom-6 -right-4 rotate-[-20deg] text-green-700/10"
                    />
                </section>

                {/* About Waste2Value */}
                <section id="about" className={`${glassCard} p-6`}>
                    <p className="text-sm font-semibold text-emerald-700">
                        About Our Project
                    </p>

                    <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-green-950">
                        Meet Waste2Value
                    </h2>

                    <p className="mt-3 text-sm leading-7 text-green-900/70">
                        Waste2Value is an AI-powered waste detection and
                        sustainable waste management project developed to
                        support waste identification, segregation, and
                        responsible disposal. By combining computer vision
                        with a digital waste management platform, our goal
                        is to encourage environmentally responsible habits.
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-3xl bg-gradient-to-br from-green-100 to-emerald-50 p-4 ring-1 ring-white">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-green-700 shadow-sm">
                                <ScanLine size={21} />
                            </div>
                            <h3 className="mt-3 font-bold text-green-950">
                                Smart Detection
                            </h3>
                            <p className="mt-1 text-xs leading-5 text-green-900/65">
                                Identify waste items using computer vision.
                            </p>
                        </div>

                        <div className="rounded-3xl bg-gradient-to-br from-teal-100 to-emerald-50 p-4 ring-1 ring-white">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm">
                                <Recycle size={21} />
                            </div>
                            <h3 className="mt-3 font-bold text-green-950">
                                Responsible Disposal
                            </h3>
                            <p className="mt-1 text-xs leading-5 text-green-900/65">
                                Encourage appropriate waste segregation
                                and disposal.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Project Team */}
                <section id="team" className={`${glassCard} p-6`}>
                    <p className="text-sm font-semibold text-emerald-700">
                        The People Behind the Project
                    </p>

                    <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-green-950">
                        Our Team
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-green-900/65">
                        Developed as a B.Tech major project at
                        Pimpri Chinchwad University.
                    </p>

                    <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {[
                            "Meet Bafna",
                            "Affan Patan",
                            "Yogita Tikhatri",
                            "Munazza Deshmukh",
                        ].map((name, index) => (
                            <div
                                key={name}
                                className="flex items-center gap-3 rounded-2xl bg-white/80 p-3 ring-1 ring-green-900/5"
                            >
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 text-sm font-bold text-white shadow-md shadow-emerald-600/25">
                                    {name
                                        .split(" ")
                                        .map((part) => part[0])
                                        .join("")
                                        .slice(0, 2)
                                        .toUpperCase()}
                                </div>

                                <div className="min-w-0">
                                    <h3 className="truncate font-bold text-green-950">
                                        {name}
                                    </h3>
                                    <p className="text-xs text-green-900/55">
                                        Project Team Member {index + 1}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 rounded-3xl bg-gradient-to-br from-[#14532d] to-[#0f766e] p-5 text-white">
                        <p className="text-xs font-medium text-emerald-100/80">
                            Project Guide
                        </p>
                        <h3 className="mt-1 text-lg font-bold">
                            Dr. Manisha V. Khadse
                        </h3>
                        <p className="mt-1 text-sm text-white/70">
                            Pimpri Chinchwad University
                        </p>
                    </div>
                </section>

                {/* Technologies */}
                <section id="technology" className={`${glassCard} p-6`}>
                    <p className="text-sm font-semibold text-emerald-700">
                        Our Technical Foundation
                    </p>

                    <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-green-950">
                        Technologies Used
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-green-900/70">
                        Waste2Value integrates web development, computer
                        vision, and database technologies to deliver its
                        waste management features.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                        {[
                            "Python",
                            "YOLO",
                            "OpenCV",
                            "Flask",
                            "Next.js",
                            "React",
                            "TypeScript",
                            "MongoDB",
                        ].map((technology) => (
                            <span
                                key={technology}
                                className="rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-green-900 shadow-sm ring-1 ring-green-900/10 transition hover:bg-emerald-600 hover:text-white"
                            >
                                {technology}
                            </span>
                        ))}
                    </div>

                    <p className="mt-4 text-xs leading-5 text-green-900/50">
                        Technologies listed here should reflect the
                        components implemented in the current project.
                    </p>
                </section>

                {/* Research and References */}
                <section
                    id="research"
                    className="rounded-[28px] border border-white bg-gradient-to-br from-white to-emerald-50 p-6 shadow-[0_8px_30px_rgba(20,83,45,0.07)]"
                >
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 text-white shadow-lg shadow-emerald-500/25">
                            <Landmark size={23} />
                        </div>

                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-emerald-700">
                                Research & Innovation
                            </p>

                            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-green-950">
                                Research & References
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-green-900/70">
                                Our research documentation is currently
                                in preparation. Relevant research papers,
                                datasets, and technical references will
                                be added as the project progresses.
                            </p>

                            <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3.5 py-2 text-xs font-semibold text-amber-800">
                                <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75 motion-reduce:animate-none" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                                </span>
                                Research in progress
                            </span>
                        </div>
                    </div>
                </section>

                {/* Contact */}
                <section
                    id="contact"
                    className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0f5132] via-[#116b3f] to-[#0d7a6b] p-6 text-white shadow-[0_24px_50px_-12px_rgba(15,81,50,0.55)]"
                >
                    <div className="pointer-events-none absolute -right-14 -top-14 h-48 w-48 rounded-full border border-white/10" />
                    <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-emerald-300/10 blur-2xl" />

                    <div className="relative">
                        <p className="text-sm font-medium text-emerald-100/80">
                            Get in Touch
                        </p>

                        <h2 className="mt-1 text-2xl font-extrabold tracking-tight">
                            Contact Waste2Value
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-white/75">
                            Questions, suggestions, or feedback about our
                            project? Contact our project team.
                        </p>

                        <a
                            href="mailto:waste2value@gmail.com"
                            className="group mt-5 flex items-center gap-3 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                        >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                                <Bell size={20} />
                            </div>

                            <div className="min-w-0">
                                <p className="text-xs text-emerald-100/80">
                                    Project Email
                                </p>
                                <p className="break-all text-sm font-bold">
                                    waste2value@gmail.com
                                </p>
                            </div>

                            <ArrowRight
                                className="ml-auto shrink-0 transition group-hover:translate-x-1"
                                size={19}
                            />
                        </a>

                        <div className="mt-5 border-t border-white/15 pt-4">
                            <p className="text-sm font-bold">
                                Pimpri Chinchwad University
                            </p>
                            <p className="mt-1 text-xs text-white/70">
                                B.Tech Major Project · Waste2Value
                            </p>
                        </div>
                    </div>
                </section>

                {/* Project Disclaimer */}
                <section className="flex items-start gap-3 rounded-3xl border border-amber-200/70 bg-amber-50/90 p-4">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-200/70 text-amber-800">
                        <Lightbulb size={17} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-amber-900">
                            Important Note
                        </h2>
                        <p className="mt-1 text-xs leading-5 text-amber-800/90">
                            AI-based waste predictions may not always be
                            accurate. Verify the detected waste category
                            before disposal and follow local waste management
                            guidelines.
                        </p>
                    </div>
                </section>

                {/* Footer */}
                <footer className="pb-2 pt-1 text-center">
                    <div className="flex items-center justify-center gap-2 text-green-700">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-700 text-white">
                            <Leaf size={15} />
                        </span>
                        <span className="text-sm font-extrabold">
                            Waste2Value
                        </span>
                    </div>

                    <p className="mt-2 text-xs text-green-900/60">
                        Smart waste detection for a greener tomorrow.
                    </p>

                    <p className="mt-1 text-xs text-green-900/40">
                        © {new Date().getFullYear()} Waste2Value ·
                        Pimpri Chinchwad University
                    </p>
                </footer>
            </div>

            {/* Material details modal */}
            {openModal && selectedMaterial && (
                <div
                    className="fixed inset-0 z-[100] flex items-end justify-center bg-green-950/50 p-4 backdrop-blur-sm sm:items-center"
                    onClick={() => setOpenModal(false)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="material-modal-title"
                        className="w-full max-w-[440px] rounded-[32px] border border-white bg-white p-6 shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-gray-200 sm:hidden" />

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-emerald-700">
                                    Material guide
                                </p>
                                <h2
                                    id="material-modal-title"
                                    className="mt-0.5 text-3xl font-extrabold tracking-tight text-green-950"
                                >
                                    {selectedMaterial}
                                </h2>
                            </div>

                            <button
                                type="button"
                                aria-label="Close material details"
                                onClick={() => setOpenModal(false)}
                                className="rounded-2xl bg-gray-100 p-2.5 text-gray-600 transition hover:bg-gray-200"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mt-5 space-y-3">
                            <div className="flex items-start gap-3 rounded-3xl bg-gradient-to-br from-green-50 to-emerald-50 p-4 ring-1 ring-green-100">
                                <CircleCheck
                                    size={24}
                                    className="mt-0.5 shrink-0 text-green-600"
                                />
                                <div>
                                    <p className="text-sm font-bold text-green-900">
                                        Benefits
                                    </p>
                                    <p className="mt-1 text-sm leading-6 text-gray-600">
                                        {materialData[selectedMaterial].merits}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 rounded-3xl bg-gradient-to-br from-red-50 to-orange-50 p-4 ring-1 ring-red-100">
                                <CircleX
                                    size={24}
                                    className="mt-0.5 shrink-0 text-red-500"
                                />
                                <div>
                                    <p className="text-sm font-bold text-gray-900">
                                        Things to consider
                                    </p>
                                    <p className="mt-1 text-sm leading-6 text-gray-600">
                                        {materialData[selectedMaterial].demerits}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Link
                            href="/scan-waste"
                            onClick={() => setOpenModal(false)}
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-green-700 px-4 py-4 font-bold text-white shadow-lg shadow-green-700/25 transition hover:bg-green-800 active:scale-[0.98]"
                        >
                            <ScanLine size={19} />
                            Scan this material
                        </Link>
                    </div>
                </div>
            )}
        </main>
    );
};

export default Page;
