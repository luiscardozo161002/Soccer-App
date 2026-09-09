import type { PrismaClient } from "../../app/generated/prisma/client";

export interface FieldSeed {
  name: string;
  location: string;
  status: "active" | "inactive";
}

export const FIELDS: FieldSeed[] = [
  { name: "Conejos", location: "https://maps.app.goo.gl/mtUPJHBnd6HtEPZ36", status: "active" },
  { name: "Ejidal bomintzhá", location: "https://maps.app.goo.gl/vZ9nYgyiXScWKTLY8", status: "active" },
  { name: "El carmen", location: "https://maps.app.goo.gl/NXAiXoCbiaa7MhUL9", status: "active" },
  { name: "El salto", location: "https://maps.app.goo.gl/1Sn4rFigiCm5nwPK6", status: "active" },
  { name: "Jorobas", location: "https://share.google/0mjBpDoEaeC0zRd4u", status: "active" },
  { name: "La 21", location: "https://maps.app.goo.gl/4YDgmi9VPpNDAqyZ6", status: "active" },
  { name: "La calandria", location: "https://maps.app.goo.gl/EcQ61Td8DBDeq98K6", status: "active" },
  { name: "La Cañada", location: "https://maps.app.goo.gl/tMB6tJCC3Gmmh1fB8", status: "active" },
  { name: "La Loma", location: "https://maps.app.goo.gl/ZRcc3MJctRXP4Mmu8", status: "active" },
  { name: "La Loma C-2", location: "https://maps.app.goo.gl/ZRcc3MJctRXP4Mmu8", status: "active" },
  { name: "La palma 2da Seccion del Llano", location: "https://maps.app.goo.gl/VEo7sEuaLQJqqfHn9", status: "active" },
  { name: "Las vias, Dengui", location: "https://maps.app.goo.gl/jVwy1gSq1J8ngpxt9", status: "active" },
  { name: "Monte alegre", location: "https://maps.app.goo.gl/Z8zs1c3ZLgbkz7Eq9", status: "active" },
  { name: "Montecillo", location: "https://maps.app.goo.gl/mpNTT9MY4VmtRJkN8", status: "active" },
  { name: "Nantzha", location: "https://maps.app.goo.gl/QCSoU39TvGuX92yF9", status: "active" },
  { name: "Pueblo Nuevo", location: "https://maps.app.goo.gl/fkmDjxWfG19UJ7ZZ8", status: "active" },
  { name: "San Jose Acoculco", location: "https://maps.app.goo.gl/QTMMCFTMukazdNHv5", status: "active" },
  { name: "San Lucas", location: "https://maps.app.goo.gl/qc8LmJeGJVoFpv8j7", status: "active" },
  { name: "San Marcos", location: "https://maps.app.goo.gl/aush2mdkXyiGj4FV8", status: "active" },
  { name: "San Pablo", location: "https://maps.app.goo.gl/kDLcyycEGoHDgctT9", status: "active" },
];

export async function seedFields(prisma: PrismaClient) {
  let created = 0;
  let skipped = 0;

  for (const f of FIELDS) {
    const existing = await prisma.field.findFirst({ where: { name: f.name } });
    if (!existing) {
      await prisma.field.create({ data: { name: f.name, location: f.location, status: f.status } });
      created++;
    } else {
      skipped++;
    }
  }

  return { created, skipped };
}
