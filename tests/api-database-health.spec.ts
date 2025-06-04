import { test, expect } from "@playwright/test";

const projectRef = process.env.SUPABASE_PROJECT_REF || "";
const accessToken = process.env.SUPABASE_ACCESS_TOKEN || "";

test("Database health check via API", async ({ request }) => {
  const response = await request.post(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    data: {
      query: "SELECT 1",
      read_only: true
    }
  });

  console.log('Response status:', response.status());
  console.log('Response headers:', await response.headers());
  
  if (!response.ok()) {
    const errorBody = await response.text();
    console.log('Error response body:', errorBody);
  }
  
  expect(response.ok()).toBeTruthy();
  
  const responseData = await response.json();
  expect(responseData).toBeDefined();
});