import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPlayerSchema, updatePlayerSchema } from "../player.schema";

const mocks = vi.hoisted(() => ({
  findTeam: vi.fn(),
  findPlayer: vi.fn(),
  findByFolio: vi.fn(),
  findByName: vi.fn(),
  createPlayer: vi.fn(),
  updatePlayer: vi.fn(),
}));

vi.mock("@/modules/teams/server/team.repository", () => ({
  teamRepository: { findById: mocks.findTeam },
}));
vi.mock("./player.repository", () => ({
  playerRepository: {
    findById: mocks.findPlayer,
    findByRegistrationNumber: mocks.findByFolio,
    findByNameInsensitive: mocks.findByName,
    create: mocks.createPlayer,
    update: mocks.updatePlayer,
  },
}));

import { playerService } from "./player.service";

const teamId = "00000000-0000-4000-8000-000000000001";
const otherTeamId = "00000000-0000-4000-8000-000000000002";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.findTeam.mockResolvedValue({ id: teamId, name: "Tigres", folioPrefix: "TIG" });
  mocks.findByFolio.mockResolvedValue(null);
  mocks.findByName.mockResolvedValue(null);
  mocks.createPlayer.mockImplementation(async (data) => data);
  mocks.updatePlayer.mockImplementation(async (_id, data) => data);
});

describe("unique player names", () => {
  it("rejects a name already registered on any team", async () => {
    mocks.findByName.mockResolvedValue({ id: "other-player" });

    await expect(playerService.create({ teamId, name: "Carlos Pérez", folioNumber: "008" })).rejects.toMatchObject({
      status: 409,
      code: "PLAYER_NAME_DUPLICATED",
    });
    expect(mocks.findByName).toHaveBeenCalledWith("Carlos Pérez");
    expect(mocks.createPlayer).not.toHaveBeenCalled();
  });

  it("allows keeping the same name when editing its owner", async () => {
    mocks.findPlayer.mockResolvedValue({ id: "player-1", teamId, name: "Carlos Pérez", registrationNumber: "TIG-008" });
    mocks.findByName.mockResolvedValue({ id: "player-1" });

    await playerService.update("player-1", { name: "Carlos Pérez" });

    expect(mocks.updatePlayer).toHaveBeenCalledWith("player-1", expect.objectContaining({ name: "Carlos Pérez" }));
  });

  it("rejects renaming a player to someone else's name", async () => {
    mocks.findPlayer.mockResolvedValue({ id: "player-1", teamId, name: "Carlos Pérez", registrationNumber: "TIG-008" });
    mocks.findByName.mockResolvedValue({ id: "other-player" });

    await expect(playerService.update("player-1", { name: "Luis García" })).rejects.toMatchObject({
      status: 409,
      code: "PLAYER_NAME_DUPLICATED",
    });
    expect(mocks.updatePlayer).not.toHaveBeenCalled();
  });
});

describe("player folios", () => {
  it("requires only digits and preserves leading zeros", async () => {
    const dto = createPlayerSchema.parse({ teamId, name: "Jugador", folioNumber: "001" });
    await playerService.create(dto);

    expect(mocks.findByFolio).toHaveBeenCalledWith("TIG-001");
    expect(mocks.createPlayer).toHaveBeenCalledWith(
      expect.objectContaining({ registrationNumber: "TIG-001" })
    );
    expect(createPlayerSchema.safeParse({ teamId, name: "Jugador", folioNumber: "1A" }).success).toBe(false);
    expect(createPlayerSchema.safeParse({ teamId, name: "Jugador", folioNumber: "" }).success).toBe(false);
    expect(updatePlayerSchema.safeParse({ folioNumber: "TIG-001" }).success).toBe(false);
  });

  it("rejects an existing folio", async () => {
    mocks.findByFolio.mockResolvedValue({ id: "another-player" });

    await expect(
      playerService.create({ teamId, name: "Jugador", folioNumber: "001" })
    ).rejects.toMatchObject({ status: 409, code: "REGISTRATION_NUMBER_DUPLICATED" });
    expect(mocks.createPlayer).not.toHaveBeenCalled();
  });

  it("keeps the digits and changes the prefix when moving teams", async () => {
    mocks.findPlayer.mockResolvedValue({ id: "player-1", teamId, registrationNumber: "TIG-007" });
    mocks.findTeam.mockResolvedValue({ id: otherTeamId, name: "Leones", folioPrefix: "LEO" });

    await playerService.update("player-1", { teamId: otherTeamId });

    expect(mocks.findByFolio).toHaveBeenCalledWith("LEO-007");
    expect(mocks.updatePlayer).toHaveBeenCalledWith("player-1", {
      teamId: otherTeamId,
      name: undefined,
      birthDate: undefined,
      registrationNumber: "LEO-007",
    });
  });

  it("allows a player to keep their own folio without recomputing it", async () => {
    mocks.findPlayer.mockResolvedValue({ id: "player-1", teamId, registrationNumber: "TIG-007" });

    const result = await playerService.update("player-1", { folioNumber: "007" });

    expect(result).not.toHaveProperty("registrationNumber");
    expect(mocks.findByFolio).not.toHaveBeenCalled();
  });

  it("does not require the team's folio prefix to save unrelated fields", async () => {
    mocks.findPlayer.mockResolvedValue({ id: "player-1", teamId, registrationNumber: "TIG-007" });
    mocks.findTeam.mockResolvedValue({ id: teamId, name: "Tigres", folioPrefix: null });

    await expect(playerService.update("player-1", { name: "Nuevo nombre" })).resolves.not.toHaveProperty(
      "registrationNumber"
    );
    expect(mocks.findTeam).not.toHaveBeenCalled();
  });
});
