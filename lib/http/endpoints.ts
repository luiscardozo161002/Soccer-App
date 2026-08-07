import { http } from "@/lib/http/http-client";

export function get<T>(url: string) {
  return http<T>(url, { method: "GET" });
}

export function post<T, B = unknown>(url: string, body: B) {
  return http<T>(url, { method: "POST", body: JSON.stringify(body) });
}

export function put<T, B = unknown>(url: string, body: B) {
  return http<T>(url, { method: "PUT", body: JSON.stringify(body) });
}

export function patch<T, B = unknown>(url: string, body: B) {
  return http<T>(url, { method: "PATCH", body: JSON.stringify(body) });
}

export function remove<T>(url: string) {
  return http<T>(url, { method: "DELETE" });
}
