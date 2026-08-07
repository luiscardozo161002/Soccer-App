import { NextResponse } from "next/server";

interface OkOptions {
  status?: number;
  meta?: Record<string, unknown>;
  message?: string;
}

export function ok<T>(data: T, options: OkOptions = {}) {
  const body: Record<string, unknown> = { success: true, data };
  if (options.meta) body.meta = options.meta;
  if (options.message) body.message = options.message;
  return NextResponse.json(body, { status: options.status ?? 200 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}
