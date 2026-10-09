"use client";

import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Eye,
    EyeOff,
    Leaf,
    Recycle,
    ShieldCheck,
    ArrowRight,
    Mail,
    LockKeyhole,
} from "lucide-react";
import { ClockLoader } from "react-spinners";

import { Error } from "@/types/ErrorTypes";
import Toast from "@/utils/toast";

const Page = () => {
    const router = useRouter();

    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (loading) return;

        try {
            setLoading(true);

            const response = await axios.post("/api/auth/login", {
                email,
                password,
            });

            Toast.SuccessshowToast(
                response?.data?.message ||
                    "Login successful"
            );

            router.push("/");
            router.refresh();
        } catch (error: unknown) {
            const apiError = error as Error;

            Toast.ErrorShowToast(
                apiError?.response?.data?.error ||
                    "Unable to log in. Please check your credentials."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#f5faf6] px-4 py-8 text-[#14532d] sm:px-6">
            <div className="grid w-full max-w-[1000px] overflow-hidden rounded-[28px] border border-green-100 bg-white shadow-xl shadow-green-950/5 md:grid-cols-2">
                {/* Left decorative panel */}
                <section className="relative hidden min-h-[620px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#16a34a] via-[#15803d] to-[#0f766e] p-10 text-white md:flex lg:p-12">
                    <div className="absolute -right-20 -top-16 h-72 w-72 rounded-full border-[40px] border-white/10" />
                    <div className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-white/5" />
                    <div className="absolute right-16 top-1/2 h-24 w-24 rounded-full bg-white/5" />

                    <div className="relative z-10 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                            <Recycle size={28} />
                        </div>

                        <div>
                            <h2 className="text-xl font-extrabold tracking-tight">
                                Waste2Value
                            </h2>
                            <p className="text-xs text-white/75">
                                Waste less. Value more.
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 py-10">
                        <div className="mb-7 flex h-24 w-24 items-center justify-center rounded-[30px] border border-white/20 bg-white/10 shadow-xl backdrop-blur-sm">
                            <Leaf size={52} strokeWidth={1.5} />
                        </div>

                        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-green-100">
                            Welcome to a greener future
                        </p>

                        <h1 className="max-w-sm text-4xl font-extrabold leading-tight lg:text-5xl">
                            Every small action makes a difference.
                        </h1>

                        <p className="mt-5 max-w-sm text-base leading-7 text-white/80">
                            Track your recycling impact, discover nearby
                            bin stations, and turn responsible waste
                            management into rewarding habits.
                        </p>

                        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                            <ShieldCheck
                                size={25}
                                className="shrink-0 text-green-100"
                            />
                            <div>
                                <p className="text-sm font-bold">
                                    Your sustainability journey
                                </p>
                                <p className="mt-1 text-xs text-white/75">
                                    Sign in to continue where you left off.
                                </p>
                            </div>
                        </div>
                    </div>

                    <p className="relative z-10 text-xs text-white/60">
                        Building a cleaner tomorrow, together.
                    </p>
                </section>

                {/* Login form */}
                <section className="flex flex-col justify-center px-5 py-10 sm:px-10 md:px-8 lg:px-12">
                    {/* Mobile brand */}
                    <div className="mb-9 flex items-center gap-3 md:hidden">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-600 to-teal-700 text-white shadow-lg shadow-green-700/20">
                            <Recycle size={27} />
                        </div>

                        <div>
                            <h2 className="text-xl font-extrabold text-[#14532d]">
                                Waste2Value
                            </h2>
                            <p className="text-xs text-gray-500">
                                Waste less. Value more.
                            </p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700">
                            <Leaf size={14} />
                            YOUR GREEN JOURNEY CONTINUES
                        </span>

                        <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                            Welcome back
                        </h2>

                        <p className="mt-3 text-sm leading-6 text-gray-500 sm:text-base">
                            Sign in to access your account and keep
                            making a positive environmental impact.
                        </p>
                    </div>

                    <form
                        onSubmit={handleLogin}
                        autoComplete="on"
                        className="flex flex-col gap-5"
                    >
                        {/* Email */}
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-2 block text-sm font-semibold text-gray-700"
                            >
                                Email address
                            </label>

                            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 transition focus-within:border-green-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-green-600/10">
                                <Mail
                                    size={19}
                                    className="shrink-0 text-gray-400"
                                />

                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) =>
                                        setEmail(e.target.value)
                                    }
                                    autoComplete="email"
                                    required
                                    className="w-full bg-transparent py-3.5 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <div className="mb-2 flex items-center justify-between gap-3">
                                <label
                                    htmlFor="password"
                                    className="text-sm font-semibold text-gray-700"
                                >
                                    Password
                                </label>

                                <Link
                                    href="/forgot-password"
                                    className="text-xs font-semibold text-green-700 transition hover:text-green-900 sm:text-sm"
                                >
                                    Forgot password?
                                </Link>
                            </div>

                            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 transition focus-within:border-green-600 focus-within:bg-white focus-within:ring-4 focus-within:ring-green-600/10">
                                <LockKeyhole
                                    size={19}
                                    className="shrink-0 text-gray-400"
                                />

                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    autoComplete="current-password"
                                    required
                                    className="w-full bg-transparent py-3.5 text-sm text-gray-900 outline-none placeholder:text-gray-400"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                    className="shrink-0 rounded-lg p-1 text-gray-400 transition hover:text-green-700"
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} />
                                    ) : (
                                        <Eye size={20} />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Login button */}
                        <button
                            type="submit"
                            disabled={
                                loading ||
                                !email.trim() ||
                                !password
                            }
                            className="mt-2 flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-green-600 to-teal-700 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-green-700/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-green-700/25 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <ClockLoader
                                        size={20}
                                        color="#ffffff"
                                    />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign in to your account
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>

                        <p className="pt-2 text-center text-sm text-gray-500">
                            Don&apos;t have an account?{" "}
                            <Link
                                href="/register"
                                className="font-bold text-green-700 transition hover:text-green-900"
                            >
                                Create an account
                            </Link>
                        </p>
                    </form>

                    <div className="mt-8 flex items-center justify-center gap-2 border-t border-gray-100 pt-6 text-xs text-gray-400">
                        <ShieldCheck size={15} />
                        Your account helps you track your environmental impact.
                    </div>
                </section>
            </div>
        </main>
    );
};

export default Page;