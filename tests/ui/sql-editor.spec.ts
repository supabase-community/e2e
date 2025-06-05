import { test, expect } from "@playwright/test"

const baseUrl = process.env.SUPABASE_BASE_URL || "https://supabase.com"
const projectRef = process.env.SUPABASE_PROJECT_REF || ""

test("SQL Editor is visible", async ({ page }) => {
  await page.goto(`${baseUrl}/dashboard/project/${projectRef}`)

  // Click the SQL Editor link in the sidebar
  await page.getByRole("link", { name: /sql editor/i }).click()

  // Verify we're on the SQL editor page
  await expect(page).toHaveURL(
    new RegExp(`/dashboard/project/${projectRef}/sql`)
  )
})
