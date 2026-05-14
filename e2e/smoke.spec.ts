import { test, expect } from "@playwright/test"

test("homepage carrega sem erros", async ({ page }) => {
  await page.goto("/")
  await expect(page).toHaveTitle(/AXON/)
  await expect(page.getByRole("banner")).toBeVisible()
})

test("hero section está visível", async ({ page }) => {
  await page.goto("/")
  await expect(page.locator("h1")).toBeVisible()
})

test("footer tem links esperados", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("contentinfo")).toBeVisible()
})
