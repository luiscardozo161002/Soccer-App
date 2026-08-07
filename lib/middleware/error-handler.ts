import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "@/lib/errors";

type RouteContext = { params: Promise<Record<string, string>> };
type Handler = (req: NextRequest, context: RouteContext) => Promise<NextResponse>;

function errorEnvelope(code: string, message: string, details: unknown = null) {
  return { success: false, error: { code, message, details } };
}

export function withErrorHandling(handler: Handler): Handler {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        return NextResponse.json(
          errorEnvelope("VALIDATION_ERROR", "Request inválida", details),
          { status: 422 }
        );
      }

      if (error instanceof ApiError) {
        return NextResponse.json(
          errorEnvelope(error.code, error.message, error.details ?? null),
          { status: error.status }
        );
      }

      console.error(error);
      return NextResponse.json(
        errorEnvelope("INTERNAL_ERROR", "Error interno del servidor"),
        { status: 500 }
      );
    }
  };
}
