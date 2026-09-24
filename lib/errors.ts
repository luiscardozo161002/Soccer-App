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

export function notFoundError(code: string, label: string, id: string) {
  return new ApiError(404, code, `No existe ${label} con id ${id}`);
}
