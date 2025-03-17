import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ScrollView,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useLanguage } from '../../contexts/LanguageContext';
import { useRouter } from 'expo-router';

export default function NewTaskScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [useLunar, setUseLunar] = useState(false);

  const handleCancel = () => {
    router.back();
  };

  const handleSave = async () => {
    // TODO: Implement save logic
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={[styles.label, { color: colors.text }]}>Recurrence Type</Text>
        <View style={styles.recurrenceContainer}>
          <TouchableOpacity
            style={[styles.recurrenceButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.recurrenceButtonText, { color: '#fff' }]}>Daily</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.recurrenceButton, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.recurrenceButtonText, { color: colors.text }]}>Weekly</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.recurrenceButton, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.recurrenceButtonText, { color: colors.text }]}>Monthly</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.recurrenceButton, { backgroundColor: colors.card }]}
          >
            <Text style={[styles.recurrenceButtonText, { color: colors.text }]}>Custom</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dateTypeContainer}>
          <Text style={[styles.label, { color: colors.text, flex: 1 }]}>Start Date</Text>
          <View style={styles.dateTypeSwitch}>
            <Text style={[styles.dateTypeText, { color: !useLunar ? colors.primary : colors.text }]}>Solar</Text>
            <Switch
              value={useLunar}
              onValueChange={setUseLunar}
              style={styles.switch}
            />
            <Text style={[styles.dateTypeText, { color: useLunar ? colors.primary : colors.text }]}>Lunar</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.dateInput, { backgroundColor: colors.card }]}
        >
          <Text style={[styles.dateText, { color: colors.text }]}>2025-03-18 00:26</Text>
        </TouchableOpacity>

        <Text style={[styles.label, { color: colors.text }]}>Due Date</Text>
        <TouchableOpacity
          style={[styles.dateInput, { backgroundColor: colors.card }]}
        >
          <Text style={[styles.dateText, { color: colors.text }]}>2025-03-19 00:26</Text>
        </TouchableOpacity>

        <Text style={[styles.label, { color: colors.text }]}>Reminder Settings</Text>
        <View style={styles.reminderContainer}>
          <Text style={[styles.reminderLabel, { color: colors.text }]}>Remind Before</Text>
          <View style={styles.reminderInputContainer}>
            <TextInput
              style={[styles.reminderInput, { backgroundColor: colors.card, color: colors.text }]}
              value="30"
            />
            <TouchableOpacity
              style={[styles.unitButton, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.unitButtonText, { color: '#fff' }]}>Minutes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.unitButton, { backgroundColor: colors.card }]}
            >
              <Text style={[styles.unitButtonText, { color: colors.text }]}>Hours</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.unitButton, { backgroundColor: colors.card }]}
            >
              <Text style={[styles.unitButtonText, { color: colors.text }]}>Days</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Daily Reminder Time</Text>
        <TouchableOpacity
          style={[styles.dateInput, { backgroundColor: colors.card }]}
        >
          <Text style={[styles.dateText, { color: colors.text }]}>09:00</Text>
        </TouchableOpacity>

        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>Sync to Calendar</Text>
            <Text style={[styles.settingDescription, { color: colors.border }]}>
              Sync this task with your system calendar
            </Text>
          </View>
          <Switch
            value={false}
            onValueChange={() => {}}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingLabelContainer}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>Auto Reset Task</Text>
            <Text style={[styles.settingDescription, { color: colors.border }]}>
              Automatically start new cycle when completing task before due date
            </Text>
          </View>
          <Switch
            value={false}
            onValueChange={() => {}}
          />
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.card }]}
          onPress={handleCancel}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, { color: '#fff' }]}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  recurrenceContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  recurrenceButton: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  recurrenceButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateTypeSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTypeText: {
    fontSize: 14,
    marginHorizontal: 8,
  },
  switch: {
    marginHorizontal: 4,
  },
  dateInput: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 15,
    justifyContent: 'center',
    marginBottom: 15,
  },
  dateText: {
    fontSize: 16,
  },
  reminderContainer: {
    marginBottom: 15,
  },
  reminderLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  reminderInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderInput: {
    width: 60,
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
    textAlign: 'center',
  },
  unitButton: {
    paddingHorizontal: 15,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    minHeight: 70,
  },
  settingLabelContainer: {
    flex: 1,
    marginRight: 15,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    flexWrap: 'wrap',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
}); 