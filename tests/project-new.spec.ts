import { test, expect } from "@playwright/test";

const baseUrl = process.env.SUPABASE_BASE_URL || "https://supabase.com";
const orgRef = process.env.SUPABASE_ORG_REF || "";

test("Launching a new project", async ({ page }) => {
  await page.goto(`${baseUrl}/dashboard/org/${orgRef}`);

  // Expect a "new project" link to be visible
  await expect(page.getByRole("link", { name: /new project/i })).toBeVisible();
});
