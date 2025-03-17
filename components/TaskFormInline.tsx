/**
 * TaskFormInline Component for NeverMiss
 * @author zfonlyone
 * 
 * Non-modal version of the TaskForm component
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { Task, CreateTaskInput } from '../models/Task';
import { createTask, updateTask } from '../services/taskService';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { scheduleTestNotification } from '../services/notificationService';
import { checkPermissionsForFeature, requestPermissionsForFeature } from '../services/permissionService';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

interface TaskFormInlineProps {
  task?: Task;
  onSave: () => void;
  onCancel: () => void;
}

export default function TaskFormInline({ task, onSave, onCancel }: TaskFormInlineProps) {
  const { t } = useLanguage();
  const { colors, isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showDuePicker, setShowDuePicker] = useState(false);
  const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

  const [formData, setFormData] = useState<CreateTaskInput>({
    title: task?.title || '',
    description: task?.description || '',
    recurrenceType: task?.recurrenceType || 'daily',
    recurrenceValue: task?.recurrenceValue || 1,
    recurrenceUnit: task?.recurrenceUnit,
    reminderOffset: task?.reminderOffset || 30,
    reminderUnit: task?.reminderUnit || 'minutes',
    reminderTime: task?.reminderTime || { hour: 9, minute: 0 },
    isActive: task?.isActive !== false,
    autoRestart: task?.autoRestart !== false,
    syncToCalendar: task?.syncToCalendar || false,
    startDate: task?.currentCycle?.startDate || new Date().toISOString(),
    dueDate: task?.currentCycle?.dueDate || (() => {
      const date = new Date();
      date.setDate(date.getDate() + 1);
      return date.toISOString();
    })(),
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = t.validation.titleRequired;
    }

    if (formData.recurrenceValue <= 0) {
      newErrors.recurrenceValue = t.validation.recurrenceValuePositive;
    }

    if (formData.reminderOffset < 0) {
      newErrors.reminderOffset = t.validation.reminderOffsetPositive;
    }

    if (new Date(formData.startDate) >= new Date(formData.dueDate)) {
      newErrors.dueDate = t.validation.dueDateAfterStart;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 ? {} : newErrors;
  };

  const handleSave = async () => {
    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    try {
      // Check permissions for calendar if needed
      if (formData.syncToCalendar) {
        const permissionResult = await checkPermissionsForFeature('calendar');
        if (!permissionResult.granted) {
          const granted = await requestPermissionsForFeature('calendar');
          if (!granted) {
            Alert.alert(
              t.permissions.calendarPermissionTitle,
              t.permissions.calendarPermissionMessage
            );
            setFormData({ ...formData, syncToCalendar: false });
            setIsLoading(false);
            return;
          }
        }
      }

      // Check permissions for notifications
      const notificationPermission = await checkPermissionsForFeature('notification');
      if (!notificationPermission.granted) {
        const granted = await requestPermissionsForFeature('notification');
        if (!granted) {
          Alert.alert(
            t.permissions.notificationPermissionTitle,
            t.permissions.notificationPermissionMessage
          );
          setIsLoading(false);
          return;
        }
      }

      // Save task
      if (task) {
        // Update existing task
        await updateTask(task.id, {
          ...formData,
          isActive: formData.isActive, // 确保isActive属性被正确传递
          autoRestart: formData.autoRestart, // 确保autoRestart属性被正确传递
          syncToCalendar: formData.syncToCalendar, // 确保syncToCalendar属性被正确传递
        });
      } else {
        // Create new task
        await createTask(formData);
      }

      onSave();
    } catch (error) {
      console.error('Error saving task:', error);
      Alert.alert(t.common.error, t.task.saveTaskFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate: Date | undefined,
    field: 'startDate' | 'dueDate'
  ) => {
    if (Platform.OS === 'android') {
      setShowStartPicker(false);
      setShowDuePicker(false);
    }

    if (event.type === 'dismissed') {
      return;
    }

    if (selectedDate) {
      const currentDate = new Date(formData[field]);
      let newDate = new Date(selectedDate);
      
      if (pickerMode === 'date') {
        // 在日期模式下，保持原来的时间
        newDate.setHours(currentDate.getHours());
        newDate.setMinutes(currentDate.getMinutes());
        
        if (Platform.OS === 'android') {
          // 在 Android 上，选择完日期后显示时间选择器
          setPickerMode('time');
          setTimeout(() => {
            if (field === 'startDate') {
              setShowStartPicker(true);
            } else {
              setShowDuePicker(true);
            }
          }, 100);
        }
      } else {
        // 在时间模式下，保持原来的日期
        newDate = new Date(currentDate);
        newDate.setHours(selectedDate.getHours());
        newDate.setMinutes(selectedDate.getMinutes());
      }

      // 更新表单数据
      setFormData(prev => ({
        ...prev,
        [field]: newDate.toISOString()
      }));

      // 如果是 iOS 或者是 Android 的时间选择完成，重置为日期模式
      if (Platform.OS === 'ios' || pickerMode === 'time') {
        setPickerMode('date');
      }
    }
  };

  const handleReminderTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowReminderTimePicker(false);
    }

    if (event.type === 'dismissed') {
      return;
    }

    if (selectedDate) {
      const newTime = {
        hour: selectedDate.getHours(),
        minute: selectedDate.getMinutes(),
      };

      setFormData((prev) => ({
        ...prev,
        reminderTime: newTime,
      }));
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={[
        styles.scrollView, 
        { backgroundColor: colors.card }
      ]}>
        {/* Title Input */}
        <View style={styles.formGroup}>
          <Text
            style={[
              styles.label,
              { color: colors.text },
            ]}
          >
            {t.task.title} *
          </Text>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, borderColor: errors.title ? colors.error : colors.border },
            ]}
            value={formData.title}
            onChangeText={(text) => {
              setFormData({ ...formData, title: text });
              if (errors.title) {
                const newErrors = { ...errors };
                delete newErrors.title;
                setErrors(newErrors);
              }
            }}
            placeholder={t.task.title}
            placeholderTextColor={colors.subText}
          />
          {errors.title && (
            <Text style={[styles.errorText, { color: colors.error }]}>{errors.title}</Text>
          )}
        </View>

        {/* Description Input */}
        <View style={styles.formGroup}>
          <Text
            style={[
              styles.label,
              { color: colors.text },
            ]}
          >
            {t.task.description}
          </Text>
          <TextInput
            style={[
              styles.textArea,
              { color: colors.text, borderColor: colors.border },
            ]}
            value={formData.description}
            onChangeText={(text) =>
              setFormData({ ...formData, description: text })
            }
            placeholder={t.task.description}
            placeholderTextColor={colors.subText}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Recurrence Type */}
        <View style={styles.formGroup}>
          <Text
            style={[
              styles.label,
              { color: colors.text },
            ]}
          >
            {t.task.recurrenceType}
          </Text>
          <View style={styles.recurrenceTypeContainer}>
            <TouchableOpacity
              style={[
                styles.recurrenceTypeButton,
                formData.recurrenceType === 'daily' && [styles.recurrenceTypeButtonActive, { backgroundColor: colors.primary }],
                { borderColor: colors.border }
              ]}
              onPress={() => setFormData({ ...formData, recurrenceType: 'daily', recurrenceValue: 1 })}
            >
              <Text
                style={[
                  styles.recurrenceTypeText,
                  formData.recurrenceType === 'daily' && styles.recurrenceTypeTextActive,
                  { color: formData.recurrenceType === 'daily' ? 'white' : colors.text }
                ]}
              >
                {t.task.daily}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.recurrenceTypeButton,
                formData.recurrenceType === 'weekly' && [styles.recurrenceTypeButtonActive, { backgroundColor: colors.primary }],
                { borderColor: colors.border }
              ]}
              onPress={() => setFormData({ ...formData, recurrenceType: 'weekly', recurrenceValue: 1 })}
            >
              <Text
                style={[
                  styles.recurrenceTypeText,
                  formData.recurrenceType === 'weekly' && styles.recurrenceTypeTextActive,
                  { color: formData.recurrenceType === 'weekly' ? 'white' : colors.text }
                ]}
              >
                {t.task.weekly}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.recurrenceTypeButton,
                formData.recurrenceType === 'monthly' && [styles.recurrenceTypeButtonActive, { backgroundColor: colors.primary }],
                { borderColor: colors.border }
              ]}
              onPress={() => setFormData({ ...formData, recurrenceType: 'monthly', recurrenceValue: 1 })}
            >
              <Text
                style={[
                  styles.recurrenceTypeText,
                  formData.recurrenceType === 'monthly' && styles.recurrenceTypeTextActive,
                  { color: formData.recurrenceType === 'monthly' ? 'white' : colors.text }
                ]}
              >
                {t.task.monthly}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.recurrenceTypeButton,
                formData.recurrenceType === 'custom' && [styles.recurrenceTypeButtonActive, { backgroundColor: colors.primary }],
                { borderColor: colors.border }
              ]}
              onPress={() => setFormData({ 
                ...formData, 
                recurrenceType: 'custom', 
                recurrenceValue: 1,
                recurrenceUnit: 'days'
              })}
            >
              <Text
                style={[
                  styles.recurrenceTypeText,
                  formData.recurrenceType === 'custom' && styles.recurrenceTypeTextActive,
                  { color: formData.recurrenceType === 'custom' ? 'white' : colors.text }
                ]}
              >
                {t.task.custom}
              </Text>
            </TouchableOpacity>
          </View>
          
          {formData.recurrenceType === 'custom' && (
            <View style={styles.customRecurrenceContainer}>
              <Text style={[styles.reminderLabel, { color: colors.text }]}>{t.task.every}</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.reminderOffsetInput,
                  { 
                    color: colors.text, 
                    borderColor: errors.recurrenceValue ? colors.error : colors.border
                  }
                ]}
                value={formData.recurrenceValue.toString()}
                onChangeText={(text) => {
                  const value = parseInt(text) || 1;
                  setFormData({ ...formData, recurrenceValue: value });
                }}
                keyboardType="numeric"
                placeholder="1"
                placeholderTextColor={colors.subText}
              />
              <View style={styles.reminderUnitContainer}>
                <TouchableOpacity
                  style={[
                    styles.reminderUnitButton,
                    formData.recurrenceUnit === 'days' && [styles.reminderUnitButtonActive, { backgroundColor: colors.primary }],
                    { borderColor: colors.border }
                  ]}
                  onPress={() => setFormData({ ...formData, recurrenceUnit: 'days' })}
                >
                  <Text
                    style={[
                      styles.reminderUnitText,
                      formData.recurrenceUnit === 'days' && styles.reminderUnitTextActive,
                      { color: formData.recurrenceUnit === 'days' ? 'white' : colors.text }
                    ]}
                  >
                    {t.task.days}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.reminderUnitButton,
                    formData.recurrenceUnit === 'weeks' && [styles.reminderUnitButtonActive, { backgroundColor: colors.primary }],
                    { borderColor: colors.border }
                  ]}
                  onPress={() => setFormData({ ...formData, recurrenceUnit: 'weeks' })}
                >
                  <Text
                    style={[
                      styles.reminderUnitText,
                      formData.recurrenceUnit === 'weeks' && styles.reminderUnitTextActive,
                      { color: formData.recurrenceUnit === 'weeks' ? 'white' : colors.text }
                    ]}
                  >
                    {t.task.weeks}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.reminderUnitButton,
                    formData.recurrenceUnit === 'months' && [styles.reminderUnitButtonActive, { backgroundColor: colors.primary }],
                    { borderColor: colors.border }
                  ]}
                  onPress={() => setFormData({ ...formData, recurrenceUnit: 'months' })}
                >
                  <Text
                    style={[
                      styles.reminderUnitText,
                      formData.recurrenceUnit === 'months' && styles.reminderUnitTextActive,
                      { color: formData.recurrenceUnit === 'months' ? 'white' : colors.text }
                    ]}
                  >
                    {t.task.months}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Start Date */}
        <View style={styles.formGroup}>
          <Text
            style={[
              styles.label,
              { color: colors.text },
            ]}
          >
            {t.task.startDate}
          </Text>
          <TouchableOpacity
            style={[
              styles.input,
              { borderColor: colors.border }
            ]}
            onPress={() => {
              setPickerMode('date');
              setShowStartPicker(true);
            }}
          >
            <Text
              style={[
                styles.dateText,
                { color: colors.text }
              ]}
            >
              {format(new Date(formData.startDate), 'yyyy-MM-dd HH:mm')}
            </Text>
          </TouchableOpacity>
          {showStartPicker && (
            <DateTimePicker
              testID="startDatePicker"
              value={new Date(formData.startDate)}
              mode={pickerMode}
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => handleDateChange(event, date, 'startDate')}
            />
          )}
        </View>

        {/* Due Date */}
        <View style={styles.formGroup}>
          <Text
            style={[
              styles.label,
              { color: colors.text },
            ]}
          >
            {t.task.dueDate}
          </Text>
          <TouchableOpacity
            style={[
              styles.input,
              { 
                borderColor: errors.dueDate ? colors.error : colors.border
              }
            ]}
            onPress={() => {
              setPickerMode('date');
              setShowDuePicker(true);
            }}
          >
            <Text
              style={[
                styles.dateText,
                { color: colors.text }
              ]}
            >
              {format(new Date(formData.dueDate), 'yyyy-MM-dd HH:mm')}
            </Text>
          </TouchableOpacity>
          {showDuePicker && (
            <DateTimePicker
              testID="dueDatePicker"
              value={new Date(formData.dueDate)}
              mode={pickerMode}
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => handleDateChange(event, date, 'dueDate')}
            />
          )}
          {errors.dueDate && (
            <Text style={[styles.errorText, { color: colors.error }]}>{errors.dueDate}</Text>
          )}
        </View>

        {/* Reminder Settings */}
        <View style={styles.formGroup}>
          <Text
            style={[
              styles.label,
              { color: colors.text },
            ]}
          >
            {t.task.reminderSettings}
          </Text>
          <View style={styles.reminderContainer}>
            <View style={styles.reminderOffsetContainer}>
              <Text style={[styles.reminderLabel, { color: colors.text }]}>{t.task.reminderOffset}</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.reminderOffsetInput,
                  { 
                    color: colors.text, 
                    borderColor: errors.reminderOffset ? colors.error : colors.border
                  }
                ]}
                value={formData.reminderOffset.toString()}
                onChangeText={(text) => {
                  const value = parseInt(text) || 0;
                  setFormData({ ...formData, reminderOffset: value });
                }}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.subText}
              />
              <View style={styles.reminderUnitContainer}>
                <TouchableOpacity
                  style={[
                    styles.reminderUnitButton,
                    formData.reminderUnit === 'minutes' && [styles.reminderUnitButtonActive, { backgroundColor: colors.primary }],
                    { borderColor: colors.border }
                  ]}
                  onPress={() => setFormData({ ...formData, reminderUnit: 'minutes' })}
                >
                  <Text
                    style={[
                      styles.reminderUnitText,
                      formData.reminderUnit === 'minutes' && styles.reminderUnitTextActive,
                      { color: formData.reminderUnit === 'minutes' ? 'white' : colors.text }
                    ]}
                  >
                    {t.task.minutes}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.reminderUnitButton,
                    formData.reminderUnit === 'hours' && [styles.reminderUnitButtonActive, { backgroundColor: colors.primary }],
                    { borderColor: colors.border }
                  ]}
                  onPress={() => setFormData({ ...formData, reminderUnit: 'hours' })}
                >
                  <Text
                    style={[
                      styles.reminderUnitText,
                      formData.reminderUnit === 'hours' && styles.reminderUnitTextActive,
                      { color: formData.reminderUnit === 'hours' ? 'white' : colors.text }
                    ]}
                  >
                    {t.task.hours}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.reminderUnitButton,
                    formData.reminderUnit === 'days' && [styles.reminderUnitButtonActive, { backgroundColor: colors.primary }],
                    { borderColor: colors.border }
                  ]}
                  onPress={() => setFormData({ ...formData, reminderUnit: 'days' })}
                >
                  <Text
                    style={[
                      styles.reminderUnitText,
                      formData.reminderUnit === 'days' && styles.reminderUnitTextActive,
                      { color: formData.reminderUnit === 'days' ? 'white' : colors.text }
                    ]}
                  >
                    {t.task.days}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Reminder Time */}
        <View style={styles.formGroup}>
          <Text
            style={[
              styles.label,
              { color: colors.text },
            ]}
          >
            {t.task.reminderTime}
          </Text>
          <TouchableOpacity
            style={[
              styles.input,
              { borderColor: colors.border }
            ]}
            onPress={() => setShowReminderTimePicker(true)}
          >
            <Text
              style={[
                styles.timeText,
                { color: colors.text }
              ]}
            >
              {`${formData.reminderTime.hour.toString().padStart(2, '0')}:${formData.reminderTime.minute.toString().padStart(2, '0')}`}
            </Text>
          </TouchableOpacity>
          {showReminderTimePicker && (
            <DateTimePicker
              testID="reminderTimePicker"
              value={(() => {
                const now = new Date();
                now.setHours(formData.reminderTime.hour, formData.reminderTime.minute, 0, 0);
                return now;
              })()}
              mode="time"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleReminderTimeChange}
            />
          )}
        </View>

        {/* Sync to Calendar Switch */}
        <View style={[styles.switchContainer, { marginTop: 16 }]}>
          <View>
            <Text style={[styles.label, { color: colors.text }]}>{t.task.syncToCalendar}</Text>
            <Text style={[styles.helperText, { color: colors.subText }]}>{t.task.syncToCalendarDesc}</Text>
          </View>
          <Switch
            value={formData.syncToCalendar}
            onValueChange={(value) => setFormData({ ...formData, syncToCalendar: value })}
            trackColor={{ false: '#767577', true: colors.primary + '80' }}
            thumbColor={formData.syncToCalendar ? colors.primary : '#f4f3f4'}
          />
        </View>

        {/* Auto Reset Switch */}
        <View style={[styles.switchContainer, { marginTop: 16 }]}>
          <View>
            <Text style={[styles.label, { color: colors.text }]}>{t.task.autoReset}</Text>
            <Text style={[styles.helperText, { color: colors.subText }]}>{t.task.autoResetDesc}</Text>
          </View>
          <Switch
            value={formData.autoRestart}
            onValueChange={(value) => setFormData({ ...formData, autoRestart: value })}
            trackColor={{ false: '#767577', true: colors.primary + '80' }}
            thumbColor={formData.autoRestart ? colors.primary : '#f4f3f4'}
          />
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton, { backgroundColor: colors.border }]}
            onPress={onCancel}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>{t.common.cancel}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.saveButton, { backgroundColor: colors.primary, opacity: isLoading ? 0.7 : 1 }]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>{isLoading ? t.common.saving : t.common.save}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 40,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    marginLeft: 0,
  },
  saveButton: {
    backgroundColor: '#2196F3',
    marginRight: 0,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 16,
  },
  timeText: {
    fontSize: 16,
  },
  recurrenceTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  recurrenceTypeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  recurrenceTypeButtonActive: {
    borderColor: 'transparent',
  },
  recurrenceTypeText: {
    fontSize: 14,
  },
  recurrenceTypeTextActive: {
    color: 'white',
  },
  reminderContainer: {
    marginTop: 8,
  },
  reminderOffsetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  reminderOffsetInput: {
    width: 80,
    marginRight: 8,
  },
  reminderUnitContainer: {
    flexDirection: 'row',
  },
  reminderUnitButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  reminderUnitButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  reminderUnitText: {
    fontSize: 14,
  },
  reminderUnitTextActive: {
    color: 'white',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helperText: {
    fontSize: 12,
    marginTop: 5,
    color: '#666',
  },
  customRecurrenceContainer: {
    marginTop: 8,
  },
}); 