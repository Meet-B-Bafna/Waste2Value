"use client";

import React from "react";
import { Home, Flag, Scan, Ticket, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Keep this value identical to the max-width of your page content wrapper.
export const CONTAINER_MAX_WIDTH = "max-w-[690px]";

const HIDDEN_ROUTES = [
    "/login",
    "/register",
    "/forgot-password",
    "/verify-register",
    "/verify-forget-password",
];

const Navbar = () => {
    const pathname = usePathname();

    if (HIDDEN_ROUTES.includes(pathname)) {
        return null;
    }

    const isActive = (href: string) =>
        href === "/" ? pathname === "/" : pathname.startsWith(href);

    const navItemClass = (href: string) =>
        `flex min-w-0 flex-1 flex-col items-center justify-center gap-1 transition-colors hover:text-green-700 ${
            isActive(href) ? "text-green-700" : "text-[#647067]"
        }`;

    const labelClass = "text-[11px] font-medium leading-tight";

    return (
        <nav className="fixed inset-x-0 bottom-0 z-50 w-full px-4 pb-3">
            <div className={`mx-auto w-full ${CONTAINER_MAX_WIDTH}`}>
                <div className="relative rounded-2xl border border-gray-100 bg-white shadow-[0_4px_25px_rgba(0,0,0,0.12)]">
                    <div className="grid h-[76px] grid-cols-5 items-center px-2 sm:px-4">

                        {/* Home */}
                        <Link href="/" className={navItemClass("/")}>
                            <Home size={23} strokeWidth={isActive("/") ? 2.2 : 1.8} />
                            <span className={labelClass}>Home</span>
                        </Link>

                        {/* Report Waste */}
                        <Link href="/report-waste" className={navItemClass("/report-waste")}>
                            <Flag size={23} strokeWidth={isActive("/report-waste") ? 2.2 : 1.8} />
                            <span className={labelClass}>Report</span>
                        </Link>

                        {/* Center Scan Button */}
                        <Link
                            href="/scan-waste"
                            aria-label="Scan waste"
                            className="relative flex h-full min-w-0 flex-col items-center justify-center"
                        >
                            <span className="absolute -top-6 flex h-[58px] w-[58px] items-center justify-center rounded-full border-[5px] border-white bg-green-700 text-white shadow-lg transition-transform hover:scale-105">
                                <Scan size={25} strokeWidth={2} />
                            </span>

                            <span className={`${labelClass} mt-9 text-green-800`}>
                                Scan
                            </span>
                        </Link>

                        {/* Coupons */}
                        <Link href="/coupons" className={navItemClass("/coupons")}>
                            <Ticket size={23} strokeWidth={isActive("/coupons") ? 2.2 : 1.8} />
                            <span className={labelClass}>Coupons</span>
                        </Link>

                        {/* Profile */}
                        <Link href="/profile" className={navItemClass("/profile")}>
                            <User size={23} strokeWidth={isActive("/profile") ? 2.2 : 1.8} />
                            <span className={labelClass}>Profile</span>
                        </Link>

                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;