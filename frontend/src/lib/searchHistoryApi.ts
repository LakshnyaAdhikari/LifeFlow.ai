const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export interface SearchHistoryEntry {
    id: number;
    query: string;
    domain?: string | null;
    user_id: number;
    created_at: string;
}

function getAuthHeaders(): HeadersInit {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

export async function saveSearchToHistory(query: string, domain?: string): Promise<SearchHistoryEntry | null> {
    if (!query?.trim()) return null;

    const res = await fetch(`${API_BASE_URL}/api/search-history`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
            query: query.trim(),
            domain: domain || null,
        }),
    });

    if (!res.ok) {
        const message = await res.text();
        throw new Error(`Failed to save search history: ${message}`);
    }

    return res.json();
}

export async function fetchSearchHistory(
    options?: { limit?: number; offset?: number; domain?: string }
): Promise<SearchHistoryEntry[]> {
    const params = new URLSearchParams();
    if (options?.limit) params.set("limit", String(options.limit));
    if (options?.offset) params.set("offset", String(options.offset));
    if (options?.domain) params.set("domain", options.domain);

    const url = `${API_BASE_URL}/api/search-history${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        const message = await res.text();
        throw new Error(`Failed to fetch search history: ${message}`);
    }

    return res.json();
}

export async function deleteSearchHistoryEntry(searchId: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/search-history/${searchId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        const message = await res.text();
        throw new Error(`Failed to delete search history entry: ${message}`);
    }
}

export async function clearSearchHistory(): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/search-history`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        const message = await res.text();
        throw new Error(`Failed to clear search history: ${message}`);
    }
}
