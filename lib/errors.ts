export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message?: string,
    public details?: unknown
  ) {
    super(message ?? code);
    this.name = "ApiError";
  }
}

// Shared "does this id exist?" 404 — message reaches the browser as-is,
// so it's Spanish like the rest of the UI, not per-service English/Spanish.
export function notFoundError(code: string, label: string, id: string) {
  return new ApiError(404, code, `No existe ${label} con id ${id}`);
}
