import type { LeagueCategory, PrismaClient } from "../../app/generated/prisma/client";

export interface TeamSeed {
  name: string;
  category: LeagueCategory;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
}

export const TEAMS: TeamSeed[] = (
  [
    // División de Ascenso
    ["RUTA 7", "division_ascenso", 6, 6, 0, 0, 26, 5],
    ["PUMAS NANTZHA", "division_ascenso", 6, 4, 1, 1, 23, 12],
    ["DEPORTIVO EL 61", "division_ascenso", 6, 4, 0, 2, 16, 14],
    ["DEPORTIVO BARCELONA", "division_ascenso", 6, 3, 2, 1, 21, 15],
    ["DEPORTIVO CELTA", "division_ascenso", 6, 3, 1, 2, 17, 11],
    ["COMBINADO SAN IDELFONSO", "division_ascenso", 5, 3, 1, 1, 12, 9],
    ["DEPORTIVO UNIVERSAL", "division_ascenso", 6, 3, 1, 2, 18, 22],
    ["DEPORTIVO VAQUERO", "division_ascenso", 6, 3, 0, 3, 22, 15],
    ["DEPORTIVO LA RAZA", "division_ascenso", 5, 3, 0, 2, 13, 16],
    ["DEPORTIVO CAMPESINOS", "division_ascenso", 6, 2, 1, 3, 14, 13],
    ["DEPORTIVO COYOTES", "division_ascenso", 6, 2, 0, 4, 9, 19],
    ["ATM SAN MARCOS", "division_ascenso", 6, 1, 2, 3, 8, 12],
    ["JUVENIL SAN MIGUEL", "division_ascenso", 6, 1, 2, 3, 12, 20],
    ["DEPORTIVO SAN MARTÍN", "division_ascenso", 6, 1, 1, 4, 11, 16],
    ["SAN MARCOS UNITED", "division_ascenso", 6, 1, 1, 4, 8, 13],
    ["C.D.M.", "division_ascenso", 6, 0, 1, 5, 11, 29],

    // Primera División
    ["PUMAS SAN LUCAS", "primera_division", 6, 5, 1, 0, 22, 7],
    ["ATLÉTICO DADRID", "primera_division", 6, 4, 2, 0, 22, 10],
    ["U. ZARAGOZA", "primera_division", 5, 4, 1, 0, 15, 10],
    ["ATLÉTICO BOMINTZHÁ", "primera_division", 6, 4, 1, 1, 15, 13],
    ["LOGÍSTICA FALCÓN", "primera_division", 6, 4, 0, 2, 19, 6],
    ["CHIVAS TULA", "primera_division", 6, 4, 0, 2, 23, 17],
    ["CLUB SAN PABLO", "primera_division", 6, 3, 2, 1, 21, 14],
    ["DEP. BOMINTZHÁ", "primera_division", 6, 3, 0, 3, 12, 7],
    ["DEP. RANGER'S", "primera_division", 6, 2, 2, 2, 15, 18],
    ["REAL FAMILIAR EL CANAL", "primera_division", 6, 2, 1, 3, 15, 20],
    ["DEP. LA LÍNEA", "primera_division", 5, 2, 0, 3, 9, 18],
    ["DEP. SAN ISIDRO", "primera_division", 6, 1, 1, 4, 13, 17],
    ["DEP. ATITALAQUIA", "primera_division", 6, 1, 1, 4, 7, 16],
    ["FOOTBALL BOMINTZHÁ 2010", "primera_division", 5, 0, 1, 4, 8, 17],
    ["TOLTECA F.C.", "primera_division", 6, 0, 1, 5, 11, 22],
    ["BOCA JR. ZACAMULPA", "primera_division", 5, 0, 0, 5, 6, 21],

    // Segunda División
    ["JUVENTUS MAGDALENA", "segunda_division", 6, 5, 0, 1, 14, 7],
    ['ZARAGOZA "A"', "segunda_division", 6, 4, 0, 2, 28, 12],
    ["DEPORTIVO LA BANDITA", "segunda_division", 5, 4, 0, 1, 22, 10],
    ["DEPORTIVO CALVARIO", "segunda_division", 6, 4, 0, 2, 21, 15],
    ["PORCINOS F.C.", "segunda_division", 6, 4, 0, 2, 12, 11],
    ["PEÑAROL F.C.", "segunda_division", 5, 3, 1, 1, 23, 8],
    ["REAL SAN LORENZO F.C.", "segunda_division", 5, 3, 0, 2, 18, 16],
    ["DEPORTIVO LAS NUECES", "segunda_division", 6, 3, 0, 3, 13, 14],
    ["JUVENTUD NOGALES", "segunda_division", 6, 2, 2, 2, 18, 15],
    ['ATLÉTICO DADRID "B"', "segunda_division", 5, 2, 1, 2, 15, 12],
    ["GALLOS BLANCOS", "segunda_division", 5, 2, 1, 2, 12, 10],
    ["TLAUTLA F.C.", "segunda_division", 3, 1, 2, 0, 11, 5],
    ["DEPORTIVO RAYOS", "segunda_division", 6, 1, 1, 4, 7, 24],
    ["PUMAS MAGDALENA", "segunda_division", 5, 0, 1, 4, 9, 23],
    ["LA ROMA F.C.", "segunda_division", 6, 0, 1, 5, 16, 38],
    ["DEPORTIVO JUÁREZ", "segunda_division", 5, 0, 0, 5, 9, 28],
  ] as const
).map(([name, category, played, won, drawn, lost, goalsFor, goalsAgainst]) => ({
  name,
  category,
  played,
  won,
  drawn,
  lost,
  goalsFor,
  goalsAgainst,
}));


export async function seedTeams(prisma: PrismaClient) {
  const teamIdByName = new Map<string, string>();
  let created = 0;
  let skipped = 0;

  for (const t of TEAMS) {
    let team = await prisma.team.findFirst({ where: { name: t.name } });
    if (!team) {
      team = await prisma.team.create({ data: { name: t.name, category: t.category } });
      created++;
    } else {
      skipped++;
    }
    teamIdByName.set(t.name, team.id);
  }

  return { teamIdByName, created, skipped };
}

