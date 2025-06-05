/**
 * Database Health Check API Test
 * 
 * This test validates that the Supabase database is accessible and responding
 * correctly through the API. It performs a simple readonly query to ensure:
 * 
 * 1. Authentication is working (valid access token)
 * 2. Database connection is healthy
 * 3. Query endpoint is operational
 * 
 * This serves as a basic smoke test for the database API functionality.
 */

import { test, expect } from "@playwright/test";

// Environment configuration - these should be set in your .env file
const baseApiUrl = process.env.SUPABASE_BASE_API_URL || "https://api.supabase.com";
const projectRef = process.env.SUPABASE_PROJECT_REF || "";
const accessToken = process.env.SUPABASE_ACCESS_TOKEN || "";

test("Database health check via API", async ({ request }) => {
  // Skip test if required environment variables are missing
  test.skip(
    !projectRef || !accessToken, 
    'Missing SUPABASE_PROJECT_REF or SUPABASE_ACCESS_TOKEN environment variables'
  );

  // Construct the database query endpoint URL
  const queryEndpoint = `${baseApiUrl}/v1/projects/${projectRef}/database/query`;
  
  // Execute a simple health check query
  // SELECT 1 is a minimal query that tests database connectivity without side effects
  const response = await request.post(queryEndpoint, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    data: {
      query: "SELECT 1 as health_check",
      read_only: true, // Ensure this is a safe, non-destructive operation
    },
  });

  // Verify the request was successful (201 Created is expected for query operations)
  expect(response.status()).toBe(201);

  // Verify we received a valid response body
  const responseData = await response.json();
  expect(responseData).toBeDefined();
  
  // The response should contain our health check result
  // In a real implementation, you might want to verify the actual data structure
  // Example: expect(responseData.rows).toHaveLength(1);
});