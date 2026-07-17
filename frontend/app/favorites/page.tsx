"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import {
  favoritesAPI,
  venuesAPI,
  type Venue,
} from "@/services/api";

export default function FavoritesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const favs = await favoritesAPI.getAll();

        const data = await Promise.all(
          favs.results.map((f) =>
            venuesAPI.getById(f.venue)
          )
        );

        setVenues(data);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <>
      <Navbar />

      <main
        style={{
          minHeight: "100vh",
          background: "#000",
          color: "#fff",
          paddingTop: "100px",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 24px",
          }}
        >
          <h1
            style={{
              fontSize: "32px",
              fontWeight: 800,
              marginBottom: "30px",
            }}
          >
            ❤️ Sevimli maydonlar
          </h1>

          {loading && <p>Yuklanmoqda...</p>}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill,minmax(280px,1fr))",
              gap: "20px",
            }}
          >
            {venues.map((venue) => (
              <div
                key={venue.id}
                style={{
                  border: "1px solid rgba(255,255,255,.08)",
                  borderRadius: "16px",
                  overflow: "hidden",
                }}
              >
                {venue.images?.[0] && (
                  <img
                    src={venue.images[0].image}
                    alt={venue.name}
                    style={{
                      width: "100%",
                      height: "180px",
                      objectFit: "cover",
                    }}
                  />
                )}

                <div style={{ padding: "16px" }}>
                  <h3>{venue.name}</h3>

                  <p
                    style={{
                      color: "#999",
                      marginTop: "8px",
                    }}
                  >
                    {venue.address}
                  </p>

                  <div
                    style={{
                      marginTop: "12px",
                      color: "#22c55e",
                      fontWeight: 700,
                    }}
                  >
                    {venue.price} so'm
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}