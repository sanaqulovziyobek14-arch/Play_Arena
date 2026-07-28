// ============================================================
//  PlayArena — API Service Layer  (frontend/services/api.ts)
// ============================================================
// ── Base URL: development da localhost, Docker'da container nomi
const BASE_URL =
    typeof window !== "undefined"
        ? "http://localhost:8000/api/v1"       // Brauzer uchun aniq manzil
        : "http://backend_service:8000/api/v1"; // Docker container ichi uchun
// ════════════════════════════════════════
//  TYPE DEFINITIONS  (backendga mos)
// ════════════════════════════════════════
export interface User {
    id: number;
    username: string;
    email: string;
    phone: string | null;
    first_name: string;
    last_name: string;
    role: "user" | "owner" | "admin";
    image: string | null;
}

export interface SportType {
    id: number;
    name: string;
    icon: string | null;
}

export interface VenueImage {
    id: number;
    image: string;
}

export interface Venue {
    id: number;
    name: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
    price: string;           // DecimalField → string
    description: string;
    start_time: string;      // "09:00:00"
    end_time: string;        // "23:00:00"
    has_wifi: boolean;
    has_parking: boolean;
    sport: number;           // SportType ID
    sport_name?: string;
    owner: number;
    owner_name?: string;
    images: VenueImage[];
    avg_rating: number | null;
    review_count: number;
    status: "pending" | "approved" | "rejected";
    size?: string;
    surface_type?: string;
}

export interface Booking {
    id: number;
    venue: number;
    venue_name?: string;
    venue_address?: string;
    user: number;
    date: string;            // "2025-07-10"
    start_time: string;      // "10:00:00"
    end_time: string;        // "12:00:00"
    total_price: string;
    status: "pending" | "confirmed" | "canceled";
    created_at: string;
}

export interface VenueStats {
    id: number;
    name: string;
    sport: string | null;
    status: string;
    status_display: string;
    owner_id: number;

    total_bookings: number;
    paid_bookings: number;
    canceled_bookings: number;

    total_revenue: number;

    average_rating: number | null;
    review_count: number;
}

export interface VenueStatsResponse {
    is_admin_view: boolean;
    results: VenueStats[];
}

export interface Review {
    id: number;
    venue: number;
    user: number;
    user_name?: string;
    user_image?: string;
    rating: number;          // 1-5
    comment: string;
    created_at: string;
}

export interface Favorite {
    id: number;
    venue: number;
    venue_detail?: Venue;
    user: number;
}

export interface Payment {
    id: number;
    booking: number;
    amount: string;
    payment_method: string;
    status: string;
    created_at: string;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface LoginPayload {
    username: string;
    password: string;
}

export interface RegisterPayload {
    username: string;
    password: string;
    email?: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
}

export interface TokenPair {
    access: string;
    refresh: string;
}

// ════════════════════════════════════════
//  TOKEN HELPERS
// ════════════════════════════════════════
export const getAccessToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
export const getRefreshToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
export const setTokens = (access: string, refresh: string) => {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
};
export const clearTokens = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
};

export function decodeToken(token: string): Record<string, any> | null {
    try {
        const payload = token.split(".")[1];
        const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
        return JSON.parse(decodeURIComponent(escape(json)));
    } catch {
        return null;
    }
}

export function getCurrentUserId(): number | null {
    const token = getAccessToken();
    if (!token) return null;
    return decodeToken(token)?.user_id ?? null;
}

export function getUserRole(): string | null {
    const token = getAccessToken();
    if (!token) return null;
    return decodeToken(token)?.role ?? null;
}

// ════════════════════════════════════════
//  CORE FETCH  (token auto-refresh)
// ════════════════════════════════════════
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
    refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
    refreshSubscribers.forEach(cb => cb(token));
    refreshSubscribers = [];
}

async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {},
    isFormData = false,
): Promise<T> {
    let token = getAccessToken();
    const headers: Record<string, string> = {
        ...(isFormData ? {} : {"Content-Type": "application/json"}),
        ...(options.headers as Record<string, string>),
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    let res = await fetch(`${BASE_URL}${endpoint}`, {...options, headers});
    // ── Auto token refresh ──
    if (res.status === 401 && token) {
        const refresh = getRefreshToken();
        if (refresh) {
            if (!isRefreshing) {
                isRefreshing = true;
                try {
                    const refreshRes = await fetch(`${BASE_URL}/token/refresh`, {
                        method: "POST",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify({refresh}),
                    });
                    if (!refreshRes.ok) throw new Error("Refresh failed");
                    const {access} = await refreshRes.json();
                    setTokens(access, refresh);
                    onRefreshed(access);
                } catch {
                    clearTokens();
                    if (typeof window !== "undefined") window.location.href = "/login";
                    throw new Error("Session tugadi. Qayta kiring.");
                } finally {
                    isRefreshing = false;
                }
            }
            // Birdan ko'p so'rov kutib tursa
            token = await new Promise<string>(resolve =>
                subscribeTokenRefresh(resolve)
            );
            headers["Authorization"] = `Bearer ${token}`;
            res = await fetch(`${BASE_URL}${endpoint}`, {...options, headers});
        }
    }
    if (!res.ok) {
        let errorMsg = `Xatolik: ${res.status}`;
        try {
            const errData = await res.json();
            errorMsg = errData?.detail || errData?.message ||
                Object.values(errData).flat().join(", ") || errorMsg;
        } catch {
        }
        throw new Error(errorMsg);
    }
    // 204 No Content
    if (res.status === 204) return null as T;
    return res.json() as Promise<T>;
}

// ════════════════════════════════════════
//  AUTH API
// ════════════════════════════════════════
export const authAPI = {
    /** Login → JWT token olish */
    login: (data: LoginPayload) =>
        apiFetch<TokenPair>("/token", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    /** Ro'yxatdan o'tish */
    register: (data: RegisterPayload) =>
        apiFetch<User>("/auth/register", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    /** Token yangilash */
    refresh: (refresh: string) =>
        apiFetch<{ access: string }>("/token/refresh", {
            method: "POST",
            body: JSON.stringify({refresh}),
        }),
};
// ════════════════════════════════════════
//  USER API
// ════════════════════════════════════════
export const userAPI = {
    /** Profil ma'lumotlarini olish */
    getMe: (id: number) =>
        apiFetch<User>(`/users/${id}`),
    /** Profilni yangilash */
    update: (id: number, data: Partial<User> & { password?: string }) =>
        apiFetch<User>(`/users/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),
    /** Profil rasmini yuklash */
    updateImage: (id: number, file: File) => {
        const form = new FormData();
        form.append("image", file);
        return apiFetch<User>(`/users/${id}`, {
            method: "PATCH",
            body: form,
        }, true);
    },
};
// ════════════════════════════════════════
//  SPORT TYPES API
// ════════════════════════════════════════
export const sportTypesAPI = {
    /** Barcha sport turlarini olish */
    getAll: () =>
        apiFetch<PaginatedResponse<SportType>>("/sport-types"),
    /** Bitta sport turini olish */
    getById: (id: number) =>
        apiFetch<SportType>(`/sport-types/${id}`),
};
// ════════════════════════════════════════
//  VENUES API
// ════════════════════════════════════════
export const venuesAPI = {
    /** Barcha maydonlar (filter, search, ordering qo'llab-quvvatlaydi) */
    getAll: (params?: {
        sport?: number;
        search?: string;
        ordering?: string;
        page?: number;
        min_price?: number;
        max_price?: number;
        has_wifi?: boolean;
        has_parking?: boolean;
        status?: string;
    }) => {
        const query = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                if (v !== undefined && v !== null && v !== "") {
                    query.append(k, String(v));
                }
            });
        }
        const qs = query.toString();
        return apiFetch<PaginatedResponse<Venue>>(`/venues${qs ? `?${qs}` : ""}`);
    },
    /** Bitta maydon */
    getById: (id: number) =>
        apiFetch<Venue>(`/venues/${id}`),
    /** Yangi maydon yaratish (owner uchun) */
    create: (data: FormData) =>
        apiFetch<Venue>("/venues", {
            method: "POST",
            body: data,
        }, true),
    /** Maydonni yangilash */
    update: (id: number, data: FormData | Partial<Venue>) => {
        const isForm = data instanceof FormData;
        return apiFetch<Venue>(`/venues/${id}`, {
            method: "PATCH",
            body: isForm ? data : JSON.stringify(data),
        }, isForm);
    },
    /** Maydonni o'chirish */
    delete: (id: number) =>
        apiFetch<null>(`/venues/${id}`, {method: "DELETE"}),
    /** Band vaqtlarini olish */
    getBookedSlots: (venueId: number, date: string) =>
        apiFetch<{ booked: { start: string; end: string }[] }>(
            `/venues/${venueId}/booked-slots?date=${date}`
        ),
    myStats: () =>
        apiFetch<VenueStatsResponse>("/venues/my-stats"),

};
// ════════════════════════════════════════
//  BOOKINGS API
// ════════════════════════════════════════
export const bookingsAPI = {
    /** Mening bronlarim */
    getAll: (params?: { status?: string; page?: number }) => {
        const query = new URLSearchParams();
        if (params?.status) query.append("status", params.status);
        if (params?.page) query.append("page", String(params.page));
        const qs = query.toString();
        return apiFetch<PaginatedResponse<Booking>>(`/bookings${qs ? `?${qs}` : ""}`);
    },
    /** Bitta bron */
    getById: (id: number) =>
        apiFetch<Booking>(`/bookings/${id}`),
    /** Yangi bron yaratish */
    create: (data: {
        venue: number;
        date: string;
        start_time: string;
        end_time: string;
    }) =>
        apiFetch<Booking>("/bookings", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    /** Bronni bekor qilish */
    cancel: (id: number) =>
        apiFetch<Booking>(`/bookings/${id}`, {
            method: "PATCH",
            body: JSON.stringify({status: "canceled"}),
        }),
};
// ════════════════════════════════════════
//  REVIEWS API
// ════════════════════════════════════════
export const reviewsAPI = {
    /** Maydon sharhlari */
    getByVenue: (venueId: number) =>
        apiFetch<PaginatedResponse<Review>>(`/reviews?venue=${venueId}`),
    /** Sharh qo'shish */
    create: (data: { venue: number; rating: number; comment: string }) =>
        apiFetch<Review>("/reviews", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    /** Sharhni o'chirish */
    delete: (id: number) =>
        apiFetch<null>(`/reviews/${id}`, {method: "DELETE"}),
};
// ════════════════════════════════════════
//  FAVORITES API
// ════════════════════════════════════════
export const favoritesAPI = {
    /** Sevimlilarni olish */
    getAll: () =>
        apiFetch<PaginatedResponse<Favorite>>("/favorites"),
    /** Sevimlilarga qo'shish */
    add: (venueId: number) =>
        apiFetch<Favorite>("/favorites", {
            method: "POST",
            body: JSON.stringify({venue: venueId}),
        }),
    /** Sevimlilardan o'chirish */
    remove: (id: number) =>
        apiFetch<null>(`/favorites/${id}`, {method: "DELETE"}),
    /** Mavjudligini tekshirish */
    check: async (venueId: number): Promise<number | null> => {
        const res = await favoritesAPI.getAll();
        const found = res.results.find(f => f.venue === venueId);
        return found ? found.id : null;
    },
};
// ════════════════════════════════════════
//  PAYMENTS API
// ════════════════════════════════════════
export const paymentsAPI = {
    create: (data: { booking: number; amount: number; payment_method: "click" | "payme" }) =>
        apiFetch<Payment>("/payments", {
            method: "POST",
            body: JSON.stringify(data),
        }),
    getById: (id: number) =>
        apiFetch<Payment>(`/payments/${id}`),
};
// ════════════════════════════════════════
//  LEGACY EXPORTS (eski kodni buzmaslik)
// ════════════════════════════════════════
/** @deprecated authAPI.login ishlatilsin */
export const loginUser = (data: LoginPayload) => authAPI.login(data);
/** @deprecated authAPI.register ishlatilsin */
export const registerUser = (data: RegisterPayload) => authAPI.register(data);

export const sportsAPI = sportTypesAPI;