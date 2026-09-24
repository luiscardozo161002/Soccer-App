import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/settings", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { name: "Liga de prueba", logoType: null } }),
    })
  );
});

test("login form remains visible and validates required fields", async ({ page }) => {
  const clientSettingsLoaded = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/v1/settings" && response.status() === 200
  );
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await clientSettingsLoaded;

  await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
  await expect(page.getByLabel("Usuario o correo")).toBeVisible();
  await expect(page.locator('input[name="password"]')).toBeVisible();
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("Ingresa tu usuario o correo")).toBeVisible();
  await expect(page.getByText("Ingresa tu contraseña")).toBeVisible();
});

test("admin pages redirect unauthenticated users to login", async ({ page }) => {
  await page.goto("/admin/players", { waitUntil: "domcontentloaded" });

  await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Fplayers$/);
  await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
});
