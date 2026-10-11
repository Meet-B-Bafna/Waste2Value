"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Recycle,
    Lightbulb,
    Clock,
    Wrench,
    Leaf,
} from "lucide-react";

const reuseIdeas: Record<
    string,
    {
        title: string;
        description: string;
        materials: string[];
        steps: string[];
        difficulty: string;
        time: string;
    }[]
> = {
    plastic: [
        {
            title: "Self-Watering Planter",
            description: "Reuse a plastic bottle to grow small plants.",
            materials: ["Plastic bottle", "Scissors", "Soil", "Plant"],
            steps: [
                "Clean the bottle thoroughly.",
                "Cut the bottle into two sections.",
                "Make small drainage holes where appropriate.",
                "Add soil and a small plant.",
                "Water carefully and place it in a suitable location.",
            ],
            difficulty: "Easy",
            time: "15–20 minutes",
        },
        {
            title: "Desk Organizer",
            description: "Turn a suitable plastic container into a stationery holder.",
            materials: ["Clean plastic container", "Scissors", "Decorative paper"],
            steps: [
                "Wash and dry the container.",
                "Trim the top carefully.",
                "Cover the outside with decorative paper.",
                "Use it to organize pens and pencils.",
            ],
            difficulty: "Easy",
            time: "10–15 minutes",
        },
    ],
    cardboard: [
        {
            title: "Storage Organizer",
            description: "Convert a cardboard box into a storage organizer.",
            materials: ["Cardboard box", "Ruler", "Glue", "Paper"],
            steps: [
                "Choose a clean, sturdy cardboard box.",
                "Trim it to the required size.",
                "Reinforce weak corners with cardboard strips.",
                "Cover the box with paper.",
                "Use it to store stationery or small items.",
            ],
            difficulty: "Easy",
            time: "20–30 minutes",
        },
    ],
    glass: [
        {
            title: "Decorative Vase",
            description: "Reuse a clean glass bottle as a decorative vase.",
            materials: ["Glass bottle", "Water", "Decorative ribbon"],
            steps: [
                "Wash the bottle thoroughly.",
                "Remove labels if they come off safely.",
                "Decorate the outside with ribbon.",
                "Add water and suitable flowers.",
                "Place it on a stable surface.",
            ],
            difficulty: "Easy",
            time: "10–15 minutes",
        },
    ],
    metal: [
        {
            title: "Desk Pen Holder",
            description: "Reuse a clean metal can to organize stationery.",
            materials: ["Clean metal can", "Decorative paper", "Glue"],
            steps: [
                "Ensure the can is empty and clean.",
                "Do not handle it if its rim is sharp.",
                "Cover the outside with decorative paper.",
                "Place pens and pencils inside.",
            ],
            difficulty: "Easy",
            time: "10–15 minutes",
        },
    ],
    paper: [
        {
            title: "Recycled Paper Craft",
            description: "Use suitable waste paper for simple craft projects.",
            materials: ["Waste paper", "Glue", "Scissors", "Cardboard"],
            steps: [
                "Separate clean paper from contaminated waste.",
                "Cut or fold it into suitable shapes.",
                "Combine the pieces with glue if needed.",
                "Attach them to cardboard for support.",
                "Create a greeting card or decorative artwork.",
            ],
            difficulty: "Easy",
            time: "15–25 minutes",
        },
    ],
};

function getIdeas(material: string) {
    const value = material.toLowerCase();

    if (value.includes("plastic") || value.includes("bottle")) {
        return reuseIdeas.plastic;
    }

    if (value.includes("cardboard")) {
        return reuseIdeas.cardboard;
    }

    if (value.includes("glass")) {
        return reuseIdeas.glass;
    }

    if (
        value.includes("metal") ||
        value.includes("tin") ||
        value.includes("can")
    ) {
        return reuseIdeas.metal;
    }

    if (value.includes("paper")) {
        return reuseIdeas.paper;
    }

    return [];
}

export default function BestOutOfWastePage() {
    const searchParams = useSearchParams();

    const wasteName = searchParams.get("wasteName") || "Unknown waste";
    const material = searchParams.get("material") || wasteName;
    const totalWaste = searchParams.get("totalwaste") || "1";

    const ideas = getIdeas(material);

    return (
        <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 px-4 py-8">
            <div className="mx-auto max-w-5xl">
                <Link
                    href="/scan-waste"
                    className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-600"
                >
                    <ArrowLeft size={18} />
                    Back to Scanner
                </Link>

                <section className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                        <Recycle size={30} />
                    </div>

                    <h1 className="mt-5 text-3xl font-bold text-gray-900 sm:text-4xl">
                        Best Out of Waste
                    </h1>

                    <p className="mt-3 max-w-2xl leading-7 text-gray-600">
                        Discover practical ways to reuse waste and give
                        discarded materials a second life.
                    </p>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl bg-emerald-50 p-4">
                            <p className="text-sm text-emerald-800">
                                Detected waste
                            </p>
                            <p className="mt-1 text-lg font-bold text-emerald-950">
                                {wasteName}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-green-50 p-4">
                            <p className="text-sm text-green-800">
                                Detected quantity
                            </p>
                            <p className="mt-1 text-lg font-bold text-green-950">
                                {totalWaste} item(s)
                            </p>
                        </div>
                    </div>
                </section>

                <section className="mt-8">
                    <div className="mb-5">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Reuse ideas for your waste
                        </h2>
                        <p className="mt-2 text-gray-600">
                            Select an idea and follow its instructions.
                        </p>
                    </div>

                    {ideas.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2">
                            {ideas.map((idea) => (
                                <article
                                    key={idea.title}
                                    className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-xl bg-amber-50 p-3 text-amber-700">
                                            <Lightbulb size={24} />
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">
                                                {idea.title}
                                            </h3>
                                            <p className="mt-1 text-sm leading-6 text-gray-600">
                                                {idea.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-5 flex flex-wrap gap-3 text-sm text-gray-600">
                                        <span className="flex items-center gap-1.5">
                                            <Wrench size={16} />
                                            {idea.difficulty}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Clock size={16} />
                                            {idea.time}
                                        </span>
                                    </div>

                                    <h4 className="mt-6 font-semibold text-gray-900">
                                        Materials required
                                    </h4>

                                    <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-600">
                                        {idea.materials.map((item) => (
                                            <li key={item}>{item}</li>
                                        ))}
                                    </ul>

                                    <h4 className="mt-6 font-semibold text-gray-900">
                                        Instructions
                                    </h4>

                                    <ol className="mt-3 space-y-3">
                                        {idea.steps.map((step, index) => (
                                            <li
                                                key={step}
                                                className="flex gap-3 text-sm leading-6 text-gray-600"
                                            >
                                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
                                                    {index + 1}
                                                </span>
                                                <span>{step}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                            <div className="flex items-center gap-2 font-semibold text-amber-900">
                                <Leaf size={20} />
                                No matching reuse ideas yet
                            </div>
                            <p className="mt-2 text-sm leading-6 text-amber-800">
                                We do not currently have reuse instructions
                                for this detected material. Verify the
                                material first, then choose an appropriate
                                reuse method.
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}