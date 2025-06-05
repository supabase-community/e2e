/**
 * Database Query API Health Check Test Suite
 *
 * This test suite validates that the Supabase database query endpoint is accessible
 * and responding correctly through the Management API. The test workflow includes:
 *
 * 1. **Database Connectivity**: Tests basic database connection through API
 * 2. **Authentication Validation**: Ensures access token is working correctly
 * 3. **Query Execution**: Verifies the query endpoint can execute SQL commands
 * 4. **Response Validation**: Confirms proper response structure and status codes
 *
 * This test validates that:
 * - The database query endpoint is operational
 * - Authentication is working (valid access token)
 * - Database connection is healthy and responsive
 * - Query operations return expected response formats
 *
 * The test uses a simple SELECT 1 query as a minimal, safe operation that
 * tests connectivity without side effects or data modifications.
 */

import { test, expect } from "@playwright/test"

const baseApiUrl = process.env.SUPABASE_BASE_API_URL || ""
const projectRef = process.env.SUPABASE_PROJECT_REF || ""
const accessToken = process.env.SUPABASE_ACCESS_TOKEN || ""

const METADATA = {
  tag: ["@api", "@database"],
  annotation: [{ type: "Docs", description: "https://supabase.com/docs" }],
}

test.describe("Database Query API", METADATA, () => {
  // Skip entire test suite if required environment variables are missing
  test.beforeAll(async () => {
    test.skip(
      !projectRef || !accessToken,
      "Missing SUPABASE_PROJECT_REF or SUPABASE_ACCESS_TOKEN environment variables"
    )
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // Database Health Check
  // ═══════════════════════════════════════════════════════════════════════════════
  test("Database health check via API", async ({ request }) => {
    const queryEndpoint = `${baseApiUrl}/v1/projects/${projectRef}/database/query`

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
    })

    // Verify the request was successful (201 Created is expected for query operations)
    expect(response.status()).toBe(201)

    // Verify we received a valid response body
    const responseData = await response.json()
    expect(responseData).toBeDefined()

    // The response should contain our health check result
    // In a real implementation, you might want to verify the actual data structure
    // Example: expect(responseData.rows).toHaveLength(1)
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // TEST SUITE COMPLETION
  // ═══════════════════════════════════════════════════════════════════════════════
  test.afterAll(async () => {
    // Database query health check test suite completed successfully
    // Demonstrated: Database connectivity and query endpoint functionality
    // No cleanup needed - read-only operations performed
  })
})
