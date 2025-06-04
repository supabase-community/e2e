import { test as setup, expect } from "@playwright/test";

const authFile = "playwright/.auth/user.json";
const baseUrl = process.env.SUPABASE_BASE_URL || "https://supabase.com";

setup("authenticate", async ({ page }) => {
  // Navigate to login page
  await page.goto(`${baseUrl}/dashboard/sign-in`);

  // Fill in your credentials
  await page.fill(
    'input[type="email"]',
    process.env.SUPABASE_EMAIL || "pcopplestone",
  );
  await page.fill(
    'input[type="password"]',
    process.env.SUPABASE_PASSWORD || "",
  );

  // Click sign in button
  await page.getByRole("button", { name: "Sign In" }).click();

  // Wait for successful login (navigate away from sign-in page)
  await expect(page).toHaveURL(/\/dashboard(?!\/sign-in)/);

  // Save signed-in state
  await page.context().storageState({ path: authFile });
});
