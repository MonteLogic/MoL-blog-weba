import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { promises as fs } from 'fs';
import path from 'path';
import { users, routes, routeShiftInfo, workTimeShift } from '#/db/schema';
import { uuid } from '#/utils/dbUtils';

export async function setupTestDb() {
  try {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .slice(0, 19);

    const dbName = `test-${timestamp}.db`;
    const dbPath = path.join(process.cwd(), 'test', dbName);

    // Important: Check if migrations are in the correct location
    const migrationsPath = path.join(process.cwd(), 'db', 'migrations'); // Changed to match your structure

    // List all files in migrations directory
    try {
      const files = await fs.readdir(migrationsPath);
    } catch (err) {
      console.error('Error reading migrations directory:', err);
    }

    // Ensure test directory exists
    await fs.mkdir(path.join(process.cwd(), 'test'), { recursive: true });

    const sqlite = new Database(dbPath);
    const db = drizzle(sqlite);

    // Run migrations with additional logging
    try {
      migrate(db, { migrationsFolder: migrationsPath });
    } catch (err) {
      console.error('Migration failed:', err);
    }

    // Verify tables after migration
    const tables = sqlite
      .prepare(
        `
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `,
      )
      .all();

    return { db, dbPath };
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
}

// The rest of your code remains the same...

export async function seedTestDb(dbPath: string) {
  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite);
  const now = new Date().toISOString();
  const organizationID = uuid();

  try {
    // Create test user
    const userId = uuid();
    await db.insert(users).values({
      id: userId,
      clerkID: `clerk_${uuid()}`,
      organizationID,
      userNiceName: 'Test User',
      email: 'test@example.com',
      phone: '555-0123',
      dateHired: now,
      dateAddedToCB: now,
      img: null,
    });

    // Create test route
    const routeId = uuid();
    await db.insert(routes).values({
      id: routeId,
      organizationID,
      routeNiceName: 'Test Route',
      routeIDFromPostOffice: 'R123',
      dateRouteAcquired: now,
      dateAddedToCB: now,
      img: null,
    });

    // Create test route shift info
    const shiftId = uuid();
    await db.insert(routeShiftInfo).values({
      id: shiftId,
      organizationID,
      routeId,
      shiftName: 'Morning Shift',
      startTime: '08:00',
      endTime: '16:00',
      dateAddedToCB: now,
    });

    // Create test work time shift
    const workTimeShiftId = uuid();
    await db.insert(workTimeShift).values({
      id: workTimeShiftId,
      organizationID,
      occupied: false,
      userId,
      shiftWorked: shiftId,
      dayScheduled: now,
      dateAddedToCB: now,
      routeId,
      summary: '{}',
    });

    return {
      userId,
      organizationID,
      routeId,
      shiftId,
      workTimeShiftId,
    };
  } catch (error) {
    console.error('Failed to seed test database:', error);
    throw error;
  } finally {
    sqlite.close();
  }
}

export async function createTestDatabase() {
  const { dbPath } = await setupTestDb();
  const testData = await seedTestDb(dbPath);

  return {
    dbPath,
    ...testData,
    cleanup: async () => {
      try {
        await fs.unlink(dbPath);
      } catch (error) {
        console.error('Failed to cleanup test database:', error);
      }
    },
  };
}

// Run if file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createTestDatabase()
    .then((result) => {
      // Uncomment the following line if you want to clean up the database after creation
      // return result.cleanup();
    })
    .catch((error) => {
      console.error('Test setup failed:', error);
      process.exit(1);
    });
}
