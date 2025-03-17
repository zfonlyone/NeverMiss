import React from 'react';
import { Stack } from 'expo-router';
import HomeScreen from '../screens/HomeScreen';
import FloatingActionButton from '../components/FloatingActionButton';
import { View, StyleSheet } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

export default function TasksScreen() {
  const { t } = useLanguage();
  const { colors } = useTheme();

  return (
    <View style={[
      styles.container,
      { backgroundColor: colors.background }
    ]}>
      <Stack.Screen
        options={{
          title: t.menu.taskManagement,
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.card,
          },
          headerTintColor: colors.text,
        }}
      />
      <HomeScreen />
      <FloatingActionButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 