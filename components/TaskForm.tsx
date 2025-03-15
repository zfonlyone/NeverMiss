import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  useColorScheme,
  ScrollView,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { Task, CreateTaskInput } from '../models/Task';
import { createTask, updateTask } from '../services/taskService';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { scheduleTestNotification } from '../services/notificationService';

interface TaskFormProps {
  task?: Task;
  onClose: () => void;
  onSave: () => void;
  testID?: string;
}

interface ReminderTimePickerProps {
  value: { hour: number; minute: number };
  onChange: (hour: number, minute: number) => void;
  onClose?: () => void;
}

const ReminderTimePicker: React.FC<ReminderTimePickerProps> = ({
  value,
  onChange,
  onClose,
}) => {
  const [date, setDate] = useState(() => {
    const now = new Date();
    now.setHours(value.hour, value.minute, 0, 0);
    return now;
  });

  const handleChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      onClose?.();
    }

    if (event.type === 'dismissed') {
      return;
    }

    if (selectedDate) {
      setDate(selectedDate);
      onChange(selectedDate.getHours(), selectedDate.getMinutes());
    }
  };

  return (
    <DateTimePicker
      testID="reminderTimePicker"
      value={date}
      mode="time"
      is24Hour={true}
      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      onChange={(event: any, date?: Date) => handleChange(event, date)}
    />
  );
};

export default function TaskForm({ task, onClose, onSave }: TaskFormProps) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [isLoading, setIsLoading] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showDuePicker, setShowDuePicker] = useState(false);
  const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [showReminderTime, setShowReminderTime] = useState(false);

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
    dueDate: task?.currentCycle?.dueDate || new Date().toISOString(),
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = '请输入任务标题';
    }

    if (formData.recurrenceValue <= 0) {
      newErrors.recurrenceValue = '重复间隔必须大于0';
    }

    if (formData.reminderOffset < 0) {
      newErrors.reminderOffset = '提醒时间必须大于等于0';
    }

    if (new Date(formData.startDate) >= new Date(formData.dueDate)) {
      newErrors.dueDate = '截止时间必须晚于开始时间';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);
      if (task) {
        await updateTask(task.id, formData);
      } else {
        await createTask(formData);
      }
      onSave();
    } catch (error) {
      console.error('Error saving task:', error);
      setErrors({
        submit: '保存任务失败，请重试',
      });
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

  const testReminder = async () => {
    try {
      const now = new Date();
      const testDate = new Date(now.getTime() + 10000); // 10 seconds from now
      
      await scheduleTestNotification({
        id: task?.id || 0,
        title: formData.title,
        body: formData.description || '任务提醒',
        date: testDate,
      });
      
      Alert.alert(
        '测试提醒已设置',
        '您将在10秒后收到测试通知。请确保已授予应用通知权限。',
        [{ text: '确定' }]
      );
    } catch (error) {
      Alert.alert(
        '设置提醒失败',
        '请确保已授予应用通知权限。',
        [{ text: '确定' }]
      );
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff',
            },
          ]}
        >
          <View style={[
            styles.header,
            {
              borderBottomColor: isDarkMode ? '#2c2c2e' : '#e5e5e5',
            }
          ]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              disabled={isLoading}
              testID="close-form-button"
            >
              <Ionicons
                name="close"
                size={24}
                color={isDarkMode ? '#ffffff' : '#000000'}
              />
            </TouchableOpacity>
            <Text
              style={[
                styles.headerTitle,
                { color: isDarkMode ? '#ffffff' : '#000000' },
              ]}
            >
              {task ? '编辑任务' : '新建任务'}
            </Text>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isLoading}
            >
              <Ionicons
                name="checkmark"
                size={24}
                color={isDarkMode ? '#ffffff' : '#000000'}
              />
            </TouchableOpacity>
          </View>

          <View 
            style={[styles.formContent, { flex: 1 }]}
          >
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={{ paddingVertical: 16 }}
              showsVerticalScrollIndicator={true}
              bounces={false}
              alwaysBounceVertical={false}
            >
              <View style={styles.inputContainer}>
                <Text
                  style={[
                    styles.label,
                    { color: isDarkMode ? '#8e8e93' : '#666666' },
                  ]}
                >
                  标题
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { color: isDarkMode ? '#ffffff' : '#000000' },
                    {
                      borderColor: errors.title
                        ? '#ff3b30'
                        : isDarkMode
                        ? '#2c2c2e'
                        : '#e5e5e5',
                    },
                  ]}
                  value={formData.title}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, title: text }))
                  }
                  placeholder="输入任务标题"
                  placeholderTextColor={isDarkMode ? '#8e8e93' : '#999999'}
                />
                {errors.title && (
                  <Text style={styles.errorText}>{errors.title}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text
                  style={[
                    styles.label,
                    { color: isDarkMode ? '#8e8e93' : '#666666' },
                  ]}
                >
                  描述
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    { color: isDarkMode ? '#ffffff' : '#000000' },
                    {
                      borderColor: isDarkMode ? '#2c2c2e' : '#e5e5e5',
                    },
                  ]}
                  value={formData.description}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, description: text }))
                  }
                  placeholder="输入任务描述（可选）"
                  placeholderTextColor={isDarkMode ? '#8e8e93' : '#999999'}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text
                  style={[
                    styles.label,
                    { color: isDarkMode ? '#8e8e93' : '#666666' },
                  ]}
                >
                  重复类型
                </Text>
                <View style={styles.recurrenceContainer}>
                  <TouchableOpacity
                    style={[
                      styles.recurrenceButton,
                      formData.recurrenceType === 'daily' && styles.recurrenceButtonActive,
                    ]}
                    onPress={() =>
                      setFormData((prev) => ({
                        ...prev,
                        recurrenceType: 'daily',
                        recurrenceValue: 1,
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.recurrenceButtonText,
                        formData.recurrenceType === 'daily' &&
                          styles.recurrenceButtonTextActive,
                      ]}
                    >
                      每天
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.recurrenceButton,
                      formData.recurrenceType === 'weekly' && styles.recurrenceButtonActive,
                    ]}
                    onPress={() =>
                      setFormData((prev) => ({
                        ...prev,
                        recurrenceType: 'weekly',
                        recurrenceValue: 1,
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.recurrenceButtonText,
                        formData.recurrenceType === 'weekly' &&
                          styles.recurrenceButtonTextActive,
                      ]}
                    >
                      每周
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.recurrenceButton,
                      formData.recurrenceType === 'monthly' && styles.recurrenceButtonActive,
                    ]}
                    onPress={() =>
                      setFormData((prev) => ({
                        ...prev,
                        recurrenceType: 'monthly',
                        recurrenceValue: 1,
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.recurrenceButtonText,
                        formData.recurrenceType === 'monthly' &&
                          styles.recurrenceButtonTextActive,
                      ]}
                    >
                      每月
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.recurrenceButton,
                      formData.recurrenceType === 'custom' && styles.recurrenceButtonActive,
                    ]}
                    onPress={() =>
                      setFormData((prev) => ({
                        ...prev,
                        recurrenceType: 'custom',
                        recurrenceValue: 1,
                        recurrenceUnit: 'days',
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.recurrenceButtonText,
                        formData.recurrenceType === 'custom' &&
                          styles.recurrenceButtonTextActive,
                      ]}
                    >
                      自定义
                    </Text>
                  </TouchableOpacity>
                </View>

                {formData.recurrenceType === 'custom' && (
                  <View style={styles.customRecurrence}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.recurrenceInput,
                        {
                          borderColor: isDarkMode ? '#2c2c2e' : '#e5e5e5',
                          backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff',
                          color: isDarkMode ? '#ffffff' : '#000000',
                        },
                      ]}
                      value={formData.recurrenceValue.toString()}
                      onChangeText={(text) =>
                        setFormData((prev) => ({
                          ...prev,
                          recurrenceValue: parseInt(text) || 0,
                        }))
                      }
                      keyboardType="numeric"
                      placeholder="输入数值"
                      placeholderTextColor={isDarkMode ? '#666666' : '#999999'}
                    />
                    <View style={styles.reminderUnitContainer}>
                      <TouchableOpacity
                        style={[
                          styles.recurrenceButton,
                          formData.recurrenceUnit === 'days' && styles.recurrenceButtonActive,
                        ]}
                        onPress={() =>
                          setFormData((prev) => ({
                            ...prev,
                            recurrenceUnit: 'days',
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.recurrenceButtonText,
                            formData.recurrenceUnit === 'days' &&
                              styles.recurrenceButtonTextActive,
                          ]}
                        >
                          天
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.recurrenceButton,
                          formData.recurrenceUnit === 'weeks' && styles.recurrenceButtonActive,
                        ]}
                        onPress={() =>
                          setFormData((prev) => ({
                            ...prev,
                            recurrenceUnit: 'weeks',
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.recurrenceButtonText,
                            formData.recurrenceUnit === 'weeks' &&
                              styles.recurrenceButtonTextActive,
                          ]}
                        >
                          周
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.recurrenceButton,
                          formData.recurrenceUnit === 'months' && styles.recurrenceButtonActive,
                        ]}
                        onPress={() =>
                          setFormData((prev) => ({
                            ...prev,
                            recurrenceUnit: 'months',
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.recurrenceButtonText,
                            formData.recurrenceUnit === 'months' &&
                              styles.recurrenceButtonTextActive,
                          ]}
                        >
                          月
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text
                  style={[
                    styles.label,
                    { color: isDarkMode ? '#8e8e93' : '#666666' },
                  ]}
                >
                  开始时间
                </Text>
                <TouchableOpacity
                  style={[
                    styles.input,
                    styles.dateInput,
                    { borderColor: isDarkMode ? '#2c2c2e' : '#e5e5e5' },
                  ]}
                  onPress={() => {
                    setPickerMode('date');
                    setShowStartPicker(true);
                  }}
                >
                  <Text
                    style={[
                      styles.dateText,
                      { color: isDarkMode ? '#ffffff' : '#000000' },
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

              <View style={styles.inputContainer}>
                <Text
                  style={[
                    styles.label,
                    { color: isDarkMode ? '#8e8e93' : '#666666' },
                  ]}
                >
                  截止时间
                </Text>
                <TouchableOpacity
                  style={[
                    styles.input,
                    styles.dateInput,
                    {
                      borderColor: errors.dueDate
                        ? '#ff3b30'
                        : isDarkMode
                        ? '#2c2c2e'
                        : '#e5e5e5',
                    },
                  ]}
                  onPress={() => {
                    setPickerMode('date');
                    setShowDuePicker(true);
                  }}
                >
                  <Text
                    style={[
                      styles.dateText,
                      { color: isDarkMode ? '#ffffff' : '#000000' },
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
                  <Text style={styles.errorText}>{errors.dueDate}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text
                  style={[
                    styles.label,
                    { color: isDarkMode ? '#8e8e93' : '#666666' },
                  ]}
                >
                  提醒设置
                </Text>
                <View style={styles.reminderContainer}>
                  <View style={styles.reminderOffsetContainer}>
                    <Text style={styles.reminderLabel}>提前</Text>
                    <TextInput
                      style={[
                        styles.input,
                        styles.reminderInput,
                        { color: isDarkMode ? '#ffffff' : '#000000' },
                        {
                          borderColor: errors.reminderOffset
                            ? '#ff3b30'
                            : isDarkMode
                            ? '#2c2c2e'
                            : '#e5e5e5',
                        },
                      ]}
                      value={formData.reminderOffset.toString()}
                      onChangeText={(text) =>
                        setFormData((prev) => ({
                          ...prev,
                          reminderOffset: parseInt(text) || 0,
                        }))
                      }
                      keyboardType="number-pad"
                      placeholder="0"
                      placeholderTextColor={isDarkMode ? '#8e8e93' : '#999999'}
                    />
                    <View style={styles.reminderUnitContainer}>
                      <TouchableOpacity
                        style={[
                          styles.recurrenceButton,
                          formData.reminderUnit === 'minutes' && styles.recurrenceButtonActive,
                        ]}
                        onPress={() =>
                          setFormData((prev) => ({
                            ...prev,
                            reminderUnit: 'minutes',
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.recurrenceButtonText,
                            formData.reminderUnit === 'minutes' &&
                              styles.recurrenceButtonTextActive,
                          ]}
                        >
                          分钟
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.recurrenceButton,
                          formData.reminderUnit === 'hours' && styles.recurrenceButtonActive,
                        ]}
                        onPress={() =>
                          setFormData((prev) => ({
                            ...prev,
                            reminderUnit: 'hours',
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.recurrenceButtonText,
                            formData.reminderUnit === 'hours' &&
                              styles.recurrenceButtonTextActive,
                          ]}
                        >
                          小时
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.recurrenceButton,
                          formData.reminderUnit === 'days' && styles.recurrenceButtonActive,
                        ]}
                        onPress={() =>
                          setFormData((prev) => ({
                            ...prev,
                            reminderUnit: 'days',
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.recurrenceButtonText,
                            formData.reminderUnit === 'days' &&
                              styles.recurrenceButtonTextActive,
                          ]}
                        >
                          天
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.reminderTimeContainer}>
                    <Text style={styles.reminderLabel}>每日提醒时间</Text>
                    <TouchableOpacity
                      style={[
                        styles.input,
                        styles.timeInput,
                        { borderColor: isDarkMode ? '#2c2c2e' : '#e5e5e5' },
                      ]}
                      onPress={() => setShowReminderTimePicker(true)}
                    >
                      <Text
                        style={[
                          styles.timeText,
                          { color: isDarkMode ? '#ffffff' : '#000000' },
                        ]}
                      >
                        {`${formData.reminderTime.hour.toString().padStart(2, '0')}:${formData.reminderTime.minute.toString().padStart(2, '0')}`}
                      </Text>
                    </TouchableOpacity>
                    <Text style={styles.reminderLabel}>提醒</Text>
                  </View>
                </View>
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
                {errors.reminderOffset && (
                  <Text style={styles.errorText}>{errors.reminderOffset}</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.switchRow}>
                  <Text
                    style={[
                      styles.label,
                      { color: isDarkMode ? '#8e8e93' : '#666666' },
                    ]}
                  >
                    启用任务
                  </Text>
                  <Switch
                    value={formData.isActive}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, isActive: value }))
                    }
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.switchRow}>
                  <Text
                    style={[
                      styles.label,
                      { color: isDarkMode ? '#8e8e93' : '#666666' },
                    ]}
                  >
                    自动重置周期
                  </Text>
                  <Switch
                    value={formData.autoRestart}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, autoRestart: value }))
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.helperText,
                    { color: isDarkMode ? '#8e8e93' : '#666666' },
                  ]}
                >
                  完成当前周期后自动创建下一个周期
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text
                  style={[
                    styles.label,
                    { color: isDarkMode ? '#8e8e93' : '#666666' },
                  ]}
                >
                  同步到系统日历
                </Text>
                <View style={styles.switchContainer}>
                  <Switch
                    value={formData.syncToCalendar}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, syncToCalendar: value }))
                    }
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={formData.syncToCalendar ? '#2196F3' : '#f4f3f4'}
                  />
                  <Text
                    style={[
                      styles.switchLabel,
                      { color: isDarkMode ? '#ffffff' : '#000000' },
                    ]}
                  >
                    {formData.syncToCalendar ? '已开启' : '已关闭'}
                  </Text>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <TouchableOpacity
                  style={[
                    styles.testButton,
                    { backgroundColor: isDarkMode ? '#2196F3' : '#2196F3' },
                  ]}
                  onPress={testReminder}
                >
                  <Text style={styles.testButtonText}>测试提醒（10秒后）</Text>
                </TouchableOpacity>
              </View>

              {errors.submit && (
                <Text style={[styles.errorText, styles.submitError]}>
                  {errors.submit}
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '95%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  formContent: {
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  saveButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  datePickerButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
  },
  reminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  reminderInput: {
    width: 80,
  },
  reminderUnitContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    flex: 1,
    marginLeft: 8,
  },
  errorText: {
    color: '#ff3b30',
    marginTop: 4,
  },
  recurrenceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  recurrenceButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  recurrenceButtonActive: {
    backgroundColor: '#2196F3',
  },
  recurrenceButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '500',
  },
  recurrenceButtonTextActive: {
    color: '#ffffff',
  },
  customRecurrence: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  recurrenceInput: {
    width: 80,
  },
  dateInput: {
    justifyContent: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  submitError: {
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  reminderOffsetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reminderTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reminderLabel: {
    fontSize: 16,
    color: '#666666',
  },
  timeInput: {
    width: 100,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 8,
  },
  testButton: {
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 