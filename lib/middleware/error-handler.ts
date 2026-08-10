import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@/app/generated/prisma/client";
import { ApiError } from "@/lib/errors";

type RouteContext = { params: Promise<Record<string, string>> };
type Handler = (req: NextRequest, context: RouteContext) => Promise<NextResponse>;

function errorEnvelope(code: string, message: string, details: unknown = null) {
  return { success: false, error: { code, message, details } };
}

// With the @prisma/adapter-pg driver adapter (Prisma 7), Postgres errors that
// aren't recognized by Prisma's own query engine (e.g. FK/unique violations
// raised directly by Postgres) surface as P2039 with the real Postgres
// SQLSTATE nested at error.meta.driverAdapterError.cause.code, instead of the
// classic P2002/P2003 codes. Read the SQLSTATE from there as a fallback.
function postgresErrorCode(error: Prisma.PrismaClientKnownRequestError): string | undefined {
  const meta = error.meta as { driverAdapterError?: { cause?: { code?: string } } } | undefined;
  return meta?.driverAdapterError?.cause?.code;
}

const FOREIGN_KEY_VIOLATION_CODES = new Set(["23001", "23503"]);
const UNIQUE_VIOLATION_CODES = new Set(["23505"]);

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

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const pgCode = postgresErrorCode(error);

        if (error.code === "P2003" || (pgCode && FOREIGN_KEY_VIOLATION_CODES.has(pgCode))) {
          return NextResponse.json(
            errorEnvelope(
              "FOREIGN_KEY_CONSTRAINT",
              "This record can't be deleted because other records still reference it"
            ),
            { status: 409 }
          );
        }
        if (error.code === "P2002" || (pgCode && UNIQUE_VIOLATION_CODES.has(pgCode))) {
          return NextResponse.json(
            errorEnvelope("UNIQUE_CONSTRAINT", "A record with that value already exists"),
            { status: 409 }
          );
        }
        if (error.code === "P2025") {
          return NextResponse.json(errorEnvelope("NOT_FOUND", "Record not found"), { status: 404 });
        }
      }

      console.error(error);
      return NextResponse.json(
        errorEnvelope("INTERNAL_ERROR", "Error interno del servidor"),
        { status: 500 }
      );
    }
  };
}
