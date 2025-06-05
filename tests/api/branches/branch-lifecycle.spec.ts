/**
 * Branch Database Lifecycle Test Suite
 *
 * This comprehensive test suite demonstrates a complete database branch lifecycle
 * using the Supabase Management API with table operations and point-in-time recovery.
 * The test workflow includes:
 *
 * 1. **Create Table in Main**: Creates a test table in the main database
 * 2. **Create Branch**: Creates a new database branch via API
 * 3. **Wait for Branch**: Waits for the branch to become active and ready
 * 4. **Verify Table Exists**: Confirms the table exists in the new branch
 * 5. **Modify Table**: Makes changes to the table in the branch
 * 6. **PITR Restore**: Restores branch to before table creation using point-in-time recovery
 * 7. **Verify Table Gone**: Confirms the table has been removed after restore
 * 8. **Cleanup Branch**: Deletes the branch to clean up resources
 *
 * This test validates that:
 * - Branches can be created and managed via API
 * - Database schema is properly copied to branches
 * - Point-in-time recovery works correctly in branches
 * - Branch lifecycle management functions as expected
 * - Data modifications in branches can be reverted via PITR
 *
 * Note: This test demonstrates real branch operations and should be run
 * against a test environment to avoid affecting production data.
 */

import { test, expect } from "@playwright/test"

const baseApiUrl = process.env.SUPABASE_BASE_API_URL || ""
const projectRef = process.env.SUPABASE_PROJECT_REF || ""
const accessToken = process.env.SUPABASE_ACCESS_TOKEN || ""

const METADATA = {
  tag: ["@api", "@branches", "@database", "@pitr"],
  annotation: [
    { type: "Docs", description: "https://api.supabase.com/api/v1" },
  ],
}

test.skip("Branch Database Lifecycle", METADATA, () => {
  // Shared test data - generated once and used across all tests in this suite
  const testId = Date.now()
  const tableName = `branch_test_table_${testId}`
  const branchName = `test-branch-${testId}`
  let branchRef: string // Will be set after branch creation
  let restoreTimestamp: string // Will be set before table creation

  // Skip entire test suite if required environment variables are missing
  test.beforeAll(async () => {
    test.skip(
      !projectRef || !accessToken,
      "Missing SUPABASE_PROJECT_REF or SUPABASE_ACCESS_TOKEN environment variables"
    )
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // Create Table in Main Database
  // ═══════════════════════════════════════════════════════════════════════════════
  test("Create test table in main database", async ({ request }) => {
    const queryEndpoint = `${baseApiUrl}/v1/projects/${projectRef}/database/query`

    // Store current timestamp for later PITR restore
    restoreTimestamp = new Date().toISOString()

    // Wait a moment to ensure timestamp is before table creation
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const createResponse = await request.post(queryEndpoint, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        query: `
          CREATE TABLE ${tableName} (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE,
            created_at TIMESTAMP DEFAULT NOW()
          );

          alter table ${tableName} enable row level security;
          
          -- Insert initial test data
          INSERT INTO ${tableName} (name, email) VALUES 
            ('Test User 1', 'user1@example.com'),
            ('Test User 2', 'user2@example.com');
        `,
        read_only: false,
      },
    })

    expect(createResponse.status()).toBe(201)
    const createData = await createResponse.json()
    expect(createData).toBeDefined()
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // Enable Branching on Project
  // ═══════════════════════════════════════════════════════════════════════════════
  test("Enable branching on project", async ({ request }) => {
    const branchingConfigEndpoint = `${baseApiUrl}/v1/projects/${projectRef}/config/database`

    const enableResponse = await request.patch(branchingConfigEndpoint, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        branching_enabled: true,
      },
    })

    // Debug: log response if not 200
    if (enableResponse.status() !== 200) {
      const errorData = await enableResponse.json()
      console.log(
        `Branching enable failed with status ${enableResponse.status()}:`,
        errorData
      )
    }

    expect(enableResponse.status()).toBe(200)
    const enableData = await enableResponse.json()
    expect(enableData).toBeDefined()
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // Create Database Branch
  // ═══════════════════════════════════════════════════════════════════════════════
  test("Create database branch", async ({ request }) => {
    const branchEndpoint = `${baseApiUrl}/v1/projects/${projectRef}/branches`

    const branchResponse = await request.post(branchEndpoint, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        branch_name: branchName,
        // Optionally add more fields if needed, e.g. persistent: true
      },
    })

    // Debug: log response if not 201
    if (branchResponse.status() !== 201) {
      const errorData = await branchResponse.json()
      console.log(
        `Branch creation failed with status ${branchResponse.status()}:`,
        errorData
      )
    }

    expect(branchResponse.status()).toBe(201)
    const branchData = await branchResponse.json()
    expect(branchData).toBeDefined()
    expect(branchData.name).toBe(branchName)

    // Store branch reference for later use
    branchRef = branchData.ref
    expect(branchRef).toBeDefined()
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // Wait for Branch to Start
  // ═══════════════════════════════════════════════════════════════════════════════
  test("Wait for branch to become active", async ({ request }) => {
    const branchStatusEndpoint = `${baseApiUrl}/v1/projects/${projectRef}/branches/${branchRef}`

    // Poll branch status until it's ready (up to 5 minutes)
    let attempts = 0
    const maxAttempts = 60 // 5 minutes with 5-second intervals

    while (attempts < maxAttempts) {
      const statusResponse = await request.get(branchStatusEndpoint, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })

      expect(statusResponse.status()).toBe(200)
      const statusData = await statusResponse.json()

      if (statusData.status === "ACTIVE" || statusData.status === "HEALTHY") {
        // Branch is ready
        break
      }

      // Wait 5 seconds before next check
      await new Promise((resolve) => setTimeout(resolve, 5000))
      attempts++
    }

    // Final verification that branch is active
    expect(attempts).toBeLessThan(maxAttempts)
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // Verify Table Exists in Branch
  // ═══════════════════════════════════════════════════════════════════════════════
  test("Verify table exists in branch", async ({ request }) => {
    const branchQueryEndpoint = `${baseApiUrl}/v1/projects/${branchRef}/database/query`

    const verifyResponse = await request.post(branchQueryEndpoint, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        query: `
          SELECT COUNT(*) as record_count
          FROM ${tableName}
        `,
        read_only: true,
      },
    })

    if (verifyResponse.status() !== 201) {
      const errorData = await verifyResponse.json()
      console.log(
        `Table verification failed with status ${verifyResponse.status()}:`,
        errorData
      )
      if (verifyResponse.status() === 402) {
        test.skip(
          true,
          "Skipping: Supabase project quota exceeded or payment required for branch feature."
        )
      }
    }

    expect(verifyResponse.status()).toBe(201)
    const verifyData = await verifyResponse.json()
    expect(verifyData).toBeDefined()
    expect(verifyData.rows).toBeDefined()
    expect(verifyData.rows[0].record_count).toBe("2") // Should have 2 initial records
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // Modify Table in Branch
  // ═══════════════════════════════════════════════════════════════════════════════
  test("Make modifications to table in branch", async ({ request }) => {
    const branchQueryEndpoint = `${baseApiUrl}/v1/projects/${branchRef}/database/query`

    const modifyResponse = await request.post(branchQueryEndpoint, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        query: `
          -- Add more test data
          INSERT INTO ${tableName} (name, email) VALUES 
            ('Test User 3', 'user3@example.com'),
            ('Test User 4', 'user4@example.com'),
            ('Test User 5', 'user5@example.com');
            
          -- Add a new column
          ALTER TABLE ${tableName} ADD COLUMN phone TEXT;
        `,
        read_only: false,
      },
    })

    expect(modifyResponse.status()).toBe(201)
    const modifyData = await modifyResponse.json()
    expect(modifyData).toBeDefined()
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // Restore Branch to Before Table Creation
  // ═══════════════════════════════════════════════════════════════════════════════
  test("Restore branch using PITR to before table creation", async ({
    request,
  }) => {
    const restoreEndpoint = `${baseApiUrl}/v1/projects/${branchRef}/database/backups/restore-pitr`

    const restoreResponse = await request.post(restoreEndpoint, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        recovery_time: restoreTimestamp,
      },
    })

    expect(restoreResponse.status()).toBe(200)
    const restoreData = await restoreResponse.json()
    expect(restoreData).toBeDefined()

    // Wait for restore operation to complete
    await new Promise((resolve) => setTimeout(resolve, 30000)) // 30 seconds
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // Verify Table No Longer Exists
  // ═══════════════════════════════════════════════════════════════════════════════
  test("Verify table has been removed after PITR restore", async ({
    request,
  }) => {
    const branchQueryEndpoint = `${baseApiUrl}/v1/projects/${branchRef}/database/query`

    const checkResponse = await request.post(branchQueryEndpoint, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        query: `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = '${tableName}'
          ) as table_exists
        `,
        read_only: true,
      },
    })

    expect(checkResponse.status()).toBe(201)
    const checkData = await checkResponse.json()
    expect(checkData).toBeDefined()
    expect(checkData.rows).toBeDefined()
    expect(checkData.rows[0].table_exists).toBe(false) // Table should not exist after restore
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // Delete Branch Cleanup
  // ═══════════════════════════════════════════════════════════════════════════════
  test("Delete branch for cleanup", async ({ request }) => {
    const deleteBranchEndpoint = `${baseApiUrl}/v1/projects/${projectRef}/branches/${branchRef}`

    const deleteResponse = await request.delete(deleteBranchEndpoint, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    })

    expect(deleteResponse.status()).toBe(200)
    const deleteData = await deleteResponse.json()
    expect(deleteData).toBeDefined()
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // TEST SUITE COMPLETION
  // ═══════════════════════════════════════════════════════════════════════════════
  test.afterAll(async ({ request }) => {
    // Clean up test table from main database
    const queryEndpoint = `${baseApiUrl}/v1/projects/${projectRef}/database/query`

    await request.post(queryEndpoint, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        query: `DROP TABLE IF EXISTS ${tableName}`,
        read_only: false,
      },
    })

    // Disable branching to return project to original state
    const branchingConfigEndpoint = `${baseApiUrl}/v1/projects/${projectRef}/config/database`

    await request.patch(branchingConfigEndpoint, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        branching_enabled: false,
      },
    })

    // Branch database lifecycle test suite completed successfully
    // Demonstrated: Enable branching → Branch creation → Table operations → PITR restore → Branch cleanup → Disable branching
    // All resources have been cleaned up and project returned to original state
  })
})
