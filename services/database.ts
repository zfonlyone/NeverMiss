import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

const DATABASE_NAME = 'nevermiss.db';
const DATABASE_VERSION = 1;

const db = SQLite.openDatabase(DATABASE_NAME);

const createTasksTable = `
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    recurrenceType TEXT NOT NULL,
    recurrenceValue INTEGER NOT NULL,
    recurrenceUnit TEXT,
    reminderOffset INTEGER NOT NULL DEFAULT 0,
    reminderUnit TEXT NOT NULL DEFAULT 'minutes',
    reminderTimeHour INTEGER NOT NULL DEFAULT 9,
    reminderTimeMinute INTEGER NOT NULL DEFAULT 0,
    isActive INTEGER NOT NULL DEFAULT 1,
    autoRestart INTEGER NOT NULL DEFAULT 0,
    syncToCalendar INTEGER NOT NULL DEFAULT 0,
    calendarEventId TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`;

const createTaskCyclesTable = `
  CREATE TABLE IF NOT EXISTS task_cycles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    taskId INTEGER NOT NULL,
    startDate TEXT NOT NULL,
    dueDate TEXT NOT NULL,
    isCompleted INTEGER NOT NULL DEFAULT 0,
    isOverdue INTEGER NOT NULL DEFAULT 0,
    completedDate TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (taskId) REFERENCES tasks (id) ON DELETE CASCADE
  );
`;

const createTaskHistoryTable = `
  CREATE TABLE IF NOT EXISTS task_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    taskId INTEGER NOT NULL,
    cycleId INTEGER NOT NULL,
    action TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (taskId) REFERENCES tasks (id) ON DELETE CASCADE,
    FOREIGN KEY (cycleId) REFERENCES task_cycles (id) ON DELETE CASCADE
  );
`;

const createIndexes = [
  'CREATE INDEX IF NOT EXISTS idx_tasks_isActive ON tasks (isActive);',
  'CREATE INDEX IF NOT EXISTS idx_task_cycles_taskId ON task_cycles (taskId);',
  'CREATE INDEX IF NOT EXISTS idx_task_cycles_isCompleted ON task_cycles (isCompleted);',
  'CREATE INDEX IF NOT EXISTS idx_task_cycles_isOverdue ON task_cycles (isOverdue);',
  'CREATE INDEX IF NOT EXISTS idx_task_history_taskId ON task_history (taskId);',
  'CREATE INDEX IF NOT EXISTS idx_task_history_cycleId ON task_history (cycleId);',
];

export const initDatabase = async (): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    try {
      // Enable foreign key support and create tables
      db.transaction(
        (tx) => {
          // Drop existing tables if they exist
          tx.executeSql('DROP TABLE IF EXISTS task_history;');
          tx.executeSql('DROP TABLE IF EXISTS task_cycles;');
          tx.executeSql('DROP TABLE IF EXISTS tasks;');

          // Enable foreign key support
          tx.executeSql('PRAGMA foreign_keys = ON;');

          // Create tables
          tx.executeSql(createTasksTable);
          tx.executeSql(createTaskCyclesTable);
          tx.executeSql(createTaskHistoryTable);

          // Create indexes
          createIndexes.forEach((sql) => {
            tx.executeSql(sql);
          });
        },
        (error) => {
          console.error('Error creating database:', error);
          reject(error);
        },
        () => {
          console.log('Database initialized successfully');
          resolve();
        }
      );
    } catch (error) {
      console.error('Error initializing database:', error);
      reject(error);
    }
  });
};

export const clearDatabase = async (): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql('DROP TABLE IF EXISTS task_history;');
        tx.executeSql('DROP TABLE IF EXISTS task_cycles;');
        tx.executeSql('DROP TABLE IF EXISTS tasks;');
      },
      (error) => {
        console.error('Error clearing database:', error);
        reject(error);
      },
      () => {
        console.log('Database cleared successfully');
        resolve();
      }
    );
  });
};

export const resetDatabase = async (): Promise<void> => {
  try {
    await clearDatabase();
    await initDatabase();
    console.log('Database reset successfully');
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
};

export const getDatabaseVersion = async (): Promise<number> => {
  return DATABASE_VERSION;
};

export const getDatabaseInfo = async (): Promise<{
  version: number;
  tasksCount: number;
  cyclesCount: number;
  historyCount: number;
}> => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `SELECT 
            (SELECT COUNT(*) FROM tasks) as tasksCount,
            (SELECT COUNT(*) FROM task_cycles) as cyclesCount,
            (SELECT COUNT(*) FROM task_history) as historyCount;`,
          [],
          (_, { rows: { _array } }) => {
            resolve({
              version: DATABASE_VERSION,
              ..._array[0],
            });
          }
        );
      },
      (error) => {
        console.error('Error getting database info:', error);
        reject(error);
      }
    );
  });
};

// Initialize database on import
initDatabase();

export default db; 