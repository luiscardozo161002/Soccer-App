import { ApiError } from "@/lib/errors";
import { redirectToLogin, requestSessionRenewal, isLoggingOut } from "@/lib/auth/client-session";

interface RequestOptions extends RequestInit {
  timeout?: number;
}

interface ErrorEnvelope {
  error?: { code?: string; message?: string; details?: unknown };
}

export async function http<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const { timeout = 10_000, headers, ...config } = options;
  const perform = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      return await fetch(url, {
        ...config,
        signal: controller.signal,
        headers: { "Content-Type": "application/json", ...headers },
      });
    } finally {
      clearTimeout(timeoutId);
    }
  };
  const isAuthAction = url.startsWith("/api/v1/auth/") && !url.endsWith("/me");
  let response = await perform();
  if (response.status === 401 && !isAuthAction && typeof window !== "undefined" && !isLoggingOut()) {
    if (await requestSessionRenewal()) {
      response = await perform();
      if (response.status === 401) redirectToLogin();
    } else {
      redirectToLogin();
    }
  }
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
}
