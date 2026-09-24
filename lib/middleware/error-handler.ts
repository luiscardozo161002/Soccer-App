import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import { ApiError } from "@/lib/errors";
import { logger } from "@/lib/observability/logger";

type RouteContext = { params: Promise<Record<string, string>> };
type Handler = (req: NextRequest, context: RouteContext) => Promise<NextResponse>;

function errorEnvelope(code: string, message: string, details: unknown = null) {
  return { success: false, error: { code, message, details } };
}

function postgresErrorCode(error: Prisma.PrismaClientKnownRequestError): string | undefined {
  const meta = error.meta as { driverAdapterError?: { cause?: { code?: string } } } | undefined;
  return meta?.driverAdapterError?.cause?.code;
}

const FOREIGN_KEY_VIOLATION_CODES = new Set(["23001", "23503"]);
const UNIQUE_VIOLATION_CODES = new Set(["23505"]);

export function withErrorHandling(handler: Handler): Handler {
  return async (req, context) => {
    const requestId = req.headers.get("x-request-id") ?? randomUUID();
    const startedAt = performance.now();

    const finish = (response: NextResponse) => {
      response.headers.set("x-request-id", requestId);
      logger.info("http.request.completed", {
        requestId,
        method: req.method,
        path: req.nextUrl.pathname,
        status: response.status,
        durationMs: Math.round(performance.now() - startedAt),
      });
      return response;
    };

    try {
      return finish(await handler(req, context));
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        return finish(NextResponse.json(
          errorEnvelope("VALIDATION_ERROR", "Request inválida", details),
          { status: 422 }
        ));
      }

      if (error instanceof ApiError) {
        return finish(NextResponse.json(
          errorEnvelope(error.code, error.message, error.details ?? null),
          { status: error.status }
        ));
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const pgCode = postgresErrorCode(error);

        if (error.code === "P2003" || (pgCode && FOREIGN_KEY_VIOLATION_CODES.has(pgCode))) {
          return finish(NextResponse.json(
            errorEnvelope(
              "FOREIGN_KEY_CONSTRAINT",
              "This record can't be deleted because other records still reference it"
            ),
            { status: 409 }
          ));
        }
        if (error.code === "P2002" || (pgCode && UNIQUE_VIOLATION_CODES.has(pgCode))) {
          return finish(NextResponse.json(
            errorEnvelope("UNIQUE_CONSTRAINT", "A record with that value already exists"),
            { status: 409 }
          ));
        }
        if (error.code === "P2025") {
          return finish(NextResponse.json(errorEnvelope("NOT_FOUND", "Record not found"), { status: 404 }));
        }
      }

      logger.error("http.request.failed", {
        requestId,
        method: req.method,
        path: req.nextUrl.pathname,
        error,
      });
      return finish(NextResponse.json(
        errorEnvelope("INTERNAL_ERROR", "Error interno del servidor"),
        { status: 500 }
      ));
    }
  };
}
