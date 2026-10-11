import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { latitude, longitude } = await request.json();

        if (
            typeof latitude !== "number" ||
            typeof longitude !== "number" ||
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180
        ) {
            return NextResponse.json(
                { error: "Valid GPS coordinates are required." },
                { status: 400 }
            );
        }

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: "Location service is not configured." },
                { status: 503 }
            );
        }

        const url = new URL(
            "https://maps.googleapis.com/maps/api/geocode/json"
        );

        url.searchParams.set("latlng", `${latitude},${longitude}`);
        url.searchParams.set("key", apiKey);

        const response = await fetch(url.toString());
        const data = await response.json();

        if (!response.ok || data.status !== "OK" || !data.results?.length) {
            return NextResponse.json(
                { error: "Unable to identify the report locality." },
                { status: 422 }
            );
        }

        const components = data.results[0].address_components ?? [];

        const getComponent = (type: string) =>
            components.find((component: { types: string[] }) =>
                component.types.includes(type)
            )?.long_name ?? "";

        const locality =
            getComponent("locality") ||
            getComponent("postal_town") ||
            getComponent("administrative_area_level_3");

        if (!locality) {
            return NextResponse.json(
                { error: "Could not identify a reliable locality." },
                { status: 422 }
            );
        }

        return NextResponse.json({ locality });
    } catch {
        return NextResponse.json(
            { error: "Failed to resolve the report location." },
            { status: 500 }
        );
    }
}