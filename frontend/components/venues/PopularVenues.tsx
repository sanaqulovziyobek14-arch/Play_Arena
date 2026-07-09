export default function PopularVenues() {

    const venues = [
        {
            name: "Play Arena Stadium",
            location: "Toshkent",
            price: "120 000 so'm",
            image:
                "https://images.unsplash.com/photo-1574629810360-7efbbe195018"
        },
        {
            name: "Mega Football",
            location: "Chilonzor",
            price: "150 000 so'm",
            image:
                "https://images.unsplash.com/photo-1517466787929-bc90951d0974"
        },
        {
            name: "Sport City",
            location: "Yunusobod",
            price: "180 000 so'm",
            image:
                "https://images.unsplash.com/photo-1522778119026-d647f0596c20"
        }
    ]

    return (

        <section className="max-w-7xl mx-auto px-6 py-16">

            <h2 className="text-4xl font-bold text-white mb-10">
                Mashhur Maydonlar
            </h2>

            <div className="grid lg:grid-cols-3 gap-8">

                {venues.map((venue) => (

                    <div
                        key={venue.name}
                        className="
                        overflow-hidden
                        rounded-3xl
                        bg-[#0D1727]
                        border
                        border-gray-800
                        "
                    >

                        <img
                            src={venue.image}
                            alt={venue.name}
                            className="
                            h-60
                            w-full
                            object-cover
                            "
                        />

                        <div className="p-6">

                            <h3 className="text-2xl text-white font-bold">
                                {venue.name}
                            </h3>

                            <p className="text-gray-400 mt-2">
                                📍 {venue.location}
                            </p>

                            <div className="flex justify-between items-center mt-6">

                                <span className="text-green-500 font-bold">
                                    {venue.price}
                                </span>

                                <button
                                    className="
                                    bg-green-500
                                    px-4
                                    py-2
                                    rounded-xl
                                    text-white
                                    "
                                >
                                    Bron qilish
                                </button>

                            </div>

                        </div>

                    </div>

                ))}

            </div>

        </section>
    )
}