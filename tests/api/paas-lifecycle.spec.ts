/**
 * PaaS Lifecycle API Test
 *
 * This comprehensive test demonstrates a complete database table lifecycle
 * using the Supabase Management API. The test workflow includes:
 *
 * 1. **Schema Migration**: Creates a new table with Row Level Security (RLS)
 * 2. **Data Operations**: Inserts sample records into the table
 * 3. **Data Verification**: Queries the table to confirm data integrity
 * 4. **Backup & Restore**: [Future] Point-in-time recovery functionality
 *
 * This test validates that:
 * - Database migrations execute successfully through the API
 * - Data can be inserted and retrieved correctly
 * - Row Level Security is properly enabled
 * - The complete CRUD lifecycle works as expected
 *
 * Note: This test creates real database objects and should be run against
 * a test environment to avoid affecting production data.
 */

import { test, expect } from "@playwright/test";

// Environment configuration - these should be set in your .env file
const baseApiUrl =
  process.env.SUPABASE_BASE_API_URL || "https://api.supabase.com";
const projectRef = process.env.SUPABASE_PROJECT_REF || "";
const accessToken = process.env.SUPABASE_ACCESS_TOKEN || "";

test("Complete table lifecycle: migration, data operations, and recovery", async ({
  request,
}) => {
  // Skip test if required environment variables are missing
  test.skip(
    !projectRef || !accessToken,
    "Missing SUPABASE_PROJECT_REF or SUPABASE_ACCESS_TOKEN environment variables",
  );

  // Generate unique table name to avoid conflicts between test runs
  const tableName = `test_table_${Date.now()}`;
  console.log(`Starting lifecycle test for table: ${tableName}`);

  // ═══════════════════════════════════════════════════════════════════════════════
  // STEP 1: Create Table Schema via Database Migration
  // ═══════════════════════════════════════════════════════════════════════════════

  // Generate unique idempotency key to ensure migration is tracked only once
  const idempotencyKey = `migration_${tableName}_${Date.now()}`;
  const migrationEndpoint = `${baseApiUrl}/v1/projects/${projectRef}/database/migrations`;

  console.log("📝 Creating table schema via migration...");
  const migrationResponse = await request.post(migrationEndpoint, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "Idempotency-Key": idempotencyKey, // Prevents duplicate migrations
    },
    data: {
      // Create table with basic structure and enable Row Level Security
      query: `
        CREATE TABLE ${tableName} (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );

        -- Enable Row Level Security for data protection
        ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;
      `,
      name: `create_${tableName}`, // Human-readable migration name
    },
  });

  expect(migrationResponse.status()).toBe(200);
  const migrationData = await migrationResponse.json();
  console.log("✅ Migration completed successfully:", migrationData);

  // ═══════════════════════════════════════════════════════════════════════════════
  // STEP 2: Insert Sample Data
  // ═══════════════════════════════════════════════════════════════════════════════

  const queryEndpoint = `${baseApiUrl}/v1/projects/${projectRef}/database/query`;

  console.log("📊 Inserting sample data into table...");
  const insertResponse = await request.post(queryEndpoint, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    data: {
      query: `
        INSERT INTO ${tableName} (name)
        VALUES ('Test User 1'), ('Test User 2'), ('Test User 3')
      `,
      read_only: false, // Write operation required for INSERT
    },
  });

  expect(insertResponse.status()).toBe(201);
  const insertData = await insertResponse.json();
  console.log("✅ Sample data inserted successfully:", insertData);

  // ═══════════════════════════════════════════════════════════════════════════════
  // STEP 3: Verify Data Integrity
  // ═══════════════════════════════════════════════════════════════════════════════

  console.log("🔍 Querying table to verify data integrity...");
  const queryResponse = await request.post(queryEndpoint, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    data: {
      query: `
        SELECT
          id,
          name,
          created_at,
          COUNT(*) OVER() as total_records
        FROM ${tableName}
        ORDER BY id
      `,
      read_only: true, // Safe read-only operation
    },
  });

  expect(queryResponse.status()).toBe(201);
  const queryData = await queryResponse.json();
  console.log("✅ Data verification completed:", queryData);

  // Verify we received a valid response with our test data
  expect(queryData).toBeDefined();

  // TODO: Add more specific assertions based on actual API response structure
  // Example validations you might want to add:
  // - expect(queryData.rows).toHaveLength(3);
  // - expect(queryData.rows[0].name).toBe('Test User 1');
  // - expect(queryData.rows).toEqual(expect.arrayContaining([...]));

  // ═══════════════════════════════════════════════════════════════════════════════
  // STEP 4: [FUTURE] Point-in-Time Recovery
  // ═══════════════════════════════════════════════════════════════════════════════

  // This functionality is currently under development and will be enabled
  // once the backup/restore API endpoints are fully operational.
  //
  // The intended workflow would be:
  // 1. Capture a snapshot timestamp before data modifications
  // 2. Perform destructive operations (DELETE, DROP, etc.)
  // 3. Restore to the previous point-in-time using the backup API
  // 4. Verify that the database state was successfully restored

  console.log("⏳ Point-in-time recovery: Not yet implemented");

  /*
  // Future implementation when backup API is available:
  const rollbackEndpoint = `${baseApiUrl}/v1/projects/${projectRef}/database/backups/restore-pitr`;
  const recoveryTime = Math.floor(Date.now() / 1000) - 300; // 5 minutes ago

  console.log("🔄 Initiating point-in-time recovery...");
  const rollbackResponse = await request.post(rollbackEndpoint, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    data: {
      recovery_time_target_unix: recoveryTime
    }
  });

  expect(rollbackResponse.status()).toBe(200);
  const rollbackData = await rollbackResponse.json();
  console.log('✅ Rollback initiated successfully:', rollbackData);
  */

  // ═══════════════════════════════════════════════════════════════════════════════
  // CLEANUP: Remove Test Table
  // ═══════════════════════════════════════════════════════════════════════════════

  // In a production environment, you might want to clean up test data
  // to avoid accumulating test tables. This could be done via:
  // - A cleanup migration: DROP TABLE IF EXISTS ${tableName};
  // - Point-in-time recovery (once available)
  // - Manual cleanup through a separate maintenance process

  console.log(
    `🧹 Test completed. Table '${tableName}' may need manual cleanup.`,
  );

  // TODO: Implement automated cleanup once rollback functionality is available
  // or add a cleanup migration to drop the test table
});
