import { test, expect } from "@playwright/test"

const baseUrl = process.env.SUPABASE_BASE_URL || "https://supabase.com"
const orgRef = process.env.SUPABASE_ORG_REF || ""

test("Launching a new project", async ({ page }) => {
  await page.goto(`${baseUrl}/dashboard/organizations`)

  // Check that "Your Organizations" header is visible
  await expect(
    page.getByRole("heading", { name: /your organizations/i })
  ).toBeVisible()
})
