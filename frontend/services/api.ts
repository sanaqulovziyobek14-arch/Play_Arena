// ===== PlayArena API Service =====

const BASE_URL =
    typeof window !== "undefined"
        ? "http://localhost:8000/api/v1"
        : "http://backend_service:8000/api/v1";

// ── Token management
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
    const payload = decodeToken(token);
    return payload?.user_id ?? null;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
    refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
    refreshSubscribers.forEach((cb) => cb(token));
    refreshSubscribers = [];
}

async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    let token = getAccessToken();
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
    };

    if (token) headers["Authorization"] = `Bearer ${token}`;

    let res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

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

                    if (refreshRes.ok) {
                        const data = await refreshRes.json();
                        setTokens(data.access, refresh);
                        isRefreshing = false;
                        onRefreshed(data.access);
                    } else {
                        isRefreshing = false;
                        clearTokens();
                        if (typeof window !== "undefined") window.location.href = "/login";
                        throw new Error("Sessiya muddati tugadi. Qayta login qiling.");
                    }
                } catch (err) {
                    isRefreshing = false;
                    clearTokens();
                    throw err;
                }
            }

            return new Promise<T>((resolve) => {
                subscribeTokenRefresh(async (newToken) => {
                    headers["Authorization"] = `Bearer ${newToken}`;
                    const retryRes = await fetch(`${BASE_URL}${endpoint}`, {
                        ...options,
                        headers,
                    });
                    resolve(retryRes.json());
                });
            });
        }
    }

    if (!res.ok) {
        const error = await res.json().catch(() => ({detail: "Xato yuz berdi"}));
        throw new Error(error.detail || JSON.stringify(error));
    }

    // 204 No Content holati uchun
    if (res.status === 204) return {} as T;
    return res.json();
}


//  TYPES

export interface SportType {
    id: number;
    name: string;
    icon: string | null;
}

export interface VenueImage {
    id: number;
    image: string;
    venue: number;
}

export interface Venue {
    id: number;
    owner: number;
    sport: number;
    sport_name?:string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    width: number;
    length: number;
    price: string;
    description: string;
    start_time: string;
    end_time: string;
    has_wifi: boolean;
    has_parking: boolean;
    images: VenueImage[];
    created_at: string;
    today_booked_hours: number;
    weekly_booking_count: number;
    rating: number;
    review_count: number;
}

export interface Booking {
    id: number;
    user: number;
    venue: number;
    venue_name?: string;
    venue_address?: string;
    venue_price?: string;
    date: string;
    start_time: string;
    end_time: string;
    status: "pending" | "paid" | "canceled";
    created_at: string;
}

export interface User {
    id: number;
    username: string;
    email: string;
    phone: string | null;
    image: string | null;
    role: "user" | "owner" | "admin";
    first_name: string;
    last_name: string;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}


//  AUTH

export const authAPI = {
    login: (username: string, password: string) =>
        apiFetch<{ access: string; refresh: string }>("/token", {
            method: "POST",
            body: JSON.stringify({username, password}),
        }),

    register: (data: {
        username: string;
        password: string;
        email?: string;
        phone?: string;
        first_name?: string;
        last_name?: string;
    }) =>
        apiFetch<User>("/auth/register", {
            method: "POST",
            body: JSON.stringify(data),
        }),

    refreshToken: (refresh: string) =>
        apiFetch<{ access: string }>("/token/refresh", {
            method: "POST",
            body: JSON.stringify({refresh}),
        }),
};


//  SPORTS

export const sportsAPI = {
    getAll: () => apiFetch<PaginatedResponse<SportType>>("/sports"),
};


//  VENUES

export const venuesAPI = {
    getAll: (params?: {
        sport?: number;
        search?: string;
        ordering?: string;
        page?: number;
    }) => {
        const query = new URLSearchParams();
        if (params?.sport) query.set("sport", String(params.sport));
        if (params?.search) query.set("search", params.search);
        if (params?.ordering) query.set("ordering", params.ordering);
        if (params?.page) query.set("page", String(params.page));
        const qs = query.toString();
        return apiFetch<PaginatedResponse<Venue>>(`/venues${qs ? "?" + qs : ""}`);
    },

    getOne: (id: number) => apiFetch<Venue>(`/venues/${id}`),


    getBookedSlots: (venueId: number, date: string) =>
        apiFetch<{ booked: string[] }>(`/venues/${venueId}/booked-slots/?date=${date}`),
};


//  BOOKINGS

export const bookingsAPI = {
    getAll: () => apiFetch<PaginatedResponse<Booking>>("/bookings"),

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

    cancel: (id: number) =>
        apiFetch<Booking>(`/bookings/${id}`, {
            method: "PATCH",
            body: JSON.stringify({status: "canceled"}),
        }),
};


//  REVIEWS

export const reviewsAPI = {
    getByVenue: (venueId: number) =>
        apiFetch<PaginatedResponse<{ id: number; rating: number; comment: string; user: number }>>
        (`/reviews?venue=${venueId}`),
};


//  FAVORITES

export const favoritesAPI = {
    getAll: () => apiFetch<PaginatedResponse<{ id: number; venue: number }>>("/favorites"),

    add: (venueId: number) =>
        apiFetch<{ id: number; venue: number }>("/favorites", {
            method: "POST",
            body: JSON.stringify({venue: venueId}),
        }),

    remove: (id: number) =>
        apiFetch(`/favorites/${id}`, {method: "DELETE"}),
};


export const userAPI = {
    getMe: (id: number) => apiFetch<User>(`/users/${id}`),
    update: (id: number, data: Partial<User>) =>
        apiFetch<User>(`/users/${id}`, {
            method: "PATCH",
            body: JSON.stringify(data),
        }),
};


export const getVenues = venuesAPI.getAll;
export const getVenue = venuesAPI.getOne;
export const createBooking = bookingsAPI.create;
export const getBookings = bookingsAPI.getAll;
export const cancelBooking = bookingsAPI.cancel;
export const getBookedSlots = venuesAPI.getBookedSlots;