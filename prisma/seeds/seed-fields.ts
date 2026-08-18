import type { PrismaClient } from "../../app/generated/prisma/client";
import { readJson } from "./read-json";
import type { FieldSeed } from "./types";

export async function seedFields(prisma: PrismaClient) {
  const fieldsData = readJson<FieldSeed[]>("fields.json");
  const fieldsByName = new Map<string, string>();
  for (const f of fieldsData) {
    const field = await prisma.field.create({ data: f });
    fieldsByName.set(f.name, field.id);
  }
  return fieldsByName;
}
