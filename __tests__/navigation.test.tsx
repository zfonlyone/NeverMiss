import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import IndexScreen from '../app/index';
import { createStackNavigator } from '@react-navigation/stack';

// Mock the required modules
jest.mock('../services/taskService', () => ({
  getAllTasks: jest.fn().mockResolvedValue([]),
  deleteTask: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../services/notificationService', () => ({
  configureNotifications: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

const Stack = createStackNavigator();

describe('Navigation Tests', () => {
  const TestNavigator = () => (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="index" component={IndexScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );

  it('should show task form when add button is pressed', async () => {
    const { getByTestId, queryByText } = render(<TestNavigator />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(queryByText('正在加载...')).toBeNull();
    });

    // Press add button
    const addButton = getByTestId('add-task-button');
    fireEvent.press(addButton);

    // Check if form is displayed
    expect(queryByText('New Task')).toBeTruthy();
  });

  it('should show task details when a task is pressed', async () => {
    const mockTask = {
      id: 1,
      title: 'Test Task',
      description: 'Test Description',
      recurrenceType: 'daily',
      recurrenceValue: 1,
      reminderOffset: 30,
      isActive: true,
      autoRestart: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Mock getAllTasks to return our test task
    require('../services/taskService').getAllTasks.mockResolvedValueOnce([mockTask]);

    const { getByText, queryByText } = render(<TestNavigator />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(queryByText('正在加载...')).toBeNull();
    });

    // Press the task
    const taskTitle = getByText('Test Task');
    fireEvent.press(taskTitle);

    // Check if details are displayed
    expect(queryByText('Test Description')).toBeTruthy();
  });

  it('should close task form when close button is pressed', async () => {
    const { getByTestId, queryByText, getByText } = render(<TestNavigator />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(queryByText('正在加载...')).toBeNull();
    });

    // Open form
    const addButton = getByTestId('add-task-button');
    fireEvent.press(addButton);

    // Press close button
    const closeButton = getByTestId('close-form-button');
    fireEvent.press(closeButton);

    // Check if form is closed
    expect(queryByText('New Task')).toBeNull();
  });
}); 