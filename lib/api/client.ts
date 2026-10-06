import { useAuthStore } from "@/lib/stores/auth-store"

const CONFIGURED_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api").replace(/\/$/, "")

/**
 * A "localhost" API URL only works in a browser on this same machine. When the panel
 * is opened from another device (e.g. http://192.168.100.14:3000), call the API on the
 * host the page itself was loaded from instead.
 */
function apiBaseUrl(): string {
  if (typeof window === "undefined") return CONFIGURED_BASE_URL
  const url = new URL(CONFIGURED_BASE_URL)
  const pageHost = window.location.hostname
  if (["localhost", "127.0.0.1"].includes(url.hostname) && !["localhost", "127.0.0.1"].includes(pageHost)) {
    url.hostname = pageHost
  }
  return url.toString().replace(/\/$/, "")
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    /** Laravel validation errors, keyed by field. */
    readonly errors: Record<string, string[]> = {}
  ) {
    super(message)
  }

  firstError(field: string): string | undefined {
    return this.errors[field]?.[0]
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  body?: unknown
  query?: Record<string, string | number | null | undefined>
}

export async function api<T>(path: string, { method = "GET", body, query }: RequestOptions = {}): Promise<T> {
  const url = new URL(`${apiBaseUrl()}/${path.replace(/^\//, "")}`)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== null && value !== undefined && value !== "") url.searchParams.set(key, String(value))
  }

  const token = useAuthStore.getState().token
  const res = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      ...(body !== undefined && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) return undefined as T

  const payload = await res.json().catch(() => ({}))

  if (!res.ok) {
    // Expired or revoked token: drop the session; AuthGuard redirects to /login.
    if (res.status === 401) useAuthStore.getState().signOut()
    throw new ApiError(payload.message ?? `Request failed (${res.status})`, res.status, payload.errors)
  }

  return payload as T
}

/**
 * Multipart upload with progress (fetch can't report upload progress).
 * Resolves with the JSON body; rejects with ApiError like `api()`.
 */
export function uploadWithProgress<T>(path: string, form: FormData, onProgress: (fraction: number) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", `${apiBaseUrl()}/${path.replace(/^\//, "")}`)
    xhr.setRequestHeader("Accept", "application/json")
    const token = useAuthStore.getState().token
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`)
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total)
    xhr.onerror = () => reject(new ApiError("Upload failed: cannot reach the server.", 0))
    xhr.onload = () => {
      let body: { message?: string; errors?: Record<string, string[]> } = {}
      try {
        body = JSON.parse(xhr.responseText || "{}")
      } catch {
        // Non-JSON error page (e.g. PHP upload limit); fall through with the status text.
      }
      if (xhr.status >= 200 && xhr.status < 300) return resolve(body as T)
      if (xhr.status === 401) useAuthStore.getState().signOut()
      const message =
        xhr.status === 413 ? "The file is larger than the server allows." : (body.message ?? `Upload failed (${xhr.status})`)
      reject(new ApiError(message, xhr.status, body.errors))
    }
    xhr.send(form)
  })
}

/** Fetches an authenticated binary (e.g. a receipt screenshot) and returns an object URL. */
export async function fetchBlobUrl(path: string): Promise<string> {
  const token = useAuthStore.getState().token
  const res = await fetch(`${apiBaseUrl()}/${path.replace(/^\//, "")}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new ApiError(`Could not load (${res.status})`, res.status)
  return URL.createObjectURL(await res.blob())
}
