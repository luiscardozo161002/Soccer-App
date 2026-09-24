import "dotenv/config";
import { randomBytes, randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import pg from "pg";
import { hashPassword } from "../lib/auth/password";

test.skip(process.env.SOCCER_LOCAL_DATA_TEST !== "1", "Run only against an explicitly selected local database");

type ApiResult<T> = {
  status: number;
  contentType: string | null;
  body: { data?: T; error?: { code: string } } | null;
};

test("real local data: modules, writes, permissions and session renewal", async ({ page }) => {
  test.setTimeout(420_000);
  const suffix = randomUUID().slice(0, 8);
  const password = randomBytes(16).toString("hex");
  const username = `e2e_${suffix}`;
  const created: Record<string, string> = {};
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL });

  async function api<T = unknown>(method: string, path: string, body?: unknown): Promise<ApiResult<T>> {
    return page.evaluate(async ({ method, path, body }) => {
      const response = await fetch(path, {
        method,
        headers: body === undefined ? undefined : { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const contentType = response.headers.get("Content-Type");
      return {
        status: response.status,
        contentType,
        body: response.status === 204 || !contentType?.includes("application/json") ? null : await response.json(),
      };
    }, { method, path, body }) as Promise<ApiResult<T>>;
  }

  try {
    await db.connect();
    const usedPrefixes = new Set(
      (await db.query<{ folio_prefix: string | null }>("SELECT folio_prefix FROM teams")).rows.map((team) => team.folio_prefix)
    );
    const prefixes = Array.from({ length: 100 }, (_, index) => `Z${String(index).padStart(2, "0")}`)
      .filter((prefix) => !usedPrefixes.has(prefix)).slice(0, 3);
    expect(prefixes).toHaveLength(3);

    created.user = randomUUID();
    await db.query(
      "INSERT INTO users (id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, 'admin')",
      [created.user, username, `${username}@example.invalid`, hashPassword(password)]
    );
    created.referee = randomUUID();
    await db.query(
      "INSERT INTO users (id, username, email, password_hash, role) VALUES ($1, $2, $3, $4, 'arbitro')",
      [created.referee, `${username}_ref`, `${username}_ref@example.invalid`, hashPassword(password)]
    );

    await page.goto("/login");
    await page.evaluate(() => fetch("/api/v1/auth/login").then((response) => response.status));
    await page.getByLabel("Usuario o correo").fill(username);
    await page.locator('input[name="password"]').fill(password);
    const loginResponse = page.waitForResponse((response) => response.url().endsWith("/api/v1/auth/login"));
    await page.getByRole("button", { name: "Entrar" }).click();
    expect((await loginResponse).status()).toBe(200);
    await expect(page).toHaveURL(/\/admin/, { timeout: 30_000 });
    expect((await page.context().cookies()).some((cookie) => cookie.name === "session_refresh")).toBe(true);

    for (const path of [
      "/api/v1/teams", "/api/v1/fields", "/api/v1/players", "/api/v1/matches",
      "/api/v1/cards", "/api/v1/sanctions", "/api/v1/seasons", "/api/v1/standings",
      "/api/v1/settings", "/api/v1/users", "/api/v1/card-reason-configs",
    ]) {
      expect((await api("GET", path)).status, path).toBe(200);
    }

    const team1 = await api<{ id: string }>("POST", "/api/v1/teams", {
      name: `E2E equipo ${suffix} A`, folioPrefix: prefixes[0], category: "primera_division",
    });
    expect(team1.status).toBe(201);
    created.team1 = team1.body!.data!.id;
    const team2 = await api<{ id: string }>("POST", "/api/v1/teams", {
      name: `E2E equipo ${suffix} B`, folioPrefix: prefixes[1], category: "primera_division",
    });
    expect(team2.status).toBe(201);
    created.team2 = team2.body!.data!.id;
    const team3 = await api<{ id: string }>("POST", "/api/v1/teams", {
      name: `E2E equipo ${suffix} C`, folioPrefix: prefixes[2], category: "segunda_division",
    });
    expect(team3.status).toBe(201);
    created.team3 = team3.body!.data!.id;
    expect((await api("PATCH", `/api/v1/teams/${created.team1}`, { name: `E2E equipo ${suffix} A editado` })).status).toBe(200);

    const field = await api<{ id: string }>("POST", "/api/v1/fields", { name: `E2E cancha ${suffix}` });
    expect(field.status).toBe(201);
    created.field = field.body!.data!.id;
    expect((await api("PATCH", `/api/v1/fields/${created.field}`, { location: "Prueba local" })).status).toBe(200);

    const player = await api<{ id: string }>("POST", "/api/v1/players", {
      teamId: created.team1, name: `E2E jugador ${suffix}`, folioNumber: "001",
    });
    expect(player.status).toBe(201);
    created.player = player.body!.data!.id;
    const duplicate = await api("POST", "/api/v1/players", {
      teamId: created.team2, name: `E2E jugador ${suffix}`, folioNumber: "002",
    });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body?.error?.code).toBe("PLAYER_NAME_DUPLICATED");
    expect((await api("PATCH", `/api/v1/players/${created.player}`, { folioNumber: "003" })).status).toBe(200);

    await page.goto("/admin/players");
    await page.getByRole("button", { name: `Editar E2E jugador ${suffix}` }).click();
    const editForm = page.locator("form").filter({ has: page.getByLabel("Dígitos del folio") });
    await editForm.getByRole("button", { name: "Editar", exact: true }).click();
    await editForm.getByLabel("Categoría").selectOption("segunda_division");
    await expect(editForm.getByLabel("Equipo")).toHaveValue("");
    await expect(editForm.getByLabel("Equipo").getByRole("option", { name: `E2E equipo ${suffix} C` })).toBeAttached();
    await expect(editForm.getByLabel("Equipo").getByRole("option", { name: `E2E equipo ${suffix} A editado` })).toHaveCount(0);
    await editForm.getByLabel("Equipo").selectOption(created.team3);
    await expect(editForm.getByLabel("Equipo")).toHaveValue(created.team3);
    await expect(editForm.getByLabel("Dígitos del folio")).toHaveValue("003");
    await expect(editForm.getByRole("button", { name: "Guardar cambios" })).toBeEnabled();
    const saveResponse = page.waitForResponse(
      (response) => response.url().endsWith(`/api/v1/players/${created.player}`) && response.request().method() === "PATCH",
      { timeout: 30_000 }
    );
    await editForm.getByRole("button", { name: "Guardar cambios" }).click();
    expect((await saveResponse).status()).toBe(200);
    await expect(page.getByRole("heading", { name: "Editar jugador" })).toBeHidden({ timeout: 30_000 });
    const movedPlayer = await api<{ teamId: string; registrationNumber: string }>("GET", `/api/v1/players/${created.player}`);
    expect(movedPlayer.status).toBe(200);
    expect(movedPlayer.body?.data).toMatchObject({ teamId: created.team3, registrationNumber: `${prefixes[2]}-003` });
    expect((await api("PATCH", `/api/v1/players/${created.player}`, { teamId: created.team1 })).status).toBe(200);

    const match = await api<{ id: string }>("POST", "/api/v1/matches", {
      homeTeamId: created.team1, awayTeamId: created.team2, fieldId: created.field,
      matchday: 99, date: "2030-01-01T00:00:00.000Z", time: "12:00",
    });
    expect(match.status).toBe(201);
    created.match = match.body!.data!.id;
    expect((await api("PATCH", `/api/v1/matches/${created.match}`, {
      homeTeamId: created.team2, awayTeamId: created.team1,
    })).status).toBe(200);

    const reason = `E2E motivo ${suffix}`;
    const config = await api<{ id: string }>("POST", "/api/v1/card-reason-configs", {
      cardType: "red", reason, amount: 100,
    });
    expect(config.status).toBe(201);
    created.reason = config.body!.data!.id;
    const card = await api<{ id: string }>("POST", "/api/v1/cards", {
      playerId: created.player, matchId: created.match,
      type: "red", detail: reason, matchesSuspended: 1,
    });
    expect(card.status).toBe(201);
    created.card = card.body!.data!.id;
    const sanctions = await api<Array<{ id: string }>>("GET", `/api/v1/sanctions?cardId=${created.card}`);
    expect(sanctions.status).toBe(200);
    expect(sanctions.body!.data).toHaveLength(1);
    created.sanction = sanctions.body!.data![0].id;
    expect((await api("PATCH", `/api/v1/sanctions/${created.sanction}`, { matchesSuspended: 2 })).status).toBe(200);
    expect(await api("POST", `/api/v1/cards/${created.card}/pay`, {})).toMatchObject({ status: 200 });

    await page.context().addCookies([{
      name: "session", value: "expired-access-token", url: "http://127.0.0.1:3137", httpOnly: true, sameSite: "Lax",
    }]);
    await page.goto("/admin/players");
    await expect(page.getByRole("alertdialog", { name: "Tu sesión venció" })).toBeVisible();
    const refreshResponse = page.waitForResponse((response) => response.url().endsWith("/api/v1/auth/refresh"));
    await page.getByRole("button", { name: "Continuar" }).click();
    const renewal = await refreshResponse;
    expect(renewal.status()).toBe(200);
    await expect(page.getByRole("alertdialog", { name: "Tu sesión venció" })).toBeHidden({ timeout: 60_000 });
    expect((await api("GET", "/api/v1/users")).status).toBe(200);

    expect((await api("POST", "/api/v1/auth/logout", {})).status).toBe(200);
    expect((await api("POST", "/api/v1/auth/refresh", {})).status).toBe(401);
    expect((await api("GET", "/api/v1/users")).status).toBe(401);
    await page.goto("/login");
    expect((await api("POST", "/api/v1/auth/login", {
      username: `${username}_ref`, password,
    })).status).toBe(200);
    expect((await api("GET", "/api/v1/users")).status).toBe(403);
    expect((await api("POST", "/api/v1/teams", {
      name: "No autorizado", folioPrefix: "Z99",
    })).status).toBe(403);
    expect((await api("GET", `/api/v1/users/${created.user}/photo`)).status).toBe(403);
    await page.goto("/admin/settings");
    await expect(page).toHaveURL(/\/admin\/my-matches$/);
    await page.goto("/admin/players");
    await expect(page).toHaveURL(/\/admin\/my-matches$/);
  } finally {
    try {
      await db.query("BEGIN");
      for (const [table, id] of [
        ["sanctions", created.sanction], ["cards", created.card], ["matches", created.match],
        ["players", created.player], ["teams", created.team1], ["teams", created.team2], ["teams", created.team3],
        ["fields", created.field], ["card_reason_configs", created.reason],
        ["users", created.referee], ["users", created.user],
      ] as const) {
        if (id) await db.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
      }
      await db.query("COMMIT");
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    } finally {
      await db.end();
    }
  }
});
