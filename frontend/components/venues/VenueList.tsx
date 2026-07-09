"use client";

import { useEffect, useState } from "react";
import { getVenues } from "@/services/api";
import VenueCard from "./VenueCard";

export default function VenueList() {
    const [loading, setLoading] = useState(true);
    const [venues, setVenues] = useState<any[]>([]);

    useEffect(() => {
        async function loadVenues() {
            try {
                const data = await getVenues();

                console.log("API DATA:", data);

                setVenues(data.results || []);
            } catch (error) {
                console.error("API ERROR:", error);
            } finally {
                setLoading(false);
            }
        }

        loadVenues();
    }, []);

    if (loading) {
        return <h2>Yuklanmoqda...</h2>;
    }

    return (
    <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-4xl font-bold mb-10">
            Popular Arenalar
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {venues.map((venue: any) => (
                <VenueCard
                    key={venue.id}
                    venue={venue}
                />
            ))}
        </div>
    </section>
);
}