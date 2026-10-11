"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
    ArrowRight,
    CircleHelp,
    Gift,
    History,
    Leaf,
    LockKeyhole,
    Plane,
    ShoppingBag,
    Sparkles,
    Tag,
    Ticket,
    Utensils,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import banner from "@/assets/banner.jpeg";
import logo from "@/assets/logo.png";
import SpinLoading from "@/components/loading/SpinLoading";

type Coupon = {
    service?: string;
    discount?: string;
    code?: string;
    category?: string;
    [key: string]: any;
};

const FILTERS = [
    { label: "All", value: "all" },
    { label: "Food", value: "food" },
    { label: "Shopping", value: "shopping" },
    { label: "Eco", value: "eco" },
    { label: "Travel", value: "travel" },
];

const CATEGORY_STYLES: Record<
    string,
    { background: string; icon: React.ElementType; label: string }
> = {
    food: {
        background: "bg-orange-50 text-orange-600",
        icon: Utensils,
        label: "Food",
    },
    shopping: {
        background: "bg-purple-50 text-purple-600",
        icon: ShoppingBag,
        label: "Shopping",
    },
    eco: {
        background: "bg-green-50 text-green-700",
        icon: Leaf,
        label: "Eco",
    },
    travel: {
        background: "bg-blue-50 text-blue-600",
        icon: Plane,
        label: "Travel",
    },
};

const getCategory = (coupon: Coupon) => {
    const value = `${coupon.category || ""} ${coupon.service || ""}`.toLowerCase();

    if (/food|restaurant|cafe|coffee|pizza|meal|dining/.test(value)) {
        return "food";
    }

    if (/shopping|fashion|store|retail|clothing/.test(value)) {
        return "shopping";
    }

    if (/travel|hotel|flight|trip|transport/.test(value)) {
        return "travel";
    }

    if (/eco|green|recycl|sustain|environment/.test(value)) {
        return "eco";
    }

    return "shopping";
};

const Page = () => {
    const [user, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("all");

    useEffect(() => {
        const getUserData = async () => {
            try {
                const response = await fetch("/api/auth/profile");
                if (!response.ok) {
                    throw new Error("Failed to fetch profile");
                }

                const data = await response.json();
                setUserData(data);
            } catch (error) {
                console.error("Failed to load coupons:", error);
                setUserData(null);
            } finally {
                setLoading(false);
            }
        };

        getUserData();
    }, []);

    const coupons: Coupon[] = useMemo(() => {
        const list = user?.userData?.coupons;

        return Array.isArray(list) ? [...list].reverse() : [];
    }, [user]);

    const filteredCoupons = useMemo(() => {
        if (activeFilter === "all") return coupons;

        return coupons.filter(
            (coupon) => getCategory(coupon) === activeFilter
        );
    }, [coupons, activeFilter]);

    // The existing profile response does not show a points field here.
    // Use the available value if your API returns one.
    const points = Number(
        user?.userData?.totalPointsEarned ??
            user?.userData?.points ??
            0
    );

    const progress = Math.min((points / 100) * 100, 100);
    const pointsRemaining = Math.max(100 - points, 0);

    if (loading) {
        return (
            <main className="min-h-screen w-full bg-[#f5faf6] px-4 pb-32 pt-8 sm:px-6">
                <div className="mx-auto max-w-[1000px] animate-pulse">
                    <div className="mb-7 h-8 w-40 rounded-lg bg-gray-200" />
                    <div className="mb-8 h-44 rounded-3xl bg-gray-200" />

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3, 4, 5, 6].map((item) => (
                            <div
                                key={item}
                                className="h-64 rounded-3xl bg-white p-5 shadow-sm"
                            >
                                <div className="mb-5 h-24 rounded-2xl bg-gray-100" />
                                <div className="mb-3 h-5 w-2/3 rounded bg-gray-200" />
                                <div className="h-4 w-1/2 rounded bg-gray-100" />
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen w-full overflow-x-hidden bg-[#f5faf6] text-[#14532d]">
            <div className="mx-auto flex w-full max-w-[1000px] flex-col gap-7 px-4 pb-32 pt-6 sm:px-6 sm:pt-8 lg:px-8">
                {/* Header */}
                <header className="flex items-center justify-between gap-4">
                    <div>
                        <div className="mb-1 flex items-center gap-2">
                            <span className="rounded-full bg-green-100 p-2 text-green-700">
                                <Ticket size={20} />
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-green-700">
                                Rewards centre
                            </span>
                        </div>

                        <h1 className="text-3xl font-extrabold tracking-tight text-[#14532d] sm:text-4xl">
                            Coupons
                        </h1>

                        <p className="mt-1 text-sm text-gray-500 sm:text-base">
                            Redeem your points for rewards.
                        </p>
                    </div>

                    <Link
                        href="/profile"
                        aria-label="View profile and activity"
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-gray-100 bg-white text-green-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                        <History size={21} />
                    </Link>
                </header>

                {/* Points balance */}
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#16a34a] to-[#0f766e] p-6 text-white shadow-lg shadow-green-900/10 sm:p-8">
                    <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full border-[24px] border-white/10" />
                    <div className="pointer-events-none absolute -bottom-16 right-24 h-36 w-36 rounded-full bg-white/5" />

                    <div className="relative">
                        <div className="flex items-center gap-2 text-sm font-medium text-white/85">
                            <Sparkles size={17} />
                            Your rewards balance
                        </div>

                        <div className="mt-3 flex flex-wrap items-end gap-2">
                            <span className="text-5xl font-extrabold tracking-tight sm:text-6xl">
                                {points}
                            </span>
                            <span className="pb-2 text-sm font-medium text-white/80">
                                points available
                            </span>
                        </div>

                        <div className="mt-7">
                            <div className="mb-2 flex items-center justify-between gap-3 text-xs font-medium text-white/90 sm:text-sm">
                                <span>Next reward milestone</span>
                                <span>{points} / 100 points</span>
                            </div>

                            <div
                                className="h-2.5 overflow-hidden rounded-full bg-white/25"
                                role="progressbar"
                                aria-label="Progress towards 100 points"
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={Math.min(points, 100)}
                            >
                                <div
                                    className="h-full rounded-full bg-white transition-all duration-700"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            <p className="mt-3 text-xs text-white/85 sm:text-sm">
                                {pointsRemaining > 0
                                    ? `Earn ${pointsRemaining} more points to reach 100 points.`
                                    : "You've reached the 100-point milestone. Keep recycling!"}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Filters */}
                <section>
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                            Available coupons
                        </h2>
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                            {filteredCoupons.length} available
                        </span>
                    </div>

                    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
                        {FILTERS.map((filter) => {
                            const selected = activeFilter === filter.value;

                            return (
                                <button
                                    key={filter.value}
                                    type="button"
                                    onClick={() => setActiveFilter(filter.value)}
                                    className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                                        selected
                                            ? "bg-green-700 text-white shadow-md shadow-green-700/15"
                                            : "border border-gray-200 bg-white text-gray-600 hover:border-green-300 hover:text-green-800"
                                    }`}
                                >
                                    {filter.label}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Coupon grid */}
                {filteredCoupons.length > 0 ? (
                    <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredCoupons.map((coupon, index) => {
                            const category = getCategory(coupon);
                            const categoryStyle =
                                CATEGORY_STYLES[category] ??
                                CATEGORY_STYLES.shopping;
                            const CategoryIcon = categoryStyle.icon;

                            return (
                                <article
                                    key={coupon.code || `${coupon.service}-${index}`}
                                    className="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-green-900/10"
                                >
                                    {/* Coupon brand banner */}
                                    <div className="relative h-32 overflow-hidden">
                                        <Image
                                            src={banner}
                                            alt=""
                                            fill
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                            className="object-cover brightness-[0.65] transition duration-500 group-hover:scale-105"
                                        />

                                        <div className="absolute inset-0 bg-gradient-to-r from-green-950/60 to-transparent" />

                                        <div className="absolute inset-0 flex items-center justify-between p-5">
                                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/50 bg-white shadow-md">
                                                <Image
                                                    src={logo}
                                                    width={42}
                                                    height={42}
                                                    alt="Coupon brand"
                                                    className="h-10 w-10 object-contain"
                                                />
                                            </div>

                                            <span className="rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-xs font-semibold capitalize text-white backdrop-blur-sm">
                                                {categoryStyle.label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Coupon details */}
                                    <div className="relative px-5 pb-5 pt-6">
                                        {/* Ticket notches and divider */}
                                        <div className="absolute -top-3 left-0 right-0 flex items-center">
                                            <span className="-ml-3 h-6 w-6 rounded-full bg-[#f5faf6]" />
                                            <div className="mx-1 flex-1 border-t-2 border-dashed border-gray-200" />
                                            <span className="-mr-3 h-6 w-6 rounded-full bg-[#f5faf6]" />
                                        </div>

                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h3 className="break-words text-lg font-bold capitalize text-gray-900">
                                                    {coupon.service || "Special reward"}
                                                </h3>

                                                <p className="mt-1 text-sm leading-5 text-gray-500">
                                                    {coupon.discount ||
                                                        "A special offer just for you."}
                                                </p>
                                            </div>

                                            <span
                                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${categoryStyle.background}`}
                                            >
                                                <CategoryIcon size={19} />
                                            </span>
                                        </div>

                                        <div className="mt-5 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-3">
                                            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
                                                <Tag size={12} />
                                                Coupon code
                                            </div>

                                            <p className="break-all font-mono text-sm font-bold tracking-wide text-gray-700">
                                                {coupon.code || "Code unavailable"}
                                            </p>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-1.5 text-sm font-semibold text-green-700">
                                                <Gift size={17} />
                                                Reward coupon
                                            </div>

                                            <span className="flex items-center gap-1 text-xs text-gray-400">
                                                <CircleHelp size={14} />
                                                Check offer terms
                                            </span>
                                        </div>

                                        <button
                                            type="button"
                                            disabled
                                            title="Coupon redemption is not implemented in the current page."
                                            className="mt-4 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-500"
                                        >
                                            <LockKeyhole size={16} />
                                            View redemption details
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </section>
                ) : (
                    <section className="rounded-3xl border border-green-100 bg-white px-5 py-12 text-center shadow-sm sm:px-10 sm:py-16">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#dcfce7] text-green-700">
                            <Ticket size={34} strokeWidth={1.7} />
                        </div>

                        <h3 className="mt-5 text-2xl font-extrabold text-gray-900">
                            {coupons.length === 0
                                ? "No coupons yet"
                                : "No coupons in this category"}
                        </h3>

                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500 sm:text-base">
                            {coupons.length === 0
                                ? "Your rewards will appear here when coupons are added to your account. Keep recycling to make every action count."
                                : "Try another category to see your available rewards."}
                        </p>

                        {coupons.length === 0 ? (
                            <Link
                                href="/scan-waste"
                                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-green-700/15 transition hover:-translate-y-0.5 hover:bg-green-800"
                            >
                                <Leaf size={18} />
                                Scan Waste
                                <ArrowRight size={17} />
                            </Link>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setActiveFilter("all")}
                                className="mt-6 rounded-xl bg-green-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-green-800"
                            >
                                Show all coupons
                            </button>
                        )}
                    </section>
                )}

                {/* Footer note */}
                <div className="flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50 p-4">
                    <Sparkles
                        size={20}
                        className="mt-0.5 shrink-0 text-green-700"
                    />
                    <p className="text-sm leading-6 text-green-900/75">
                        <span className="font-bold text-green-900">
                            Small actions, meaningful impact.
                        </span>{" "}
                        Keep sorting your waste and exploring rewards as your
                        points grow.
                    </p>
                </div>
            </div>
        </main>
    );
};

export default Page;