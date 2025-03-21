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
import {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  RecurrencePattern,
  ReminderUnit,
  ReminderTime,
  DateType,
  WeekDay,
} from '../models/Task';
import { createTask, updateTask } from '../services/taskService';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format, addDays } from 'date-fns';
import { checkPermissionsForFeature, requestPermissionsForFeature } from '../services/permissionService';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import lunarService from '../services/lunarService';

interface TaskFormInlineProps {
  task?: Task;
  onSave: () => void;
  onCancel: () => void;
}

interface FormData extends Omit<CreateTaskInput, 'startDate' | 'dueDate'> {
  startDate: string;
  dueDate: string;
}

interface RecurrencePatternExtended extends RecurrencePattern {
  weekDays?: WeekDay[];
}

export default function TaskFormInline({ task, onSave, onCancel }: TaskFormInlineProps) {
  const { t } = useLanguage();
  const { colors, isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showDuePicker, setShowDuePicker] = useState(false);
  const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [useLunar, setUseLunar] = useState(task?.dateType === 'lunar' || false);

  const [formData, setFormData] = useState<FormData & { recurrencePattern: RecurrencePatternExtended }>({
    title: task?.title || '',
    description: task?.description || '',
    recurrencePattern: task?.recurrencePattern || {
      type: 'daily',
      value: 1,
    },
    reminderOffset: task?.reminderOffset || 30,
    reminderUnit: task?.reminderUnit || 'minutes',
    reminderTime: task?.reminderTime || { hour: 9, minute: 0 },
    dateType: task?.dateType || 'solar',
    isLunar: task?.isLunar || false,
    isRecurring: task?.isRecurring !== undefined ? task.isRecurring : true,
    reminderDays: task?.reminderDays || 0,
    reminderHours: task?.reminderHours || 0,
    reminderMinutes: task?.reminderMinutes || 30,
    isActive: task?.isActive !== undefined ? task?.isActive : true,
    autoRestart: task?.autoRestart !== undefined ? task?.autoRestart : true,
    syncToCalendar: task?.syncToCalendar !== undefined ? task?.syncToCalendar : false,
    startDate: task?.currentCycle?.startDate || new Date().toISOString(),
    dueDate: task?.currentCycle?.dueDate || addDays(new Date(), 1).toISOString(),
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const formatDisplayDate = (dateString: string) => {
    if (useLunar) {
      return lunarService.formatDate(dateString, 'lunar');
    }
    return format(new Date(dateString), 'yyyy-MM-dd HH:mm');
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.title?.trim()) {
      newErrors.title = t.validation.titleRequired;
    }
    
    if (formData.recurrencePattern?.value <= 0) {
      newErrors.recurrenceValue = t.validation.recurrenceValuePositive;
    }
    
    if (formData.reminderOffset < 0) {
      newErrors.reminderOffset = t.validation.reminderOffsetPositive;
    }

    if (new Date(formData.startDate) >= new Date(formData.dueDate)) {
      newErrors.dueDate = t.validation.dueDateAfterStart;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      // 验证输入
      if (!formData.title?.trim()) {
        Alert.alert(t.validation.titleRequired);
        setIsLoading(false);
        return;
      }

      // 准备基础任务数据
      const baseTaskData = {
        title: formData.title,
        description: formData.description,
        recurrencePattern: formData.recurrencePattern,
        dateType: formData.dateType,
        isLunar: formData.isLunar,
        isRecurring: formData.isRecurring,
        reminderOffset: parseInt(formData.reminderOffset.toString()),
        reminderUnit: formData.reminderUnit,
        reminderTime: {
          hour: formData.reminderTime.hour,
          minute: formData.reminderTime.minute
        },
        reminderDays: formData.reminderDays,
        reminderHours: formData.reminderHours,
        reminderMinutes: formData.reminderMinutes,
        isActive: formData.isActive,
        autoRestart: formData.autoRestart,
        syncToCalendar: formData.syncToCalendar
      };

      // Check calendar permissions if needed
      if (formData.syncToCalendar) {
        const hasPermission = await checkPermissionsForFeature('calendar');
        if (!hasPermission) {
          const granted = await requestPermissionsForFeature('calendar');
          if (!granted) {
            Alert.alert(
              t.permissions.calendarPermissionTitle,
              t.permissions.calendarPermissionMessage,
              [{ text: t.common.cancel }]
            );
            baseTaskData.syncToCalendar = false;
          }
        }
      }

      // Check notification permissions
      const hasPermission = await checkPermissionsForFeature('notification');
      if (!hasPermission) {
        const granted = await requestPermissionsForFeature('notification');
        if (!granted) {
          Alert.alert(
            t.permissions.notificationPermissionTitle,
            t.permissions.notificationPermissionMessage,
            [{ text: t.common.cancel }]
          );
          return;
        }
      }

      // Create or update task
      if (task) {
        // Update existing task
        const updateData: UpdateTaskInput = {
          ...baseTaskData
        };
        await updateTask(task.id, updateData);
      } else {
        // Create new task
        const createData: CreateTaskInput = {
          ...baseTaskData,
          startDate: formData.startDate,
          dueDate: formData.dueDate
        };
        await createTask(createData);
      }

      onSave();
    } catch (error) {
      console.error('保存任务时出错:', error);
      Alert.alert(t.common.error, t.task.saveTaskFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate: Date | undefined, field: 'startDate' | 'dueDate') => {
    if (event.type === 'set' && selectedDate) {
      const currentDate = new Date(formData[field]);
      let newDate = new Date(selectedDate);
      
      if (pickerMode === 'date') {
        // Keep the original time when in date mode
        newDate.setHours(currentDate.getHours());
        newDate.setMinutes(currentDate.getMinutes());
      } else {
        // Keep the original date when in time mode
        newDate = new Date(currentDate);
        newDate.setHours(selectedDate.getHours());
        newDate.setMinutes(selectedDate.getMinutes());
      }

      setFormData({
        ...formData,
        [field]: newDate.toISOString(),
        dateType: useLunar ? 'lunar' : 'solar',
      });
    }
    
    if (field === 'startDate') {
      setShowStartPicker(false);
      if (Platform.OS === 'android' && pickerMode === 'date' && event.type === 'set') {
        setPickerMode('time');
        setTimeout(() => setShowStartPicker(true), 100);
      }
    } else {
      setShowDuePicker(false);
      if (Platform.OS === 'android' && pickerMode === 'date' && event.type === 'set') {
        setPickerMode('time');
        setTimeout(() => setShowDuePicker(true), 100);
      }
    }
    
    if (Platform.OS === 'ios' || (pickerMode === 'time' && event.type === 'set')) {
      setPickerMode('date');
    }
  };

  const handleReminderTimeChange = (event: DateTimePickerEvent, selectedDate: Date | undefined) => {
    if (event.type === 'set' && selectedDate) {
      setFormData({
        ...formData,
        reminderTime: {
          hour: selectedDate.getHours(),
          minute: selectedDate.getMinutes(),
        },
      });
    }
    setShowReminderTimePicker(false);
  };

  const handleRecurrenceChange = (pattern: RecurrencePatternExtended) => {
    setFormData({
      ...formData,
      recurrencePattern: pattern,
      isRecurring: true,
    });
  };

  const handleDateTypeChange = (newDateType: DateType) => {
    setUseLunar(newDateType === 'lunar');
    setFormData({
      ...formData,
      dateType: newDateType,
      isLunar: newDateType === 'lunar'
    });
  };

  const renderRecurrenceSettings = () => {
    // 常用重复模式
    const commonPatterns = [
      { label: t.task.daily, type: 'daily', value: 1 },
      { label: t.task.weekly, type: 'weekly', value: 1 },
      { label: t.task.monthly, type: 'monthly', value: 1 },
      { label: t.task.yearly, type: 'yearly', value: 1 },
      { label: t.task.weekdays, type: 'custom', value: 1, custom: 'weekdays' },
      { label: t.task.weekend, type: 'custom', value: 1, custom: 'weekend' },
    ];

    const handleCommonPatternSelect = (pattern: any) => {
      // 处理特殊模式
      if (pattern.custom === 'weekdays') {
        // 周一至周五
        handleRecurrenceChange({ 
          type: 'weekly', 
          value: 1,
          weekDays: [1, 2, 3, 4, 5]  // 周一到周五
        });
        return;
      } else if (pattern.custom === 'weekend') {
        // 周末
        handleRecurrenceChange({ 
          type: 'weekly', 
          value: 1,
          weekDays: [0, 6]  // 周日和周六
        });
        return;
      }

      // 常规模式
      handleRecurrenceChange({
        type: pattern.type,
        value: pattern.value
      });
    };

    return (
      <View style={styles.formSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.task.recurrenceSettings}</Text>
        
        {/* 常用重复模式 */}
        <View style={styles.recurrencePatterns}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {commonPatterns.map((pattern, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.patternButton,
                  (formData.recurrencePattern.type === pattern.type && 
                   formData.recurrencePattern.value === pattern.value &&
                   (
                     (pattern.custom === 'weekdays' && 
                      formData.recurrencePattern.weekDays?.join(',') === [1,2,3,4,5].join(',')) ||
                     (pattern.custom === 'weekend' && 
                      formData.recurrencePattern.weekDays?.join(',') === [0,6].join(',')) ||
                     !pattern.custom
                   )
                  ) && [
                    styles.patternButtonActive,
                    { backgroundColor: colors.primary }
                  ],
                  { borderColor: colors.border }
                ]}
                onPress={() => handleCommonPatternSelect(pattern)}
              >
                <Text
                  style={[
                    styles.patternButtonText,
                    (formData.recurrencePattern.type === pattern.type && 
                    formData.recurrencePattern.value === pattern.value &&
                    (
                      (pattern.custom === 'weekdays' && 
                       formData.recurrencePattern.weekDays?.join(',') === [1,2,3,4,5].join(',')) ||
                      (pattern.custom === 'weekend' && 
                       formData.recurrencePattern.weekDays?.join(',') === [0,6].join(',')) ||
                      !pattern.custom
                    )
                   ) && styles.patternButtonTextActive,
                    { color: (formData.recurrencePattern.type === pattern.type && 
                      formData.recurrencePattern.value === pattern.value &&
                      (
                        (pattern.custom === 'weekdays' && 
                         formData.recurrencePattern.weekDays?.join(',') === [1,2,3,4,5].join(',')) ||
                        (pattern.custom === 'weekend' && 
                         formData.recurrencePattern.weekDays?.join(',') === [0,6].join(',')) ||
                        !pattern.custom
                      )
                     ) ? 'white' : colors.text }
                  ]}
                >
                  {pattern.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* 自定义重复值 */}
        <View style={styles.customRecurrenceContainer}>
          <Text style={[styles.label, { color: colors.text }]}>{t.task.recurrenceValue}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              style={[
                styles.input,
                { 
                  width: 100, 
                  marginRight: 8,
                  color: colors.text, 
                  borderColor: errors.recurrenceValue ? colors.error : colors.border 
                }
              ]}
              value={formData.recurrencePattern.value?.toString() || '1'}
              onChangeText={(text) => {
                const value = parseInt(text) || 1;
                handleRecurrenceChange({ 
                  ...formData.recurrencePattern, 
                  value: value 
                });
              }}
              keyboardType="numeric"
              placeholder="1"
              placeholderTextColor={colors.subText}
            />
            <Text style={{ color: colors.text }}>
              {formData.recurrencePattern.type === 'daily' && t.task.days}
              {formData.recurrencePattern.type === 'weekly' && t.task.weeks}
              {formData.recurrencePattern.type === 'monthly' && t.task.months}
              {formData.recurrencePattern.type === 'yearly' && t.task.years}
            </Text>
          </View>
          {errors.recurrenceValue && (
            <Text style={[styles.errorText, { color: colors.error }]}>{errors.recurrenceValue}</Text>
          )}
        </View>
      </View>
    );
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

        {/* Recurrence Settings */}
        {renderRecurrenceSettings()}

        {/* Start Date */}
        <View style={styles.formGroup}>
          <View style={styles.dateTypeContainer}>
            <Text
              style={[
                styles.label,
                { color: colors.text, flex: 1 },
              ]}
            >
              {t.task.startDate}
            </Text>
            <View style={styles.dateTypeSwitch}>
              <Text style={[styles.dateTypeText, { color: !useLunar ? colors.primary : colors.text }]}>
                {t.task.solarCalendar}
              </Text>
              <Switch
                value={useLunar}
                onValueChange={(value) => {
                  setUseLunar(value);
                  setFormData({
                    ...formData,
                    dateType: value ? 'lunar' : 'solar',
                  });
                }}
                style={styles.switch}
              />
              <Text style={[styles.dateTypeText, { color: useLunar ? colors.primary : colors.text }]}>
                {t.task.lunarCalendar}
              </Text>
            </View>
          </View>
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
              {formatDisplayDate(formData.startDate)}
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
              {formatDisplayDate(formData.dueDate)}
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
  recurrencePatterns: {
    marginVertical: 10,
  },
  patternButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  patternButtonActive: {
    borderWidth: 0,
  },
  patternButtonText: {
    fontSize: 14,
  },
  patternButtonTextActive: {
    fontWeight: 'bold',
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
  formSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
}); 