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
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLanguage } from '../../hooks/useLanguage';
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
import { createTask as createTaskService, updateTask as updateTaskService, getTaskById } from '../../services/taskService';

interface TaskFormScreenProps {
  taskId?: number;
}

export default function TaskFormScreen({ taskId }: TaskFormScreenProps) {
  const { t } = useLanguage();
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
      const task = await getTaskById(taskId);
      
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? t.task.editTask : t.task.newTask}</Text>
        <TouchableOpacity onPress={handleSave} disabled={isLoading} style={styles.saveButton}>
          <Text style={[styles.saveButtonText, isLoading && styles.disabledText]}>{isLoading ? t.common.saving : t.common.save}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>{t.task.title}</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder={t.task.title}
            maxLength={100}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>{t.task.description}</Text>
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={setDescription}
            placeholder={t.task.description}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.formSection}>
          <TagSelector selectedTags={tags} onTagsChange={setTags} />
        </View>

        <View style={styles.formSection}>
          <ColorSelector selectedColor={backgroundColor} onColorChange={setBackgroundColor} />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>{t.task.recurrenceSettings}</Text>
          <RecurrenceSelector
            recurrencePattern={recurrencePattern}
            dateType={dateType}
            onRecurrenceChange={setRecurrencePattern}
            onDateTypeChange={setDateType}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>{t.task.reminderSettings}</Text>
          
          <View style={styles.setting}>
            <Text style={styles.settingLabel}>{t.task.reminderTime}</Text>
            <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.timeButton}>
              <Text style={styles.timeButtonText}>
                {formatTime(reminderTime.hour, reminderTime.minute)}
              </Text>
              <Ionicons name="time-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {showTimePicker && (
            <DateTimePicker
              value={new Date().setHours(reminderTime.hour, reminderTime.minute)}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={handleTimeChange}
            />
          )}

          <View style={styles.setting}>
            <Text style={styles.settingLabel}>{t.task.reminderOffset}</Text>
            <View style={styles.reminderOffsetContainer}>
              <TextInput
                style={styles.reminderOffsetInput}
                value={reminderOffset.toString()}
                onChangeText={(text) => {
                  const value = parseInt(text);
                  if (!isNaN(value) && value >= 0) {
                    setReminderOffset(value);
                  } else if (text === '') {
                    setReminderOffset(0);
                  }
                }}
                keyboardType="number-pad"
              />
              <View style={styles.reminderUnitContainer}>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    reminderUnit === 'minutes' && styles.unitButtonActive
                  ]}
                  onPress={() => setReminderUnit('minutes')}
                >
                  <Text style={[
                    styles.unitButtonText,
                    reminderUnit === 'minutes' && styles.unitButtonTextActive
                  ]}>{t.task.minutes}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    reminderUnit === 'hours' && styles.unitButtonActive
                  ]}
                  onPress={() => setReminderUnit('hours')}
                >
                  <Text style={[
                    styles.unitButtonText,
                    reminderUnit === 'hours' && styles.unitButtonTextActive
                  ]}>{t.task.hours}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    reminderUnit === 'days' && styles.unitButtonActive
                  ]}
                  onPress={() => setReminderUnit('days')}
                >
                  <Text style={[
                    styles.unitButtonText,
                    reminderUnit === 'days' && styles.unitButtonTextActive
                  ]}>{t.task.days}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>{t.menu.settings}</Text>
          
          <View style={styles.switchSetting}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchLabel}>{t.task.enableTask}</Text>
              <Text style={styles.switchDescription}>{t.task.enableTaskDesc}</Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={isActive ? '#007AFF' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
            />
          </View>

          <View style={styles.switchSetting}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchLabel}>{t.task.autoRestart}</Text>
              <Text style={styles.switchDescription}>{t.task.autoRestartDesc}</Text>
            </View>
            <Switch
              value={autoRestart}
              onValueChange={setAutoRestart}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={autoRestart ? '#007AFF' : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
            />
          </View>

          <View style={styles.switchSetting}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchLabel}>{t.task.syncToCalendar}</Text>
              <Text style={styles.switchDescription}>{t.task.syncToCalendarDesc}</Text>
            </View>
            <Switch
              value={syncToCalendar}
              onValueChange={setSyncToCalendar}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={syncToCalendar ? '#007AFF' : '#f4f3f4'}
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
    color: '#333',
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#007AFF',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  titleInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
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
    color: '#333',
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
}); 