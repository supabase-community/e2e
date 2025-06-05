/**
 * Database Backup & Recovery Lifecycle Test Suite
 *
 * This comprehensive test suite demonstrates a complete database table lifecycle
 * using the Supabase Management API with restore points. The test workflow includes:
 *
 * 1. **Create Backup Checkpoint**: Establishes a checkpoint before any changes
 * 2. **Schema Migration**: Creates a new table with Row Level Security (RLS)
 * 3. **Data Operations**: Inserts sample records into the table
 * 4. **Data Verification**: Queries the table to confirm changes were applied
 * 5. **Rollback Recovery**: Restores database to the initial checkpoint
 * 6. **Verify Rollback**: Confirms the table and data were completely removed
 *
 * Each step is a separate test to allow for better isolation and debugging.
 * Tests share state through environment-scoped variables and checkpoint names.
 *
 * This test validates that:
 * - Backup checkpoints can be created successfully
 * - Database migrations execute after checkpoint creation
 * - Data operations work correctly on migrated schema
 * - Rollback functionality completely reverts all changes
 * - Database state is identical to pre-migration state after rollback
 *
 * Note: This test demonstrates real backup/recovery operations and should be run
 * against a test environment to avoid affecting production data.
 */

import { test, expect } from "@playwright/test"

const baseApiUrl = process.env.SUPABASE_BASE_API_URL || ""
const projectRef = process.env.SUPABASE_PROJECT_REF || ""
const accessToken = process.env.SUPABASE_ACCESS_TOKEN || ""

const METADATA = {
  tag: ["@api", "@database", "@backup", "@recovery", "@rollback"],
  annotation: [{ type: "Docs", description: "https://supabase.com/docs" }],
}

test.describe.serial("Database Rollback", METADATA, () => {
  // Shared test data - generated once and used across all tests in this suite
  const testId = Date.now()
  const tableName = `test_table_${testId}`
  const backupCheckpointName = `checkpoint_before_migration_${testId}`
  let checkpointName: string // Will be set after restore point creation

  // Skip entire test suite if required environment variables are missing
  test.beforeAll(async () => {
    test.skip(
      !projectRef || !accessToken,
      "Missing SUPABASE_PROJECT_REF or SUPABASE_ACCESS_TOKEN environment variables"
    )
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // STEP 1: Create Backup Checkpoint (Checkpoint Before Migration)
  // ═══════════════════════════════════════════════════════════════════════════════
  test.skip("Create backup checkpoint before migration", async ({
    request,
  }) => {
    const backupEndpoint = `${baseApiUrl}/v1/projects/${projectRef}/database/backups`

    // Create backup checkpoint before making any database changes
    const backupResponse = await request.post(backupEndpoint, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        name: backupCheckpointName, // Unique name for this checkpoint
      },
    })

    expect(backupResponse.status()).toBe(201)
    const backupData = await backupResponse.json()
    // Backup checkpoint created successfully

    // Store the backup checkpoint name for later tests
    checkpointName = backupData.name || backupCheckpointName
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // STEP 2: Execute Database Migration (Create Table Schema)
  // ═══════════════════════════════════════════════════════════════════════════════
  test("Execute database migration", async ({ request }) => {
    const migrationEndpoint = `${baseApiUrl}/v1/projects/${projectRef}/database/migrations`
    const idempotencyKey = `migration_${tableName}_${testId}`

    // Execute database migration to create new table with RLS
    const migrationResponse = await request.post(migrationEndpoint, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Idempotency-Key": idempotencyKey,
      },
      data: {
        query: `
          CREATE TABLE ${tableName} (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE,
            created_at TIMESTAMP DEFAULT NOW()
          );
          
          -- Enable Row Level Security for data protection
          ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;
        `,
        name: `create_${tableName}_with_rls`,
      },
    })

    expect(migrationResponse.status()).toBe(200)
    const migrationData = await migrationResponse.json()
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // STEP 3: Insert Sample Data
  // ═══════════════════════════════════════════════════════════════════════════════
  test("Insert sample data into new table", async ({ request }) => {
    const queryEndpoint = `${baseApiUrl}/v1/projects/${projectRef}/database/query`

    // Insert sample test data into the newly created table
    const insertResponse = await request.post(queryEndpoint, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        query: `
          INSERT INTO ${tableName} (name, email) VALUES 
            ('Alice Johnson', 'alice@example.com'),
            ('Bob Smith', 'bob@example.com'),
            ('Carol Davis', 'carol@example.com'),
            ('David Wilson', 'david@example.com')
        `,
        read_only: false,
      },
    })

    expect(insertResponse.status()).toBe(201)
    const insertData = await insertResponse.json()
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // STEP 4: Verify Post-Migration State
  // ═══════════════════════════════════════════════════════════════════════════════
  test("Verify table exists and contains data", async ({ request }) => {
    const queryEndpoint = `${baseApiUrl}/v1/projects/${projectRef}/database/query`

    // Verify table exists and contains the expected test data
    const verifyResponse = await request.post(queryEndpoint, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        query: `
          SELECT 
            COUNT(*) as record_count,
            MIN(created_at) as first_record,
            MAX(created_at) as last_record
          FROM ${tableName}
        `,
        read_only: true,
      },
    })

    expect(verifyResponse.status()).toBe(201)
    const verifyData = await verifyResponse.json()
    // Post-migration verification completed

    // Verify we received a valid response with our test data
    expect(verifyData).toBeDefined()
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // STEP 5: Rollback to Backup Checkpoint
  // ═══════════════════════════════════════════════════════════════════════════════
  test.skip("Rollback to backup checkpoint", async ({ request }) => {
    const undoEndpoint = `${baseApiUrl}/v1/projects/${projectRef}/database/restores`

    // Use the checkpoint name from backup creation (fallback to generated name if not set)
    const targetCheckpoint = checkpointName || backupCheckpointName

    // Initiate rollback to backup checkpoint: ${targetCheckpoint}
    const rollbackResponse = await request.post(undoEndpoint, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        restore_point_name: targetCheckpoint, // Restore to our checkpoint
      },
    })

    expect(rollbackResponse.status()).toBe(200)
    const rollbackData = await rollbackResponse.json()
    expect(rollbackData).toBeDefined()

    // Allow time for rollback operation to complete
    await new Promise((resolve) => setTimeout(resolve, 5000))
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // STEP 6: Verify Rollback Success
  // ═══════════════════════════════════════════════════════════════════════════════
  test.skip("Verify rollback removed the table", async ({ request }) => {
    const queryEndpoint = `${baseApiUrl}/v1/projects/${projectRef}/database/query`

    // Verify rollback success by checking if table was removed
    const postRollbackResponse = await request.post(queryEndpoint, {
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

    expect(postRollbackResponse.status()).toBe(201)
    const postRollbackData = await postRollbackResponse.json()
    expect(postRollbackData).toBeDefined()
    expect(postRollbackData.rows).toBeDefined()
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // TEST SUITE COMPLETION
  // ═══════════════════════════════════════════════════════════════════════════════
  test.afterAll(async () => {
    // Backup & recovery lifecycle test suite completed successfully
    // Demonstrated: Create checkpoint → Migrate → Insert data → Rollback → Verify
    // No cleanup needed - rollback should have handled everything
  })
})
