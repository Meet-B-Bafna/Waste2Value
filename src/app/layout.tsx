import { Toaster } from "react-hot-toast";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import NextTopLoader from "nextjs-toploader";

import "./globals.css";

import Navbar from "@/components/shared/Navbar";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
    title: "Waste2Value",
    manifest: "/manifest.json",
    icons: { apple: "/wastelogo.png" },
    description:
        "Waste2Value — Smart Waste Detection and Sustainable Waste Management",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: "#f0fdf4",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${inter.className} min-h-screen w-full bg-[#f0fdf4] text-[#14532d] antialiased`}
            >
                <Toaster
                    position="top-center"
                    toastOptions={{
                        duration: 3000,
                        style: {
                            borderRadius: "14px",
                            background: "#ffffff",
                            color: "#14532d",
                            boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                        },
                    }}
                />

                <NextTopLoader
                    color="#16a34a"
                    initialPosition={0.08}
                    crawlSpeed={200}
                    height={3}
                    crawl={true}
                    easing="ease"
                    speed={200}
                    zIndex={1600}
                    showAtBottom={false}
                    showSpinner={false}
                />

                {/* Shared page container: same max-width as the Navbar (690px),
                    plus bottom padding so content never hides behind the nav */}
                <main className="mx-auto w-full max-w-[690px] px-4 pb-36 pt-4">
                    {children}
                </main>

                <Navbar />
            </body>
        </html>
    );
}