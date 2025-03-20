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
import SpecialDateSelector from '../components/SpecialDateSelector';
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
  validateTask,
  SpecialDate
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

  // 基本信息
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // 日期类型设置
  const [dateType, setDateType] = useState<DateType>('solar');
  const [isLunar, setIsLunar] = useState(false);
  
  // 循环设置
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>({
    type: 'daily',
    value: 1
  });
  
  // 时间设置
  const [startDate, setStartDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 24*60*60*1000)); // 默认截止日期为明天
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showDueTimePicker, setShowDueTimePicker] = useState(false);
  
  // 提醒设置
  const [reminderOffset, setReminderOffset] = useState(30);
  const [reminderUnit, setReminderUnit] = useState<ReminderUnit>('minutes');
  const [reminderDays, setReminderDays] = useState(0);
  const [reminderHours, setReminderHours] = useState(0);
  const [reminderMinutes, setReminderMinutes] = useState(30);
  const [reminderTime, setReminderTime] = useState({ hour: 9, minute: 0 });
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // 其他设置
  const [isActive, setIsActive] = useState(true);
  const [autoRestart, setAutoRestart] = useState(true);
  const [syncToCalendar, setSyncToCalendar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  
  // 特殊日期设置
  const [specialDate, setSpecialDate] = useState<SpecialDate | null>(null);

  useEffect(() => {
    if (taskId) {
      loadTask();
    }
  }, [taskId]);

  // 根据日期类型更新isLunar
  useEffect(() => {
    setIsLunar(dateType === 'lunar');
  }, [dateType]);

  // 根据提醒单位设置对应的提醒值
  useEffect(() => {
    if (reminderUnit === 'days') {
      setReminderDays(reminderOffset);
      setReminderHours(0);
      setReminderMinutes(0);
    } else if (reminderUnit === 'hours') {
      setReminderDays(0);
      setReminderHours(reminderOffset);
      setReminderMinutes(0);
    } else {
      setReminderDays(0);
      setReminderHours(0);
      setReminderMinutes(reminderOffset);
    }
  }, [reminderOffset, reminderUnit]);

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
        setIsLunar(task.isLunar || false);
        setIsRecurring(task.isRecurring === true);
        setReminderOffset(task.reminderOffset);
        setReminderUnit(task.reminderUnit);
        setReminderDays(task.reminderDays || 0);
        setReminderHours(task.reminderHours || 0);
        setReminderMinutes(task.reminderMinutes || 0);
        setReminderTime(task.reminderTime);
        setIsActive(task.isActive);
        setAutoRestart(task.autoRestart);
        setSyncToCalendar(task.syncToCalendar);
        setTags(task.tags || []);
        setBackgroundColor(task.backgroundColor || '#FFFFFF');
        setSpecialDate(task.specialDate || null);
        
        if (task.currentCycle) {
          setStartDate(new Date(task.currentCycle.startDate));
          setDueDate(new Date(task.currentCycle.dueDate));
        }
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
      const taskData: CreateTaskInput = {
        title,
        description,
        recurrencePattern,
        reminderOffset,
        reminderUnit,
        reminderTime,
        startDate: startDate.toISOString(),
        dueDate: dueDate.toISOString(),
        dateType,
        isLunar: dateType === 'lunar',
        isRecurring,
        reminderDays,
        reminderHours,
        reminderMinutes,
        isActive,
        autoRestart,
        syncToCalendar,
        tags,
        backgroundColor,
        specialDate: specialDate || undefined,
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
        const createInput: CreateTaskInput = {
          ...taskData as any,
          startDate: startDate.toISOString(),
          dueDate: dueDate.toISOString()
        };

        await createTaskService(createInput);
      }

      // 创建完任务后，返回任务列表页面并触发刷新
      router.push({
        pathname: '/tasks',
        params: { refresh: 'true' }
      });
    } catch (error) {
      console.error('Error saving task:', error);
      Alert.alert(t.task.saveTaskFailed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(startDate.getHours(), startDate.getMinutes());
      setStartDate(newDate);
    }
  };

  const handleDueDateChange = (event: any, selectedDate?: Date) => {
    setShowDueDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(dueDate.getHours(), dueDate.getMinutes());
      setDueDate(newDate);
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

  const handleStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(startDate);
      newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setStartDate(newDate);
    }
  };

  const handleDueTimeChange = (event: any, selectedTime?: Date) => {
    setShowDueTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(dueDate);
      newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setDueDate(newDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const handleCancel = () => {
    router.back();
  };

  const handleDateTypeToggle = () => {
    const newDateType = dateType === 'solar' ? 'lunar' : 'solar';
    setDateType(newDateType);
    setIsLunar(newDateType === 'lunar');
  };

  const handleRecurringToggle = () => {
    setIsRecurring(!isRecurring);
    if (!isRecurring && (!recurrencePattern || !recurrencePattern.type)) {
      setRecurrencePattern({
        type: 'daily',
        value: 1
      });
    }
  };

  const handleReminderDaysChange = (text: string) => {
    const value = parseInt(text);
    if (!isNaN(value) && value >= 0) {
      setReminderDays(value);
    }
  };

  const handleReminderHoursChange = (text: string) => {
    const value = parseInt(text);
    if (!isNaN(value) && value >= 0 && value < 24) {
      setReminderHours(value);
    }
  };

  const handleReminderMinutesChange = (text: string) => {
    const value = parseInt(text);
    if (!isNaN(value) && value >= 0 && value < 60) {
      setReminderMinutes(value);
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
        {/* 基本信息部分 */}
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

        {/* 日期类型选择 - 独立卡片 */}
        <View style={[styles.formSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.task.dateType}</Text>
          <View style={[styles.segmentedControl, { backgroundColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                styles.segmentButtonLeft,
                dateType === 'solar' && { backgroundColor: colors.primary }
              ]}
              onPress={() => setDateType('solar')}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  dateType === 'solar' ? { color: '#FFFFFF' } : { color: colors.text }
                ]}
              >
                {t.task.solarCalendar}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                styles.segmentButtonRight,
                dateType === 'lunar' && { backgroundColor: colors.primary }
              ]}
              onPress={() => setDateType('lunar')}
            >
              <Text
                style={[
                  styles.segmentButtonText,
                  dateType === 'lunar' ? { color: '#FFFFFF' } : { color: colors.text }
                ]}
              >
                {t.task.lunarCalendar}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* 循环设置选择 */}
        <View style={[styles.formSection, { backgroundColor: colors.card }]}>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>{t.reminder.recurrenceSettings}</Text>
            <View style={styles.recurringToggle}>
              <Text style={[styles.recurringText, { color: colors.text }]}>
                {isRecurring ? t.common.enabled : t.common.disabled}
              </Text>
              <Switch
                value={isRecurring}
                onValueChange={handleRecurringToggle}
                trackColor={{ false: '#767577', true: colors.primary + '80' }}
                thumbColor={isRecurring ? colors.primary : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
              />
            </View>
          </View>
        </View>
        
        {/* 循环设置部分 */}
        {isRecurring && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={[styles.recurrenceContainer, { backgroundColor: colors.card }]}>
              <RecurrenceSelector
                recurrencePattern={recurrencePattern}
                onRecurrenceChange={setRecurrencePattern}
              />
            </View>
          </View>
        )}

        {/* 日期设置部分 */}
        <View style={[styles.formSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>日期设置</Text>
          
          {isRecurring && (
            <View>
              <Text style={[styles.dateLabel, { color: colors.text, marginTop: 8 }]}>{t.task.startDate}</Text>
              <View style={styles.dateTimeContainer}>
                <TouchableOpacity 
                  style={[styles.dateButton, { borderColor: colors.border }]}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text style={[styles.dateButtonText, { color: colors.text }]}>
                    {formatDate(startDate)}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.timeButton, { borderColor: colors.border }]}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <Text style={[styles.timeButtonText, { color: colors.text }]}>
                    {formatTime(startDate.getHours(), startDate.getMinutes())}
                  </Text>
                  <Ionicons name="time-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          <Text style={[styles.dateLabel, { color: colors.text, marginTop: 8 }]}>{t.task.dueDate}</Text>
          <View style={styles.dateTimeContainer}>
            <TouchableOpacity 
              style={[styles.dateButton, { borderColor: colors.border }]}
              onPress={() => setShowDueDatePicker(true)}
            >
              <Text style={[styles.dateButtonText, { color: colors.text }]}>
                {formatDate(dueDate)}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.timeButton, { borderColor: colors.border }]}
              onPress={() => setShowDueTimePicker(true)}
            >
              <Text style={[styles.timeButtonText, { color: colors.text }]}>
                {formatTime(dueDate.getHours(), dueDate.getMinutes())}
              </Text>
              <Ionicons name="time-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleStartDateChange}
            />
          )}
          
          {showDueDatePicker && (
            <DateTimePicker
              value={dueDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDueDateChange}
            />
          )}
          
          {showStartTimePicker && (
            <DateTimePicker
              value={startDate}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleStartTimeChange}
            />
          )}
          
          {showDueTimePicker && (
            <DateTimePicker
              value={dueDate}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDueTimeChange}
            />
          )}
        </View>

        {/* 特殊日期选择 - 放在日期设置部分下面 */}
        <View style={[styles.formSection, { backgroundColor: colors.card }]}>
          <SpecialDateSelector
            selectedDate={specialDate}
            onDateSelect={setSpecialDate}
            isLunarCalendar={isLunar}
          />
        </View>

        {/* 提醒设置部分 */}
        <View style={[styles.formSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.reminder.reminderSettings}</Text>
          
          <Text style={[styles.dateLabel, { color: colors.text, marginTop: 8 }]}>{t.task.reminderOffset}</Text>
          <View style={styles.dateTimeContainer}>
            <View style={styles.reminderRow}>
              <TextInput
                style={[styles.reminderInput, { borderColor: colors.border, color: colors.text }]}
                value={reminderDays.toString()}
                onChangeText={handleReminderDaysChange}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.subText}
              />
              <Text style={[styles.reminderUnitText, { color: colors.text }]}>{t.task.days}</Text>
              
              <TextInput
                style={[styles.reminderInput, { borderColor: colors.border, color: colors.text }]}
                value={reminderHours.toString()}
                onChangeText={handleReminderHoursChange}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.subText}
              />
              <Text style={[styles.reminderUnitText, { color: colors.text }]}>{t.task.hours}</Text>
              
              <TextInput
                style={[styles.reminderInput, { borderColor: colors.border, color: colors.text }]}
                value={reminderMinutes.toString()}
                onChangeText={handleReminderMinutesChange}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.subText}
              />
              <Text style={[styles.reminderUnitText, { color: colors.text }]}>{t.task.minutes}</Text>
            </View>
          </View>
          
          <Text style={[styles.dateLabel, { color: colors.text, marginTop: 12 }]}>{t.reminder.reminderTime}</Text>
          <TouchableOpacity 
            style={[styles.timePickerButton, { borderColor: colors.border }]}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={[styles.timeButtonText, { color: colors.text }]}>
              {formatTime(reminderTime.hour, reminderTime.minute)}
            </Text>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
          
          {showTimePicker && (
            <DateTimePicker
              value={new Date(new Date().setHours(reminderTime.hour, reminderTime.minute))}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
          )}
        </View>

        {/* 标签选择 */}
        <View style={[styles.formSection, { backgroundColor: colors.card }]}>
          <TagSelector selectedTags={tags} onTagsChange={setTags} />
        </View>

        {/* 颜色选择 */}
        <View style={[styles.formSection, { backgroundColor: colors.card }]}>
          <ColorSelector selectedColor={backgroundColor} onColorChange={setBackgroundColor} />
        </View>

        {/* 其他设置部分 */}
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
    height: 100,
    marginBottom: 10,
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
  timePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flex: 2,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flex: 1,
    marginLeft: 8,
  },
  timeButtonText: {
    fontSize: 16,
    flex: 1,
    textAlign: 'right',
    marginRight: 8,
  },
  dateButtonText: {
    fontSize: 16,
    flex: 1,
    textAlign: 'left',
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#666',
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  reminderInput: {
    width: 60,
    height: 48,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    textAlign: 'center',
  },
  reminderUnitText: {
    fontSize: 16,
    marginLeft: 8,
    marginRight: 16,
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateTypeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTypeText: {
    fontSize: 16,
    marginRight: 8,
  },
  recurringToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recurringText: {
    fontSize: 16,
    marginRight: 8,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    height: 44,
  },
  segmentButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentButtonLeft: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  segmentButtonRight: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  segmentButtonText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
}); 