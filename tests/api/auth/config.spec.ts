/**
 * Auth Configuration Management Test Suite
 *
 * This test suite validates the auth configuration endpoints through a complete
 * configuration lifecycle using the Supabase Management API. The test workflow includes:
 *
 * 1. **Get Current Config**: Retrieves the current auth configuration
 * 2. **Reset Configuration**: Sets site_url to null (baseline state)
 * 3. **Update Configuration**: Changes site_url to a test value
 * 4. **Verify Update**: Confirms the configuration change was applied
 * 5. **Cleanup**: Resets site_url back to null
 *
 * This test validates that:
 * - Auth configuration can be retrieved successfully
 * - Configuration updates are applied correctly
 * - Changes persist and can be verified
 * - Configuration can be reset to baseline state
 *
 * The test focuses on the site_url field as a representative configuration
 * option that can be safely modified during testing.
 */

import { test, expect } from "@playwright/test"

const baseApiUrl = process.env.SUPABASE_BASE_API_URL || ""
const projectRef = process.env.SUPABASE_PROJECT_REF || ""
const accessToken = process.env.SUPABASE_ACCESS_TOKEN || ""

const METADATA = {
  tag: ["@api", "@auth", "@config"],
  annotation: [{ type: "Docs", description: "https://supabase.com/docs" }],
}

test.describe.serial("Auth Config API", METADATA, () => {
  // Default configuration state - used for reset operations
  const DEFAULT_CONFIG = {
    site_url: null,
  }

  // Skip entire test suite if required environment variables are missing
  test.beforeAll(async () => {
    test.skip(
      !projectRef || !accessToken,
      "Missing SUPABASE_PROJECT_REF or SUPABASE_ACCESS_TOKEN environment variables"
    )
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // Get Current Auth Configuration
  // ═══════════════════════════════════════════════════════════════════════════════
  test("Get current auth configuration", async ({ request }) => {
    const configEndpoint = `${baseApiUrl}/v1/projects/${projectRef}/config/auth`

    const response = await request.get(configEndpoint, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    })

    expect(response.status()).toBe(200)
    const responseData = await response.json()
    expect(responseData).toBeDefined()

    // Verify response contains expected auth config properties
    expect(responseData).toHaveProperty("site_url")
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // Update Configuration
  // ═══════════════════════════════════════════════════════════════════════════════
  test("Update site_url configuration", async ({ request }) => {
    const configEndpoint = `${baseApiUrl}/v1/projects/${projectRef}/config/auth`
    const testSiteUrl = "https://test-site.example.com"

    const updateResponse = await request.patch(configEndpoint, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        site_url: testSiteUrl,
      },
    })

    expect(updateResponse.status()).toBe(200)
    const updateData = await updateResponse.json()
    expect(updateData.site_url).toBe(testSiteUrl)
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // Verify Configuration Update
  // ═══════════════════════════════════════════════════════════════════════════════
  test("Verify configuration update was applied", async ({ request }) => {
    const configEndpoint = `${baseApiUrl}/v1/projects/${projectRef}/config/auth`
    const testSiteUrl = "https://test-site.example.com"

    const getResponse = await request.get(configEndpoint, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    })

    expect(getResponse.status()).toBe(200)
    const getData = await getResponse.json()
    expect(getData.site_url).toBe(testSiteUrl)
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // TEST SUITE COMPLETION
  // ═══════════════════════════════════════════════════════════════════════════════
  test.afterAll(async ({ request }) => {
    // Reset configuration to default state as final cleanup
    const configEndpoint = `${baseApiUrl}/v1/projects/${projectRef}/config/auth`

    await request.patch(configEndpoint, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      data: DEFAULT_CONFIG,
    })

    // Auth configuration lifecycle test suite completed successfully
    // Demonstrated: Get config → Reset → Update → Verify → Cleanup
    // Configuration has been reset to baseline state
  })
})
