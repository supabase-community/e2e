import { test, expect } from "@playwright/test";

const baseUrl = process.env.SUPABASE_BASE_URL || "https://supabase.com";
const projectRef = process.env.SUPABASE_PROJECT_REF || "";

test("Table Editor is visible", async ({ page }) => {
  await page.goto(`${baseUrl}/dashboard/project/${projectRef}`);

  // Click the Table Editor link in the sidebar
  await page.getByRole("link", { name: /table editor/i }).click();

  // Verify we're on the table editor page
  await expect(page).toHaveURL(
    new RegExp(`/dashboard/project/${projectRef}/editor`),
  );
});
