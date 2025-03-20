import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import RecurrenceSelector from '../components/RecurrenceSelector';
import TagSelector from '../components/TagSelector';
import ColorSelector from '../components/ColorSelector';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import {
  Task,
  CreateTaskInput,
  RecurrencePattern,
  DateType,
  RecurrenceType,
  ReminderUnit,
  validateTask
} from '../../models/Task';
import { createTask as createTaskService, updateTask as updateTaskService, getTask as getTaskById } from '../../services/taskService';
import RNPickerSelect from 'react-native-picker-select';

interface TaskFormScreenProps {
  taskId?: number;
}

export default function TaskFormScreen({ taskId }: TaskFormScreenProps) {
  const { t } = useLanguage();
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();
  const isEditMode = !!taskId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>({
    type: 'daily',
    value: 1
  });
  const [dateType, setDateType] = useState<DateType>('solar');
  const [reminderOffset, setReminderOffset] = useState(30);
  const [reminderUnit, setReminderUnit] = useState<ReminderUnit>('minutes');
  const [reminderTime, setReminderTime] = useState({ hour: 9, minute: 0 });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [autoRestart, setAutoRestart] = useState(true);
  const [syncToCalendar, setSyncToCalendar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');

  useEffect(() => {
    if (taskId) {
      loadTask();
    }
  }, [taskId]);

  const loadTask = async () => {
    if (!taskId) return;
    
    try {
      setIsLoading(true);
      const task = await getTaskById(Number(taskId));
      
      if (task) {
        setTitle(task.title);
        setDescription(task.description || '');
        setRecurrencePattern(task.recurrencePattern);
        setDateType(task.dateType);
        setReminderOffset(task.reminderOffset);
        setReminderUnit(task.reminderUnit);
        setReminderTime(task.reminderTime);
        setIsActive(task.isActive);
        setAutoRestart(task.autoRestart);
        setSyncToCalendar(task.syncToCalendar);
        setTags(task.tags || []);
        setBackgroundColor(task.backgroundColor || '#FFFFFF');
      }
    } catch (error) {
      console.error('Error loading task:', error);
      Alert.alert(t.task.loadTaskFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const taskData: Partial<Task> = {
        title,
        description,
        recurrencePattern,
        dateType,
        reminderOffset,
        reminderUnit,
        reminderTime,
        isActive,
        autoRestart,
        syncToCalendar,
        tags,
        backgroundColor
      };

      const errors = validateTask(taskData);
      if (errors.length > 0) {
        Alert.alert('Validation Error', errors.join('\n'));
        return;
      }

      setIsLoading(true);

      if (isEditMode) {
        await updateTaskService(taskId!, taskData as any);
      } else {
        const startDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 1);

        const createInput: CreateTaskInput = {
          ...taskData as any,
          startDate: startDate.toISOString(),
          dueDate: dueDate.toISOString()
        };

        await createTaskService(createInput);
      }

      router.back();
    } catch (error) {
      console.error('Error saving task:', error);
      Alert.alert(t.task.saveTaskFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setReminderTime({
        hour: selectedTime.getHours(),
        minute: selectedTime.getMinutes()
      });
    }
  };

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const handleCancel = () => {
    router.back();
  };

  const validateAndSetReminderTime = (text: string) => {
    const value = parseInt(text);
    if (!isNaN(value) && value >= 0) {
      setReminderTime({
        hour: Math.floor(value / 60),
        minute: value % 60
      });
    } else if (text === '') {
      setReminderTime({ hour: 9, minute: 0 });
    }
  };

  const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
      fontSize: 16,
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      color: colors.text,
      paddingRight: 30,
    },
    inputAndroid: {
      fontSize: 16,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      color: colors.text,
      paddingRight: 30,
    },
    placeholder: {
      color: colors.subText,
    },
    iconContainer: {
      top: 10,
      right: 10,
    },
  });

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isEditMode ? t.task.editTask : t.task.newTask}
        </Text>
        <TouchableOpacity onPress={handleSave} disabled={isLoading} style={styles.headerSaveButton}>
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="checkmark" size={28} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.formSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.task.title}</Text>
          <TextInput
            style={[
              styles.titleInput, 
              { 
                borderColor: colors.border, 
                backgroundColor: isDarkMode ? colors.card : '#f9f9f9',
                color: colors.text 
              }
            ]}
            value={title}
            onChangeText={setTitle}
            placeholder={t.task.title}
            placeholderTextColor={colors.subText}
            maxLength={100}
          />
        </View>

        <View style={[styles.formSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.task.description}</Text>
          <TextInput
            style={[
              styles.descriptionInput, 
              { 
                borderColor: colors.border,
                backgroundColor: isDarkMode ? colors.card : '#f9f9f9',
                color: colors.text
              }
            ]}
            value={description}
            onChangeText={setDescription}
            placeholder={t.task.description}
            placeholderTextColor={colors.subText}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={[styles.formSection, { backgroundColor: colors.card }]}>
          <TagSelector selectedTags={tags} onTagsChange={setTags} />
        </View>

        <View style={[styles.formSection, { backgroundColor: colors.card }]}>
          <ColorSelector selectedColor={backgroundColor} onColorChange={setBackgroundColor} />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.reminder.reminderSettings}</Text>
          
          <View style={[styles.reminderContainer, { backgroundColor: colors.card }]}>
            <View style={[styles.reminderGroup, { backgroundColor: colors.card }]}>
              <Text style={[styles.label, { color: colors.text }]}>{t.reminder.reminderTime}</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    borderColor: colors.border,
                    backgroundColor: isDarkMode ? colors.card : '#f9f9f9',
                    color: colors.text
                  }
                ]}
                value={reminderTime.toString()}
                onChangeText={validateAndSetReminderTime}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
            
            <View style={[styles.reminderGroup, { backgroundColor: colors.card }]}>
              <Text style={[styles.label, { color: colors.text }]}>{t.reminder.reminderUnit}</Text>
              <RNPickerSelect
                value={reminderUnit}
                onValueChange={(value) => setReminderUnit(value || 'minutes')}
                items={[
                  { label: t.task.minutes, value: 'minutes' },
                  { label: t.task.hours, value: 'hours' },
                  { label: t.task.days, value: 'days' },
                ]}
                style={pickerSelectStyles}
              />
            </View>
          </View>
        </View>
        
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.reminder.recurrenceSettings}</Text>
          
          <View style={[styles.recurrenceContainer, { backgroundColor: colors.card }]}>
            <RecurrenceSelector
              recurrencePattern={recurrencePattern}
              dateType={dateType}
              onRecurrenceChange={setRecurrencePattern}
              onDateTypeChange={setDateType}
            />
          </View>
        </View>

        <View style={[styles.formSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.menu.settings}</Text>
          
          <View style={[styles.switchSetting, { backgroundColor: colors.card }]}>
            <View style={[styles.switchTextContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>{t.task.enableTask}</Text>
              <Text style={[styles.switchDescription, { color: colors.subText }]}>{t.task.enableTaskDesc}</Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: '#767577', true: colors.primary + '80' }}
              thumbColor={isActive ? colors.primary : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
            />
          </View>

          <View style={[styles.switchSetting, { backgroundColor: colors.card }]}>
            <View style={[styles.switchTextContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>{t.task.autoRestart}</Text>
              <Text style={[styles.switchDescription, { color: colors.subText }]}>{t.task.autoRestartDesc}</Text>
            </View>
            <Switch
              value={autoRestart}
              onValueChange={setAutoRestart}
              trackColor={{ false: '#767577', true: colors.primary + '80' }}
              thumbColor={autoRestart ? colors.primary : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
            />
          </View>

          <View style={[styles.switchSetting, { backgroundColor: colors.card }]}>
            <View style={[styles.switchTextContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>{t.task.syncToCalendar}</Text>
              <Text style={[styles.switchDescription, { color: colors.subText }]}>{t.task.syncToCalendarDesc}</Text>
            </View>
            <Switch
              value={syncToCalendar}
              onValueChange={setSyncToCalendar}
              trackColor={{ false: '#767577', true: colors.primary + '80' }}
              thumbColor={syncToCalendar ? colors.primary : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    height: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSaveButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabledText: {
    opacity: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  formSection: {
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  titleInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  descriptionInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  recurrenceContainer: {
    height: 460, // Adjustable based on your RecurrenceSelector's actual height
  },
  setting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 16,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  timeButtonText: {
    fontSize: 16,
    marginRight: 8,
    color: '#333',
  },
  reminderOffsetContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  reminderOffsetInput: {
    width: 80,
    height: 40,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
    textAlign: 'center',
  },
  reminderUnitContainer: {
    flexDirection: 'row',
  },
  unitButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: '#f9f9f9',
  },
  unitButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  unitButtonText: {
    fontSize: 14,
    color: '#333',
  },
  unitButtonTextActive: {
    color: 'white',
  },
  switchSetting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  switchTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
  },
  reminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reminderGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
}); 