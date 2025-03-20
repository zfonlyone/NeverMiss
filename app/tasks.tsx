import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import TaskListScreen from './screens/TaskListScreen';
import { Ionicons } from '@expo/vector-icons';

export default function TasksScreen() {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View style={[
      styles.container,
      { backgroundColor: colors.background }
    ]}>
      <Stack.Screen
        options={{
          title: t.menu.taskManagement,
          headerShown: true,
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.replace('/')}
              style={{ marginLeft: 8, padding: 8 }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            color: colors.text,
            fontWeight: 'bold'
          },
        }}
      />
      <TaskListScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 