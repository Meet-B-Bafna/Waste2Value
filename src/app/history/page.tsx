"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Coins,
  History,
  ImageIcon,
  Leaf,
  PackageCheck,
  Recycle,
  RefreshCw,
} from "lucide-react";
import { useRouter } from "next/navigation";

import SpinLoading from "@/components/loading/SpinLoading";

interface WasteRecord {
  wasteNameByAi?: string;
  wasteType?: string;
  wastePoints?: number;
  imagePath?: string;
  scanStatus?: "scanned" | "disposed";
  confidence?: number;
  day?: string | Date;
}

interface UserProfile {
  userData?: {
    wasteDumped?: WasteRecord[];
  };
}

const formatDate = (timestamp?: string | Date) => {
  if (!timestamp) return "Date unavailable";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (timestamp?: string | Date) => {
  if (!timestamp) return "";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Page = () => {
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getUserData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/profile", {
        credentials: "include",
        cache: "no-store",
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Unable to load your waste history.");
      }

      const data: UserProfile = await response.json();
      setUser(data);
    } catch (err) {
      console.error("History loading error:", err);
      setError("We couldn't load your history. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    getUserData();
  }, [getUserData]);

  const wasteRecords = Array.isArray(user?.userData?.wasteDumped)
    ? user.userData.wasteDumped
    : [];

  const sortedRecords = [...wasteRecords].reverse();

  const totalPoints = wasteRecords.reduce(
    (total, record) => total + (Number(record.wastePoints) || 0),
    0
  );

  const totalScans = wasteRecords.length;

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white px-4 pb-28 pt-7 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-7">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-green-800">
              <History size={25} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Waste History
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Track your waste classification activity.
              </p>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex min-h-[45vh] flex-col items-center justify-center gap-4">
            <SpinLoading />
            <p className="text-sm text-gray-500">
              Loading your waste history...
            </p>
          </div>
        ) : error ? (
          <section className="rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <RefreshCw size={25} />
            </div>

            <h2 className="mt-4 text-lg font-bold text-gray-900">
              Unable to load history
            </h2>

            <p className="mt-2 text-sm text-gray-500">{error}</p>

            <button
              onClick={getUserData}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </section>
        ) : (
          <>
            <section className="mb-8 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    Total scans
                  </span>
                  <div className="rounded-xl bg-green-50 p-2 text-green-700">
                    <Recycle size={19} />
                  </div>
                </div>

                <p className="mt-3 text-3xl font-bold text-gray-900">
                  {totalScans}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Recorded activities
                </p>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    Points earned
                  </span>
                  <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
                    <Coins size={19} />
                  </div>
                </div>

                <p className="mt-3 text-3xl font-bold text-gray-900">
                  {totalPoints.toLocaleString("en-IN")}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  From recorded activities
                </p>
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Recent activity
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Your latest scans appear first.
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-800">
                  {totalScans} {totalScans === 1 ? "record" : "records"}
                </span>
              </div>

              {sortedRecords.length > 0 ? (
                <div className="space-y-4">
                  {sortedRecords.map((waste, index) => {
                    const wasteName =
                      waste.wasteNameByAi?.trim() || "Unknown waste";

                    const points = Number(waste.wastePoints) || 0;

                    const isDisposed = waste.scanStatus === "disposed";

                    return (
                      <article
                        key={`${waste.day ?? "record"}-${index}`}
                        className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:border-green-200 hover:shadow-md"
                      >
                        {/* Scanned image */}
                        {waste.imagePath ? (
                          <div className="relative flex h-52 items-center justify-center bg-gray-50 sm:h-64">
                            <img
                              src={waste.imagePath}
                              alt={`Scanned ${wasteName}`}
                              className="h-full w-full object-contain"
                              loading="lazy"
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                        ) : (
                          <div className="flex h-28 items-center justify-center gap-2 bg-gray-50 text-sm text-gray-400">
                            <ImageIcon size={22} />
                            Image unavailable for this record
                          </div>
                        )}

                        <div className="p-4 sm:p-5">
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
                              <PackageCheck size={23} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <h3 className="break-words text-base font-bold capitalize text-gray-900">
                                {wasteName}
                              </h3>

                              {waste.wasteType && (
                                <p className="mt-1 text-sm text-gray-500">
                                  Type: {waste.wasteType}
                                </p>
                              )}

                              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                                <span className="inline-flex items-center gap-1.5">
                                  <CalendarDays size={14} />
                                  {formatDate(waste.day)}
                                </span>

                                {formatTime(waste.day) && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <Clock3 size={14} />
                                    {formatTime(waste.day)}
                                  </span>
                                )}
                              </div>

                              {typeof waste.confidence === "number" &&
                                waste.confidence > 0 && (
                                  <p className="mt-2 text-xs text-gray-500">
                                    AI confidence:{" "}
                                    {waste.confidence <= 1
                                      ? `${(waste.confidence * 100).toFixed(1)}%`
                                      : `${waste.confidence.toFixed(1)}%`}
                                  </p>
                                )}
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
                            <span
                              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                                isDisposed
                                  ? "bg-green-100 text-green-800"
                                  : "bg-blue-50 text-blue-700"
                              }`}
                            >
                              {isDisposed ? "Disposed" : "Scanned"}
                            </span>

                            <div className="text-right">
                              <p className="text-sm font-bold text-green-700">
                                +{points} points
                              </p>
                              {!isDisposed && (
                                <p className="mt-0.5 text-xs text-gray-400">
                                  No points awarded yet
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-green-200 bg-white px-6 py-12 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                    <Leaf size={30} />
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-gray-900">
                    No waste records yet
                  </h3>

                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
                    Your scanned waste photos will appear here once they are
                    saved to your account.
                  </p>

                  <button
                    onClick={() => router.push("/scan-waste")}
                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800"
                  >
                    Start scanning
                    <ArrowRight size={17} />
                  </button>
                </div>
              )}
            </section>

            {totalScans > 0 && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50/70 p-4">
                <Leaf size={19} className="mt-0.5 shrink-0 text-green-700" />
                <p className="text-xs leading-5 text-gray-600">
                  Your scan history helps you track waste classification and
                  disposal activity in Waste2Value.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default Page;