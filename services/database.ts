import { openDatabaseSync } from 'expo-sqlite';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

// Database name
const DATABASE_NAME = 'nevermiss.db';

// Database instance
let db: any;

// Initialize database
export function initializeDatabase() {
  if (Platform.OS === 'web') {
    db = {
      transaction: () => {
        return {
          executeSql: () => {},
        };
      },
      exec: () => {},
      version: '',
      closeAsync: async () => {},
    };
  } else {
    db = openDatabaseSync(DATABASE_NAME);
  }
  return db;
}

// Get database instance
export function getDatabase() {
  if (!db) {
    db = initializeDatabase();
  }
  return db;
}

// Initialize database tables
export async function initDatabase(): Promise<void> {
  const database = getDatabase();
  return new Promise((resolve, reject) => {
    database.transaction(
      (tx: any) => {
        // Tasks table
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            startDateTime TEXT NOT NULL,
            recurrenceType TEXT NOT NULL,
            recurrenceValue INTEGER NOT NULL,
            recurrenceUnit TEXT,
            reminderOffset INTEGER NOT NULL,
            autoRestart INTEGER NOT NULL,
            isActive INTEGER NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL
          );`,
          [],
          () => {},
          (_: any, error: any) => {
            console.error('Error creating tasks table:', error);
            return true;
          }
        );

        // Task Cycles table
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS taskCycles (
            id TEXT PRIMARY KEY NOT NULL,
            taskId TEXT NOT NULL,
            cycleStartDateTime TEXT NOT NULL,
            cycleEndDateTime TEXT NOT NULL,
            status TEXT NOT NULL,
            completedAt TEXT,
            failedAt TEXT,
            FOREIGN KEY (taskId) REFERENCES tasks (id) ON DELETE CASCADE
          );`,
          [],
          () => {},
          (_: any, error: any) => {
            console.error('Error creating taskCycles table:', error);
            return true;
          }
        );
      },
      (error: any) => {
        console.error('Transaction error:', error);
        reject(error);
      },
      () => {
        resolve();
      }
    );
  });
}

// Reset database (for development purposes)
export async function resetDatabase(): Promise<void> {
  const database = getDatabase();
  return new Promise((resolve, reject) => {
    database.transaction(
      (tx: any) => {
        tx.executeSql('DROP TABLE IF EXISTS taskCycles;');
        tx.executeSql('DROP TABLE IF EXISTS tasks;');
      },
      (error: any) => {
        console.error('Error dropping tables:', error);
        reject(error);
      },
      () => {
        initDatabase()
          .then(resolve)
          .catch(reject);
      }
    );
  });
}

// Initialize database on import
initializeDatabase();

export default getDatabase(); 