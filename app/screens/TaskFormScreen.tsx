import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
  Platform
} from 'react-native';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StatusBar } from 'expo-status-bar';
import {
  Task,
  CreateTaskInput,
  DateType,
  RecurrenceType,
  RecurrencePattern,
  WeekDay,
  AdvancedRecurrencePattern,
  UpdateTaskInput
} from '../models/Task';
import { format } from 'date-fns';
import { 
  createTask as createTaskService, 
  updateTask as updateTaskService, 
  getTask 
} from '../services/taskService';
import RecurrencePatternSelector from '../components/RecurrencePatternSelector';
import { recurrenceCalculator } from '../services/recurrenceCalculator';

// 简化版任务表单
export default function TaskFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  // 确保taskId是字符串
  const taskId = params.taskId ? (Array.isArray(params.taskId) ? params.taskId[0] : params.taskId) : undefined;
  const isEditMode = !!taskId;
  const [isLoading, setIsLoading] = useState(false);

  // 基本信息
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // 日期设置
  const [startDate, setStartDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 24*60*60*1000)); // 明天
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  
  // 日期类型
  const [dateType, setDateType] = useState<DateType>('solar');
  
  // 任务标签
  const [taskLabel, setTaskLabel] = useState('');
  
  // 卡片背景颜色
  const [cardBackgroundColor, setCardBackgroundColor] = useState('#ffffff');
  
  // 重复设置 - 简化为最基本的开关
  const [isRecurring, setIsRecurring] = useState(false);
  // 重复设置 - 循环模式详情
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern>({
    type: 'daily',
    value: 1
  });
  // 是否使用截止日期计算开始日期
  const [useDueDateToCalculate, setUseDueDateToCalculate] = useState(false);
  // 是否使用高级循环模式
  const [useAdvancedRecurrence, setUseAdvancedRecurrence] = useState(false);
  // 高级循环设置
  const [advancedRecurrencePattern, setAdvancedRecurrencePattern] = useState<AdvancedRecurrencePattern>({
    // 年
    yearValue: 1,
    // 月
    monthValue: 1,
    // 周
    weekValue: 1,
    // 天
    dayValue: 1,
    // 选择的日期类型: day(天), week(周), month(月), year(年)
    selectedDateType: 'day',
    // 选择的计算方向: forward(正数), backward(倒数)
    countDirection: 'forward',
    // 周几 0-6 表示周日到周六
    weekDay: 0,
    // 是否选择特殊日期
    useSpecialDate: false,
    // 特殊日期类型: weekend(周末), workday(工作日), holiday(节假日), solarTerm(节气日)
    specialDateType: 'weekend',
  });
  
  // 提醒设置
  const [enableReminder, setEnableReminder] = useState(true);
  const [reminderOffset, setReminderOffset] = useState(30);
  const [reminderUnit, setReminderUnit] = useState<'minutes' | 'hours' | 'days'>('minutes');

  // 加载任务详情（如果是编辑模式）
  useEffect(() => {
    if (taskId) {
      loadTask();
    }
  }, [taskId]);

  // 根据开始日期和循环设置自动计算截止日期
  useEffect(() => {
    if (isRecurring && !useDueDateToCalculate) {
      calculateDueDate();
    }
  }, [startDate, recurrencePattern, isRecurring, useDueDateToCalculate]);

  // 根据截止日期和循环设置自动计算开始日期
  useEffect(() => {
    if (isRecurring && useDueDateToCalculate) {
      calculateStartDate();
    }
  }, [dueDate, recurrencePattern, isRecurring, useDueDateToCalculate]);

  // 时间相关参数变化时重新计算日期
  useEffect(() => {
    if (isRecurring) {
      if (useDueDateToCalculate) {
        calculateStartDate();
      } else {
        calculateDueDate();
      }
    }
  }, [recurrencePattern, useAdvancedRecurrence, advancedRecurrencePattern, dateType]);

  // 计算截止日期
  const calculateDueDate = () => {
    if (!isRecurring || useDueDateToCalculate) return;

    try {
      const newDueDate = recurrenceCalculator.calculateDueDate(
        startDate,
        recurrencePattern,
        useAdvancedRecurrence,
        advancedRecurrencePattern,
        dateType
      );
      
      // 验证日期是否有效
      if (isNaN(newDueDate.getTime())) {
        console.error('计算出无效的截止日期');
        // 使用安全的默认值
        const safeDueDate = new Date(startDate);
        safeDueDate.setDate(safeDueDate.getDate() + 1);
        setDueDate(safeDueDate);
        return;
      }
      
      setDueDate(newDueDate);
    } catch (error) {
      console.error('计算截止日期错误:', error);
      // 使用安全的默认值
      const safeDueDate = new Date(startDate);
      safeDueDate.setDate(safeDueDate.getDate() + 1);
      setDueDate(safeDueDate);
    }
  };

  // 计算开始日期
  const calculateStartDate = () => {
    if (!isRecurring || !useDueDateToCalculate) return;

    try {
      const newStartDate = recurrenceCalculator.calculateStartDate(
        dueDate,
        recurrencePattern,
        useAdvancedRecurrence,
        advancedRecurrencePattern,
        dateType
      );
      
      // 验证日期是否有效
      if (isNaN(newStartDate.getTime())) {
        console.error('计算出无效的开始日期');
        // 使用安全的默认值
        const safeStartDate = new Date(dueDate);
        safeStartDate.setDate(safeStartDate.getDate() - 1);
        setStartDate(safeStartDate);
        return;
      }
      
      setStartDate(newStartDate);
    } catch (error) {
      console.error('计算开始日期错误:', error);
      // 使用安全的默认值
      const safeStartDate = new Date(dueDate);
      safeStartDate.setDate(safeStartDate.getDate() - 1);
      setStartDate(safeStartDate);
    }
  };

  // 获取高级循环描述
  const getAdvancedRecurrenceDescription = () => {
    const {
      selectedDateType,
      yearValue,
      monthValue,
      weekValue,
      dayValue,
      weekDay,
      useSpecialDate,
      specialDateType,
      countDirection
    } = advancedRecurrencePattern;
    
    // 特殊日期描述
    if (useSpecialDate) {
      switch(specialDateType) {
        case 'weekend':
          return `每周末重复`;
        case 'workday':
          return `每个工作日重复`;
        case 'holiday':
          return `每个法定节假日重复`;
        case 'solarTerm':
          return `每个节气日重复`;
        default:
          return `使用特殊日期重复`;
      }
    }
    
    // 基于日期类型的描述
    switch(selectedDateType) {
      case 'day':
        return `每 ${dayValue} 天重复一次`;
        
      case 'week':
        return `每 ${weekValue} 周的星期${'日一二三四五六'[weekDay]}重复一次`;
        
      case 'month':
        if (countDirection === 'backward') {
          return `每 ${monthValue} 月的倒数第 ${dayValue} 天重复一次`;
        } else {
          return `每 ${monthValue} 个月的第 ${dayValue} 天重复一次`;
        }
        
      case 'year':
        if (countDirection === 'backward') {
          return `每 ${yearValue} 年的第 ${monthValue} 月的倒数第 ${dayValue} 天重复一次`;
        } else {
          return `每 ${yearValue} 年的第 ${monthValue} 月的第 ${dayValue} 天重复一次`;
        }
        
      default:
        return `自定义重复模式`;
    }
  };

  const loadTask = async () => {
    if (!taskId) return;
    
    try {
      setIsLoading(true);
      // 将taskId转换为数字类型
      const numericTaskId = typeof taskId === 'string' ? parseInt(taskId, 10) : Number(taskId);
      
      const task = await getTask(numericTaskId);
      
      if (task) {
        setTitle(task.title);
        setDescription(task.description || '');
        
        // 确保日期有效
        const taskStartDate = new Date(task.startDate);
        const taskDueDate = new Date(task.dueDate);
        
        if (!isNaN(taskStartDate.getTime())) {
          setStartDate(taskStartDate);
        } else {
          console.warn('任务开始日期无效，使用当前日期');
          setStartDate(new Date());
        }
        
        if (!isNaN(taskDueDate.getTime())) {
          setDueDate(taskDueDate);
        } else {
          console.warn('任务截止日期无效，使用明天');
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          setDueDate(tomorrow);
        }
        
        setIsRecurring(task.isRecurring);
        setRecurrencePattern(task.recurrencePattern);
        
        // 处理高级循环模式
        if (task.recurrencePattern.advancedPattern) {
          setUseAdvancedRecurrence(true);
          setAdvancedRecurrencePattern(task.recurrencePattern.advancedPattern);
        } else {
          setUseAdvancedRecurrence(false);
        }
        
        // 处理计算方向
        if (task.useDueDateToCalculate) {
          setUseDueDateToCalculate(task.useDueDateToCalculate);
        }
        
        // 日期类型
        if (task.dateType) {
          setDateType(task.dateType);
        }
        
        // 提醒设置
        if (task.reminderOffset !== undefined) {
          setReminderOffset(task.reminderOffset);
          setEnableReminder(true);
        } else {
          setEnableReminder(false);
        }
        
        if (task.reminderUnit) {
          setReminderUnit(task.reminderUnit);
        }
        
        // 卡片背景颜色
        if (task.backgroundColor) {
          setCardBackgroundColor(task.backgroundColor);
        }
      } else {
        Alert.alert('提示', '找不到指定的任务');
      }
    } catch (error) {
      console.error('加载任务详情失败:', error);
      Alert.alert('提示', '加载任务详情失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 计算任务当前周期状态
  const checkTaskCycleStatus = () => {
    const now = new Date();
    
    // 定义三种可能的状态
    const TASK_STATUS = {
      PENDING: 'pending', // 当前时间 < 开始日期，任务尚未开始
      ACTIVE: 'active',   // 开始日期 <= 当前时间 <= 截止日期，当前周期内
      OVERDUE: 'overdue'  // 当前时间 > 截止日期，已过期
    };
    
    let status;
    if (now < startDate) {
      status = TASK_STATUS.PENDING;
    } else if (now <= dueDate) {
      status = TASK_STATUS.ACTIVE;
    } else {
      status = TASK_STATUS.OVERDUE;
    }
    
    return status;
  };
  
  // 重置任务周期
  const resetTaskCycle = (useCurrentTime = true) => {
    // 当useCurrentTime为true时，以当前时间为新周期的开始时间
    // 当useCurrentTime为false时，以上一周期的截止日期为新周期的开始时间
    try {
      if (useCurrentTime) {
        const now = new Date();
        
        if (isRecurring) {
          // 先设置开始日期
          const newStartDate = new Date(now);
          
          // 直接计算新的截止日期而不使用状态
          const newDueDate = recurrenceCalculator.calculateDueDate(
            newStartDate,
            recurrencePattern,
            useAdvancedRecurrence,
            advancedRecurrencePattern,
            dateType
          );
          
          // 一次性更新两个状态
          setStartDate(newStartDate);
          setDueDate(newDueDate);
        } else {
          // 非重复任务，默认设置为明天
          const newDueDate = new Date(now);
          newDueDate.setDate(now.getDate() + 1);
          setStartDate(now);
          setDueDate(newDueDate);
        }
      } else {
        // 以上一周期截止日期为新周期开始
        const newStartDate = new Date(dueDate);
        
        if (isRecurring) {
          // 直接计算新的截止日期而不使用状态和setTimeout
          const newDueDate = recurrenceCalculator.calculateDueDate(
            newStartDate,
            recurrencePattern,
            useAdvancedRecurrence,
            advancedRecurrencePattern,
            dateType
          );
          
          // 一次性更新两个状态
          setStartDate(newStartDate);
          setDueDate(newDueDate);
        } else {
          // 非重复任务不应该到这里，但仍处理
          const newDueDate = new Date(newStartDate);
          newDueDate.setDate(newStartDate.getDate() + 1);
          setStartDate(newStartDate);
          setDueDate(newDueDate);
        }
      }
    } catch (error) {
      console.error('重置任务周期错误:', error);
      Alert.alert('提示', '重置周期失败');
      
      // 出错时设置一个安全的默认值
      const safeStartDate = new Date();
      const safeDueDate = new Date();
      safeDueDate.setDate(safeStartDate.getDate() + 1);
      
      setStartDate(safeStartDate);
      setDueDate(safeDueDate);
    }
  };
  
  // 检查任务状态并提供重置选项
  const checkAndResetTaskIfNeeded = () => {
    const status = checkTaskCycleStatus();
    
    if (status === 'overdue') {
      // 任务已过期，提示用户重置
          Alert.alert(
        '任务已过期',
        '当前任务已超过截止日期。请选择如何处理：',
        [
          {
            text: '以当前时间重置',
            onPress: () => resetTaskCycle(true),
            style: 'default'
          },
          {
            text: '自动计算下一周期',
            onPress: () => resetTaskCycle(false),
            style: 'default'
          },
          {
            text: '保持当前状态',
            style: 'cancel'
          }
        ]
      );
    }
  };

  // 加载任务后检查状态
  useEffect(() => {
    if (taskId && !isLoading) {
      // 页面加载完毕后检查任务状态
      checkAndResetTaskIfNeeded();
    }
  }, [taskId, isLoading]);

  // 检查任务是否过期并提示用户
  const checkIfTaskExpired = () => {
    const now = new Date();
    // 检查任务是否已过期
    if (dueDate < now) {
      Alert.alert(
        '任务已过期',
        '您正在创建/编辑一个已过期的任务。请选择操作：',
        [
          {
            text: '更新为当前日期',
            onPress: () => resetTaskCycle(true),
            style: 'default'
          },
          {
            text: '保持原日期',
            style: 'cancel'
          }
        ]
      );
      return true;
    }
    return false;
  };

  // 保存任务
  const handleSave = async () => {
      if (!title.trim()) {
        Alert.alert('提示', '请输入任务标题');
        return;
      }
      
      // 验证日期有效性
      if (isNaN(startDate.getTime()) || isNaN(dueDate.getTime())) {
        Alert.alert('提示', '日期设置无效，请重新设置日期');
        return;
      }
      
      // 确保截止日期不早于开始日期
      if (dueDate < startDate) {
        Alert.alert('提示', '截止日期不能早于开始日期');
        return;
      }
      
      // 检查任务是否过期，如果过期则提示用户
      if (checkIfTaskExpired()) {
        return;
      }
      
    try {
      setIsLoading(true);
      
      // 准备任务数据
      const taskData = {
        title: title.trim(),
        description: description.trim(),
        startDate: startDate.toISOString(),
        dueDate: dueDate.toISOString(),
        isActive: true,
        isRecurring,
        recurrencePattern: {
          ...recurrencePattern,
          // 如果使用高级循环模式，则添加advancedPattern字段
          ...(useAdvancedRecurrence ? { advancedPattern: advancedRecurrencePattern } : {})
        },
        useDueDateToCalculate,
        dateType,
        isLunar: dateType === 'lunar',
        autoRestart: true,
        syncToCalendar: false,
        reminderOffset: enableReminder ? reminderOffset : 0,
        reminderUnit: enableReminder ? reminderUnit : 'minutes',
        reminderTime: { hour: 9, minute: 0 }, // 默认早上9点
        reminderDays: 0,
        reminderHours: 0,
        reminderMinutes: reminderOffset,
        tags: taskLabel ? [taskLabel] : [],
        backgroundColor: cardBackgroundColor
      };
      
      if (isEditMode && taskId) {
        // 编辑模式
        const numericTaskId = typeof taskId === 'string' ? parseInt(taskId, 10) : Number(taskId);
        await updateTaskService(numericTaskId, taskData as UpdateTaskInput);
        Alert.alert('提示', '任务更新成功', [
          { text: '确定', onPress: () => router.back() }
        ]);
      } else {
        // 创建模式
        await createTaskService(taskData as CreateTaskInput);
        Alert.alert('提示', '任务创建成功', [
          { text: '确定', onPress: () => router.back() }
        ]);
      }
    } catch (error) {
      console.error('保存任务失败:', error);
      Alert.alert('提示', '保存任务失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      )}
      
      <StatusBar style="dark" />
      
      {/* 标题栏 */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#2196F3" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? '编辑任务' : '添加任务'}
        </Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={styles.saveButton}
        >
          <Ionicons name="checkmark" size={28} color="#2196F3" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* 基本信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本信息</Text>
          
          <Text style={styles.label}>标题</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="输入任务标题"
          />

          <Text style={styles.label}>描述</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="输入任务描述"
            multiline
          />
        </View>

        {/* 任务标签和背景颜色 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>任务标签和颜色</Text>
          
          {/* 任务标签选择 - 改为预选项和自定义 */}
          <Text style={styles.label}>标签</Text>
          
          {/* 预设标签选项 */}
          <View style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginBottom: 12
          }}>
            {[
              { value: '工作', color: '#2196F3' },
              { value: '学习', color: '#4CAF50' },
              { value: '生活', color: '#FF9800' },
              { value: '重要', color: '#F44336' },
              { value: '紧急', color: '#E91E63' },
              { value: '会议', color: '#9C27B0' }
            ].map((item) => (
              <TouchableOpacity
                key={item.value}
                style={{
                  backgroundColor: taskLabel === item.value ? item.color : '#f5f5f5',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  marginRight: 8,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: taskLabel === item.value ? item.color : '#dddddd',
                }}
                onPress={() => setTaskLabel(item.value)}
              >
                <Text style={{
                  color: taskLabel === item.value ? '#ffffff' : '#333333',
                  fontWeight: taskLabel === item.value ? 'bold' : 'normal',
                  fontSize: 14
                }}>
                  {item.value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* 自定义标签输入 */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16
          }}>
            <TextInput
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: '#dddddd',
                borderRadius: 8,
                padding: 10,
                fontSize: 14,
                backgroundColor: '#ffffff'
              }}
              value={taskLabel}
              onChangeText={setTaskLabel}
              placeholder="自定义标签"
            />
            {taskLabel && taskLabel.trim() !== '' && (
              <TouchableOpacity
                style={{
                  marginLeft: 8,
                  backgroundColor: '#f5f5f5',
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#dddddd'
                }}
                onPress={() => setTaskLabel('')}
              >
                <Ionicons name="close" size={20} color="#666666" />
              </TouchableOpacity>
            )}
          </View>
          
          {/* 背景颜色选择 - 改为圆形预览 */}
          <Text style={styles.label}>卡片背景颜色</Text>
          
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            paddingHorizontal: 8
          }}>
            {[
              { color: '#ffffff', name: '白色' },
              { color: '#f5f5f5', name: '浅灰' },
              { color: '#e3f2fd', name: '浅蓝' },
              { color: '#e8f5e9', name: '浅绿' },
              { color: '#fff3e0', name: '橙色' },
              { color: '#ffebee', name: '浅红' },
              { color: '#f3e5f5', name: '浅紫' },
              { color: '#fffde7', name: '浅黄' }
            ].map((item) => (
              <TouchableOpacity
                key={item.color}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: item.color,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 2,
                  borderColor: cardBackgroundColor === item.color ? '#2196F3' : '#dddddd',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 1,
                  elevation: 1
                }}
                onPress={() => setCardBackgroundColor(item.color)}
              >
                {cardBackgroundColor === item.color && (
                  <Ionicons 
                    name="checkmark" 
                    size={18} 
                    color={item.color === '#ffffff' ? '#2196F3' : '#ffffff'} 
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
          
          {/* 预览效果 */}
          <View style={{
            backgroundColor: cardBackgroundColor,
            padding: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#dddddd',
            alignItems: 'center',
            marginBottom: 8
          }}>
            <Text style={{
              color: cardBackgroundColor === '#ffffff' ? '#000000' : '#333333',
              fontWeight: '500'
            }}>
              预览效果
            </Text>
            {taskLabel && (
              <View style={{
                backgroundColor: '#2196F3',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 16,
                marginTop: 8
              }}>
                <Text style={{ color: '#ffffff', fontSize: 12 }}>
                  {taskLabel}
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {/* 日期类型 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>日期类型</Text>
          
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton, 
                styles.toggleButtonLeft,
                dateType === 'solar' ? styles.toggleButtonActive : null
              ]}
              onPress={() => setDateType('solar')}
            >
              <Text style={dateType === 'solar' ? styles.toggleTextActive : styles.toggleText}>
                公历
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.toggleButton, 
                styles.toggleButtonRight,
                dateType === 'lunar' ? styles.toggleButtonActive : null
              ]}
              onPress={() => setDateType('lunar')}
            >
              <Text style={dateType === 'lunar' ? styles.toggleTextActive : styles.toggleText}>
                农历
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* 重复设置 - 使用最简化的纯按钮实现 */}
        <RecurrencePatternSelector
          isRecurring={isRecurring}
          recurrencePattern={recurrencePattern}
          useAdvancedRecurrence={useAdvancedRecurrence}
          advancedRecurrencePattern={advancedRecurrencePattern}
          onIsRecurringChange={setIsRecurring}
          onRecurrencePatternChange={setRecurrencePattern}
          onUseAdvancedRecurrenceChange={setUseAdvancedRecurrence}
          onAdvancedRecurrencePatternChange={setAdvancedRecurrencePattern}
        />
        
        {/* 日期设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>日期设置</Text>
          
          {/* 只有在重复任务时才显示计算方向设置 */}
          {isRecurring && (
            <TouchableOpacity
              style={{
                backgroundColor: '#f5f5f5',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#dddddd',
                marginBottom: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
              onPress={() => {
                setUseDueDateToCalculate(!useDueDateToCalculate);
                // 切换计算方向后立即重新计算
                if (!useDueDateToCalculate) {
                  calculateStartDate();
                } else {
                  calculateDueDate();
                }
              }}
            >
              <Text style={{
                fontSize: 16,
                color: '#000000'
              }}>
                {useDueDateToCalculate ? '使用截止日期计算开始日期' : '使用开始日期计算截止日期'}
              </Text>
              <Ionicons 
                name="swap-horizontal-outline" 
                size={24} 
                color="#666666" 
              />
            </TouchableOpacity>
          )}
          
          {/* 非重复任务只显示截止日期选择器 */}
          {!isRecurring ? (
            // 一次性任务只显示截止日期选择器
            <>
              <Text style={styles.label}>截止日期</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDueDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {format(dueDate, 'yyyy-MM-dd')}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#666666" />
              </TouchableOpacity>
          
          {showDueDatePicker && (
            <DateTimePicker
              value={dueDate}
              mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDueDatePicker(false);
                    if (selectedDate && !isNaN(selectedDate.getTime())) {
                      setDueDate(selectedDate);
                      // 自动计算开始日期
                      setTimeout(() => calculateStartDate(), 0);
                    } else {
                      console.warn('选择的截止日期无效，保持原值');
                    }
                  }}
                />
              )}
              <Text style={{
                fontSize: 14,
                color: '#666666',
                marginTop: 4,
                fontStyle: 'italic'
              }}>
                一次性任务将以当前日期作为开始日期
              </Text>
            </>
          ) : useDueDateToCalculate ? (
            // 如果是重复任务且使用截止日期计算开始日期，只显示截止日期选择器
            <>
              <Text style={styles.label}>截止日期</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDueDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {format(dueDate, 'yyyy-MM-dd')}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#666666" />
              </TouchableOpacity>
              
              {showDueDatePicker && (
            <DateTimePicker
                  value={dueDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDueDatePicker(false);
                    if (selectedDate && !isNaN(selectedDate.getTime())) {
                      setDueDate(selectedDate);
                      // 自动计算开始日期
                      setTimeout(() => calculateStartDate(), 0);
                    } else {
                      console.warn('选择的截止日期无效，保持原值');
                    }
                  }}
                />
              )}
            </>
          ) : (
            // 如果是重复任务且使用开始日期计算截止日期，只显示开始日期选择器
            <>
              <Text style={styles.label}>开始日期</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {format(startDate, 'yyyy-MM-dd')}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#666666" />
              </TouchableOpacity>
              
              {showStartDatePicker && (
            <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowStartDatePicker(false);
                    if (selectedDate && !isNaN(selectedDate.getTime())) {
                      setStartDate(selectedDate);
                      // 自动计算截止日期
                      setTimeout(() => calculateDueDate(), 0);
                    } else {
                      console.warn('选择的开始日期无效，保持原值');
                    }
                  }}
                />
              )}
            </>
          )}
          
          {/* 当前日期设置显示 */}
          <View style={{
            backgroundColor: '#e3f2fd',
            padding: 12,
            borderRadius: 8,
            marginTop: 16
          }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: '#2196F3',
              marginBottom: 8
            }}>
              当前设置
            </Text>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 4
            }}>
              <Text style={{ fontSize: 14, fontWeight: '500' }}>开始日期：</Text>
              <Text style={{ fontSize: 14 }}>{format(startDate, 'yyyy-MM-dd')}</Text>
            </View>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between'
            }}>
              <Text style={{ fontSize: 14, fontWeight: '500' }}>截止日期：</Text>
              <Text style={{ fontSize: 14 }}>{format(dueDate, 'yyyy-MM-dd')}</Text>
            </View>
          </View>
        </View>

        {/* 提醒设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>提醒设置</Text>
          
          {/* 使用按钮代替开关来启用/禁用提醒 */}
          <TouchableOpacity
            style={{
              backgroundColor: enableReminder ? '#e3f2fd' : '#f5f5f5',
              padding: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: enableReminder ? '#2196F3' : '#dddddd',
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
            onPress={() => setEnableReminder(!enableReminder)}
          >
            <Text style={{
              fontSize: 16,
              color: '#000000',
              fontWeight: enableReminder ? 'bold' : 'normal'
            }}>
              {enableReminder ? '已启用提醒' : '启用提醒'}
            </Text>
            <Ionicons 
              name={enableReminder ? "notifications" : "notifications-outline"} 
              size={24} 
              color={enableReminder ? '#2196F3' : '#666666'} 
            />
          </TouchableOpacity>
          
          {/* 当启用提醒时显示提醒设置 */}
          {enableReminder && (
            <View style={{
              backgroundColor: '#ffffff',
              padding: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#eeeeee',
              marginBottom: 16
            }}>
              <Text style={{
                fontSize: 16,
                fontWeight: '500',
                marginBottom: 12,
                color: '#000000'
              }}>
                提醒时间
              </Text>
              
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 16
              }}>
                <Text style={{ fontSize: 16, marginRight: 8 }}>提前</Text>
              <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#dddddd',
                    borderRadius: 8,
                    padding: 12,
                    width: 80,
                    textAlign: 'center',
                    backgroundColor: '#ffffff',
                    fontSize: 16
                  }}
                  value={reminderOffset.toString()}
                  onChangeText={(text) => {
                    // 确保输入的是数字且大于0
                    const value = parseInt(text);
                    if (!isNaN(value) && value > 0) {
                      setReminderOffset(value);
                    }
                  }}
                keyboardType="numeric"
                />
                
                <View style={{
                  flexDirection: 'row',
                  marginLeft: 12,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 8,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: '#dddddd'
                }}>
                  {[
                    { value: 'minutes', label: '分钟' },
                    { value: 'hours', label: '小时' },
                    { value: 'days', label: '天' }
                  ].map(item => (
          <TouchableOpacity 
                      key={item.value}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        backgroundColor: reminderUnit === item.value ? '#2196F3' : 'transparent',
                      }}
                      onPress={() => setReminderUnit(item.value as 'minutes' | 'hours' | 'days')}
                    >
                      <Text style={{
                        color: reminderUnit === item.value ? '#ffffff' : '#000000',
                        fontWeight: reminderUnit === item.value ? 'bold' : 'normal'
                      }}>
                        {item.label}
            </Text>
          </TouchableOpacity>
                  ))}
        </View>
        </View>

              {/* 提醒设置预览 */}
              <View style={{
                backgroundColor: '#e3f2fd',
                padding: 12,
                borderRadius: 8,
              }}>
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: '#2196F3',
                  marginBottom: 4
                }}>
                  当前设置
                </Text>
                <Text style={{ fontSize: 14 }}>
                  将在
                  {useDueDateToCalculate ? '截止' : '开始'}
                  前 {reminderOffset} {
                    reminderUnit === 'minutes' ? '分钟' : 
                    reminderUnit === 'hours' ? '小时' : '天'
                  }提醒
                </Text>
        </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    backgroundColor: '#ffffff',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#eeeeee',
    borderRadius: 8,
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  toggleButtonLeft: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  toggleButtonRight: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#2196F3',
  },
  toggleText: {
    color: '#333333',
  },
  toggleTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    padding: 12,
  },
  dateButtonText: {
    fontSize: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  typeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#dddddd',
    backgroundColor: '#f9f9f9',
  },
  typeButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  typeButtonText: {
    color: '#333333',
    fontSize: 14,
  },
  typeButtonTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  valueInput: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    width: 80,
    textAlign: 'center',
  },
  weekdayContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  weekdayButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    margin: 4,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#dddddd',
  },
  weekdayButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  weekdayText: {
    color: '#333333',
    fontWeight: '500',
  },
  weekdayTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  previewBox: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 4,
  },
  previewText: {
    fontSize: 14,
  },
}); 