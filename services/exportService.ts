import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import db from './database';
import { Task } from '../models/Task';
import { TaskCycle } from '../models/TaskCycle';
import { getAllTasks, getCycleHistory, createTaskWithCycle } from './taskService';

// Export data to JSON
export async function exportDataToJSON(): Promise<string> {
  try {
    // Get all tasks
    const tasks = await getAllTasks();
    
    // Get cycles for each task
    const tasksWithCycles = await Promise.all(
      tasks.map(async (task) => {
        const cycles = await getCycleHistory(task.id);
        return { task, cycles };
      })
    );
    
    // Create export object
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: tasksWithCycles,
    };
    
    // Convert to JSON
    const jsonData = JSON.stringify(exportData, null, 2);
    
    // Create file
    const fileName = `nevermiss_export_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    
    // Write to file
    await FileSystem.writeAsStringAsync(filePath, jsonData);
    
    return filePath;
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
}

// Export data to CSV
export async function exportDataToCSV(): Promise<string> {
  try {
    // Get all tasks
    const tasks = await getAllTasks();
    
    // Create CSV header
    let csvData = 'Task ID,Task Name,Start Date Time,Recurrence Type,Recurrence Value,Recurrence Unit,Reminder Offset,Auto Restart,Is Active,Created At,Updated At\n';
    
    // Add task data
    tasks.forEach((task) => {
      csvData += `${task.id},${task.name.replace(/,/g, ';')},${task.startDateTime},${task.recurrenceType},${task.recurrenceValue},${task.recurrenceUnit || ''},${task.reminderOffset},${task.autoRestart},${task.isActive},${task.createdAt},${task.updatedAt}\n`;
    });
    
    // Create file
    const fileName = `nevermiss_export_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    
    // Write to file
    await FileSystem.writeAsStringAsync(filePath, csvData);
    
    return filePath;
  } catch (error) {
    console.error('Error exporting data to CSV:', error);
    throw error;
  }
}

// Share exported file
export async function shareFile(filePath: string): Promise<void> {
  try {
    // Check if sharing is available
    const isAvailable = await Sharing.isAvailableAsync();
    
    if (!isAvailable) {
      throw new Error('Sharing is not available on this device');
    }
    
    // Share the file
    await Sharing.shareAsync(filePath);
  } catch (error) {
    console.error('Error sharing file:', error);
    throw error;
  }
}

// Import data from JSON
export async function importDataFromJSON(): Promise<void> {
  try {
    // Pick document
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });
    
    if (result.canceled) {
      throw new Error('Document picking was canceled');
    }
    
    // Read file
    const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
    
    // Parse JSON
    const importData = JSON.parse(fileContent);
    
    // Validate import data
    if (!importData.version || !importData.data) {
      throw new Error('Invalid import file format');
    }
    
    // Import tasks and cycles
    await db.transaction(
      (tx) => {
        importData.data.forEach(({ task, cycles }) => {
          // Insert task
          tx.executeSql(
            `INSERT OR REPLACE INTO tasks (
              id, name, startDateTime, recurrenceType, recurrenceValue, 
              recurrenceUnit, reminderOffset, autoRestart, isActive, 
              createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
            [
              task.id,
              task.name,
              task.startDateTime,
              task.recurrenceType,
              task.recurrenceValue,
              task.recurrenceUnit || null,
              task.reminderOffset,
              task.autoRestart ? 1 : 0,
              task.isActive ? 1 : 0,
              task.createdAt,
              task.updatedAt,
            ]
          );
          
          // Insert cycles
          cycles.forEach((cycle) => {
            tx.executeSql(
              `INSERT OR REPLACE INTO taskCycles (
                id, taskId, cycleStartDateTime, cycleEndDateTime, 
                status, completedAt, failedAt
              ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
              [
                cycle.id,
                cycle.taskId,
                cycle.cycleStartDateTime,
                cycle.cycleEndDateTime,
                cycle.status,
                cycle.completedAt || null,
                cycle.failedAt || null,
              ]
            );
          });
        });
      }
    );
  } catch (error) {
    console.error('Error importing data:', error);
    throw error;
  }
} 