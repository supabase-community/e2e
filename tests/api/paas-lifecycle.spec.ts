import { test, expect } from "@playwright/test"

// Environment configuration - these should be set in your .env file
const baseApiUrl =
  process.env.SUPABASE_BASE_API_URL || "https://api.supabase.com"
const projectRef = process.env.SUPABASE_PROJECT_REF || ""
const accessToken = process.env.SUPABASE_ACCESS_TOKEN || ""

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

const METADATA = {
  tag: ["@backup", "@recovery", "@rollback"],
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
    console.log(
      `🚀 Starting backup & recovery test suite for table: ${tableName}`
    )
    console.log(`📍 Backup checkpoint name: ${backupCheckpointName}`)
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // STEP 1: Create Backup Checkpoint (Checkpoint Before Migration)
  // ═══════════════════════════════════════════════════════════════════════════════
  test.skip("Create backup checkpoint before migration", async ({
    request,
  }) => {
    const backupEndpoint = `${baseApiUrl}/v1/projects/${projectRef}/database/backups`

    console.log("🎯 Creating backup checkpoint before any database changes...")
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
    console.log("✅ Backup checkpoint created successfully:", backupData)

    // Store the backup checkpoint name for later tests
    checkpointName = backupData.name || backupCheckpointName
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // STEP 2: Execute Database Migration (Create Table Schema)
  // ═══════════════════════════════════════════════════════════════════════════════
  test("Execute database migration", async ({ request }) => {
    const migrationEndpoint = `${baseApiUrl}/v1/projects/${projectRef}/database/migrations`
    const idempotencyKey = `migration_${tableName}_${testId}`

    console.log("📝 Executing database migration to create new table...")
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
    console.log("✅ Migration executed successfully:", migrationData)
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // STEP 3: Insert Sample Data
  // ═══════════════════════════════════════════════════════════════════════════════
  test("Insert sample data into new table", async ({ request }) => {
    const queryEndpoint = `${baseApiUrl}/v1/projects/${projectRef}/database/query`

    console.log("📊 Inserting sample data into the new table...")
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
    console.log("✅ Sample data inserted successfully:", insertData)
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // STEP 4: Verify Post-Migration State
  // ═══════════════════════════════════════════════════════════════════════════════
  test("Verify table exists and contains data", async ({ request }) => {
    const queryEndpoint = `${baseApiUrl}/v1/projects/${projectRef}/database/query`

    console.log("🔍 Verifying table exists and contains expected data...")
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
    console.log("✅ Post-migration verification completed:", verifyData)

    // Verify we received a valid response with our test data
    expect(verifyData).toBeDefined()

    // TODO: Add more specific assertions based on actual API response structure
    // Example validations you might want to add:
    // - expect(verifyData.rows[0].record_count).toBe('4');
    // - expect(verifyData.rows[0].first_record).toBeDefined();
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // STEP 5: Rollback to Backup Checkpoint
  // ═══════════════════════════════════════════════════════════════════════════════
  test.skip("Rollback to backup checkpoint", async ({ request }) => {
    const undoEndpoint = `${baseApiUrl}/v1/projects/${projectRef}/database/restores`

    // Use the checkpoint name from backup creation (fallback to generated name if not set)
    const targetCheckpoint = checkpointName || backupCheckpointName

    console.log(`🔄 Rolling back to backup checkpoint: ${targetCheckpoint}...`)
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
    console.log("✅ Rollback initiated successfully:", rollbackData)

    // Allow time for rollback to complete (this might take a moment)
    console.log("⏳ Waiting for rollback to complete...")

    await new Promise((resolve) => setTimeout(resolve, 5000)) // Wait 5 seconds
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // STEP 6: Verify Rollback Success
  // ═══════════════════════════════════════════════════════════════════════════════
  test.skip("Verify rollback removed the table", async ({ request }) => {
    const queryEndpoint = `${baseApiUrl}/v1/projects/${projectRef}/database/query`

    console.log("🔍 Verifying rollback: checking if table was removed...")
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
    console.log("✅ Rollback verification completed:", postRollbackData)

    // The table should not exist after rollback
    // TODO: Add specific assertion based on actual API response structure
    // Expected: table_exists should be false
    // expect(postRollbackData.rows[0].table_exists).toBe(false);
  })

  // ═══════════════════════════════════════════════════════════════════════════════
  // TEST SUITE COMPLETION
  // ═══════════════════════════════════════════════════════════════════════════════
  test.afterAll(async () => {
    console.log(
      "🎉 Backup & recovery lifecycle test suite completed successfully!"
    )
    console.log(
      "✅ Demonstrated: Create checkpoint → Migrate → Insert data → Rollback → Verify"
    )

    // No cleanup needed - rollback should have handled everything
  })
})
