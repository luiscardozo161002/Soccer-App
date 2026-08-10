import { ApiError } from "@/lib/errors";

interface RequestOptions extends RequestInit {
  timeout?: number;
}

interface ErrorEnvelope {
  error?: { code?: string; message?: string; details?: unknown };
}

export async function http<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { timeout = 10_000, headers, ...config } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...config,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...headers },
    });

    if (!response.ok) {
      const body: ErrorEnvelope | null = await response.json().catch(() => null);
      throw new ApiError(
        response.status,
        body?.error?.code ?? "HTTP_ERROR",
        body?.error?.message,
        body?.error?.details
      );
    }

    if (response.status === 204) return undefined as T;
    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}
