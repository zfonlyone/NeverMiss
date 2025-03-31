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
  AdvancedRecurrencePattern
} from '../models/Task';
import { format } from 'date-fns';
import { 
  createTask as createTaskService, 
  updateTask as updateTaskService, 
  getTask 
} from '../services/taskService';

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

  // 计算截止日期
  const calculateDueDate = () => {
    if (!isRecurring || useDueDateToCalculate) return;

    try {
      let newDueDate = new Date(startDate);
      
      if (useAdvancedRecurrence) {
        // 高级模式下的日期计算
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
        
        // 基于基础单位计算
        switch(selectedDateType) {
          case 'day':
            // 简单天数增加
            newDueDate.setDate(newDueDate.getDate() + dayValue);
              break;
            
          case 'week':
            if (useSpecialDate) {
              // 特殊日期处理 - 例如找到下一个周末或工作日
              switch(specialDateType) {
                case 'weekend':
                  // 找到下一个周末 (周六或周日)
                  while (newDueDate.getDay() !== 0 && newDueDate.getDay() !== 6) {
                    newDueDate.setDate(newDueDate.getDate() + 1);
                  }
                  // 如果找到的是周六，并且想要下一个完整周末，再加一天到周日
                  if (newDueDate.getDay() === 6) {
                    newDueDate.setDate(newDueDate.getDate() + 1);
                  }
              break;
                case 'workday':
                  // 找到下一个工作日 (周一至周五)
                  while (newDueDate.getDay() === 0 || newDueDate.getDay() === 6) {
                    newDueDate.setDate(newDueDate.getDate() + 1);
                  }
              break;
                // 其他特殊日期类型的处理可以添加在这里
              }
              } else {
              // 普通周处理
              // 找到下一个指定的星期几
              const currentDay = newDueDate.getDay();
              let daysToAdd = (weekDay - currentDay + 7) % 7;
              if (daysToAdd === 0) daysToAdd = 7; // 如果是同一天，加7天
              
              // 加上周数
              daysToAdd += (weekValue - 1) * 7;
              
              newDueDate.setDate(newDueDate.getDate() + daysToAdd);
              }
              break;
            
          case 'month':
            if (useSpecialDate) {
              // 特殊日期处理
              // 这里简化处理，实际可能需要更复杂的逻辑
              newDueDate.setMonth(newDueDate.getMonth() + 1);
            } else {
              // 判断是否是倒数计算
              if (countDirection === 'backward') {
                // 倒数计算 - 例如每月倒数第N天
                // 这里简化处理，真实情况需要更复杂的计算
                const currentDate = newDueDate.getDate();
                const lastDayOfMonth = new Date(newDueDate.getFullYear(), newDueDate.getMonth() + 1, 0).getDate();
                const targetDate = lastDayOfMonth - currentDate;
                
                // 移动到下个月同样位置
                newDueDate.setMonth(newDueDate.getMonth() + monthValue);
                
                // 调整到正确的倒数日期
                const nextLastDayOfMonth = new Date(newDueDate.getFullYear(), newDueDate.getMonth() + 1, 0).getDate();
                newDueDate.setDate(nextLastDayOfMonth - targetDate);
              } else {
                // 正常月份递增
                newDueDate.setMonth(newDueDate.getMonth() + monthValue);
              }
            }
            break;
            
          case 'year':
            if (useSpecialDate) {
              // 特殊年度日期处理
              newDueDate.setFullYear(newDueDate.getFullYear() + yearValue);
            } else {
              // 正常年份递增
              newDueDate.setFullYear(newDueDate.getFullYear() + yearValue);
            }
            break;
      }
    } else {
        // 简单模式下的日期计算 - 保持原有逻辑
        const { type, value = 1 } = recurrencePattern;
        
          switch(type) {
            case 'daily':
            newDueDate.setDate(newDueDate.getDate() + value);
              break;
            case 'weekly':
              if (recurrencePattern.weekDay !== undefined) {
              // 找下一个指定的星期几
              const currentDay = newDueDate.getDay();
                const targetDay = recurrencePattern.weekDay;
              let daysToAdd = (targetDay - currentDay + 7) % 7;
              if (daysToAdd === 0) daysToAdd = 7; // 如果是同一天，加7天
              newDueDate.setDate(newDueDate.getDate() + daysToAdd);
                } else {
              // 每几周
              newDueDate.setDate(newDueDate.getDate() + (value * 7));
              }
              break;
            case 'monthly':
            newDueDate.setMonth(newDueDate.getMonth() + value);
              break;
            case 'yearly':
            newDueDate.setFullYear(newDueDate.getFullYear() + value);
              break;
            default:
            newDueDate.setDate(newDueDate.getDate() + 1);
          }
        }
        
        setDueDate(newDueDate);
      } catch (error) {
        console.error('计算截止日期错误:', error);
    }
  };

  // 计算开始日期
  const calculateStartDate = () => {
    if (!isRecurring || !useDueDateToCalculate) return;

    try {
      let newStartDate = new Date(dueDate);
      
      if (useAdvancedRecurrence) {
        // 高级模式下的日期计算
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
        
        // 基于基础单位计算，但方向相反
        switch(selectedDateType) {
          case 'day':
            // 简单天数减少
            newStartDate.setDate(newStartDate.getDate() - dayValue);
            break;
            
          case 'week':
            if (useSpecialDate) {
              // 特殊日期处理 - 例如找到上一个周末或工作日
              switch(specialDateType) {
                case 'weekend':
                  // 找到上一个周末
                  while (newStartDate.getDay() !== 0 && newStartDate.getDay() !== 6) {
                    newStartDate.setDate(newStartDate.getDate() - 1);
                  }
                  break;
                case 'workday':
                  // 找到上一个工作日
                  while (newStartDate.getDay() === 0 || newStartDate.getDay() === 6) {
                    newStartDate.setDate(newStartDate.getDate() - 1);
                  }
                  break;
                // 其他特殊日期类型的处理
              }
            } else {
              // 普通周处理
              // 找到上一个指定的星期几
              const currentDay = newStartDate.getDay();
              let daysToSubtract = (currentDay - weekDay + 7) % 7;
              if (daysToSubtract === 0) daysToSubtract = 7; // 如果是同一天，减7天
              
              // 加上周数
              daysToSubtract += (weekValue - 1) * 7;
              
              newStartDate.setDate(newStartDate.getDate() - daysToSubtract);
            }
            break;
            
          case 'month':
            if (useSpecialDate) {
              // 特殊日期处理
              newStartDate.setMonth(newStartDate.getMonth() - 1);
    } else {
              // 判断是否是倒数计算
              if (countDirection === 'backward') {
                // 倒数计算
                const currentDate = newStartDate.getDate();
                const lastDayOfMonth = new Date(newStartDate.getFullYear(), newStartDate.getMonth() + 1, 0).getDate();
                const targetDate = lastDayOfMonth - currentDate;
                
                // 移动到上个月
                newStartDate.setMonth(newStartDate.getMonth() - monthValue);
                
                // 调整到正确的倒数日期
                const prevLastDayOfMonth = new Date(newStartDate.getFullYear(), newStartDate.getMonth() + 1, 0).getDate();
                newStartDate.setDate(prevLastDayOfMonth - targetDate);
        } else {
                // 正常月份递减
                newStartDate.setMonth(newStartDate.getMonth() - monthValue);
              }
            }
              break;
            
          case 'year':
            if (useSpecialDate) {
              // 特殊年度日期处理
              newStartDate.setFullYear(newStartDate.getFullYear() - yearValue);
              } else {
              // 正常年份递减
              newStartDate.setFullYear(newStartDate.getFullYear() - yearValue);
              }
              break;
      }
    } else {
        // 简单模式下的日期计算 - 保持原有逻辑
        const { type, value = 1 } = recurrencePattern;
        
          switch(type) {
            case 'daily':
            newStartDate.setDate(newStartDate.getDate() - value);
              break;
            case 'weekly':
              if (recurrencePattern.weekDay !== undefined) {
              // 找上一个指定的星期几
              const currentDay = newStartDate.getDay();
                const targetDay = recurrencePattern.weekDay;
              let daysToSubtract = (currentDay - targetDay + 7) % 7;
              if (daysToSubtract === 0) daysToSubtract = 7; // 如果是同一天，减7天
              newStartDate.setDate(newStartDate.getDate() - daysToSubtract);
                } else {
              // 每几周
              newStartDate.setDate(newStartDate.getDate() - (value * 7));
              }
              break;
            case 'monthly':
            newStartDate.setMonth(newStartDate.getMonth() - value);
              break;
            case 'yearly':
            newStartDate.setFullYear(newStartDate.getFullYear() - value);
              break;
            default:
            newStartDate.setDate(newStartDate.getDate() - 1);
          }
        }
        
        setStartDate(newStartDate);
      } catch (error) {
        console.error('计算开始日期错误:', error);
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
      // 将taskId转换为数字类型，如果可能的话
      const numericTaskId = typeof taskId === 'string' ? parseInt(taskId, 10) : taskId;
      
      console.log(`正在加载任务ID: ${numericTaskId}`);
      const task = await getTask(numericTaskId);
      
      if (task) {
        console.log('成功加载任务:', task.title);
        // 只加载基本信息
        setTitle(task.title);
        setDescription(task.description || '');
        
        if (task.currentCycle) {
          setStartDate(new Date(task.currentCycle.startDate));
          setDueDate(new Date(task.currentCycle.dueDate));
        }
        
        setDateType(task.dateType);
        setIsRecurring(task.isRecurring === true);
        setRecurrencePattern(task.recurrencePattern);
        setUseDueDateToCalculate(task.useDueDateToCalculate || false);
        
        // 加载提醒设置
        setEnableReminder(task.reminderOffset !== undefined && task.reminderOffset > 0);
        if (task.reminderOffset) {
          setReminderOffset(task.reminderOffset);
        }
        if (task.reminderUnit) {
          setReminderUnit(task.reminderUnit);
        }
        
        // 加载任务标签
        if (task.tags && task.tags.length > 0) {
          setTaskLabel(task.tags[0]);
        }
        
        // 加载背景颜色
        if (task.backgroundColor) {
          setCardBackgroundColor(task.backgroundColor);
        }
      } else {
        console.error(`找不到ID为 ${numericTaskId} 的任务`);
        Alert.alert('提示', '找不到指定的任务');
      }
    } catch (error) {
      console.error('加载任务失败:', error);
      Alert.alert('提示', '无法加载任务信息');
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
        setStartDate(now);
        
        // 根据循环设置计算新的截止日期
        if (isRecurring) {
          const oldDueDate = new Date(dueDate);
          setDueDate(oldDueDate); // 先保持原值
          
          // 异步设置开始日期后再计算
          setTimeout(() => {
            calculateDueDate();
          }, 0);
        } else {
          // 非重复任务，默认设置为明天
          const newDueDate = new Date(now);
          newDueDate.setDate(now.getDate() + 1);
          setDueDate(newDueDate);
        }
      } else {
        // 以上一周期截止日期为新周期开始
        const newStartDate = new Date(dueDate);
        setStartDate(newStartDate);
        
        // 根据循环设置计算新的截止日期
        if (isRecurring) {
          // 异步设置开始日期后再计算
          setTimeout(() => {
            calculateDueDate();
          }, 0);
    } else {
          // 非重复任务不应该到这里，但仍处理
          const newDueDate = new Date(newStartDate);
          newDueDate.setDate(newStartDate.getDate() + 1);
          setDueDate(newDueDate);
        }
      }
      } catch (error) {
      console.error('重置任务周期错误:', error);
      Alert.alert('提示', '重置周期失败');
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

  const handleSave = async () => {
    try {
      if (!title.trim()) {
        Alert.alert('提示', '请输入任务标题');
        return;
      }
      
      setIsLoading(true);
      
      // 再次检查任务状态
      const status = checkTaskCycleStatus();
      
      // 准备任务数据
      const taskData: CreateTaskInput = {
        title,
        description,
        startDate: startDate.toISOString(),
        dueDate: dueDate.toISOString(),
        dateType,
        isLunar: dateType === 'lunar',
        isRecurring,
        // 根据模式选择使用哪种循环设置
        recurrencePattern: useAdvancedRecurrence 
          ? {
              type: recurrencePattern.type,
              value: recurrencePattern.value,
              weekDay: recurrencePattern.weekDay,
              advancedPattern: advancedRecurrencePattern
            }
          : recurrencePattern,
        useDueDateToCalculate,
        // 任务状态
        status,
        // 提醒设置
        reminderOffset: enableReminder ? reminderOffset : 0,
        reminderUnit: reminderUnit,
        // 将任务标签保存为标签数组
        tags: taskLabel ? [taskLabel] : [],
        // 背景颜色
        backgroundColor: cardBackgroundColor,
        // 添加必要的默认值
        isActive: true,
        autoRestart: true,
        syncToCalendar: false,
        reminderTime: { hour: 9, minute: 0 },
        reminderDays: 0,
        reminderHours: 0,
        reminderMinutes: enableReminder ? (reminderUnit === 'minutes' ? reminderOffset : 0) : 0
      };
      
      if (isEditMode && taskId) {
        // 将字符串类型的taskId转换为数字
        const numericTaskId = typeof taskId === 'string' ? parseInt(taskId, 10) : taskId;
        await updateTaskService(numericTaskId, taskData as any);
      } else {
        await createTaskService(taskData);
      }
      
      router.push({
        pathname: '/screens/TaskListScreen',
        params: { refresh: 'true' }
      });
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
        <View style={{
          backgroundColor: '#ffffff',
          margin: 12,
          padding: 16,
          borderRadius: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.2,
          shadowRadius: 1.41,
          elevation: 2,
        }}>
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            marginBottom: 16,
            color: '#000000'
          }}>重复设置</Text>
          
          {/* 使用按钮代替开关 */}
          <TouchableOpacity
            style={{
              backgroundColor: isRecurring ? '#e3f2fd' : '#f5f5f5',
              padding: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: isRecurring ? '#2196F3' : '#dddddd',
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
            onPress={() => setIsRecurring(!isRecurring)}
          >
            <Text style={{
              fontSize: 16,
              color: '#000000',
              fontWeight: isRecurring ? 'bold' : 'normal'
            }}>
              {isRecurring ? '已启用重复' : '启用重复'}
            </Text>
            <Ionicons 
              name={isRecurring ? "repeat" : "repeat-outline"} 
              size={24} 
              color={isRecurring ? '#2196F3' : '#666666'} 
            />
          </TouchableOpacity>
          
          {/* 仅当启用重复时显示三种模式选择 */}
          {isRecurring && (
            <>
              <Text style={{
                fontSize: 16,
                fontWeight: '500',
                marginBottom: 12,
                color: '#000000'
              }}>
                重复模式选择
              </Text>
              
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                marginBottom: 16
              }}>
                {[
                  { value: 'simple', label: '简单模式', icon: 'calendar-outline' as const },
                  { value: 'advanced', label: '高级模式', icon: 'options-outline' as const },
                  { value: 'special', label: '特殊日期', icon: 'star-outline' as const }
                ].map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: 
                        (item.value === 'simple' && !useAdvancedRecurrence && !advancedRecurrencePattern.useSpecialDate) || 
                        (item.value === 'advanced' && useAdvancedRecurrence && !advancedRecurrencePattern.useSpecialDate) ||
                        (item.value === 'special' && advancedRecurrencePattern.useSpecialDate)
                          ? '#e3f2fd' : '#f5f5f5',
                      padding: 10,
                      borderRadius: 8,
                      marginRight: 8,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: 
                        (item.value === 'simple' && !useAdvancedRecurrence && !advancedRecurrencePattern.useSpecialDate) || 
                        (item.value === 'advanced' && useAdvancedRecurrence && !advancedRecurrencePattern.useSpecialDate) ||
                        (item.value === 'special' && advancedRecurrencePattern.useSpecialDate)
                          ? '#2196F3' : '#dddddd'
                    }}
                    onPress={() => {
                      if (item.value === 'simple') {
                        setUseAdvancedRecurrence(false);
                        setAdvancedRecurrencePattern({
                          ...advancedRecurrencePattern,
                          useSpecialDate: false
                        });
                      } else if (item.value === 'advanced') {
                        setUseAdvancedRecurrence(true);
                        setAdvancedRecurrencePattern({
                          ...advancedRecurrencePattern,
                          useSpecialDate: false
                        });
                      } else if (item.value === 'special') {
                        setUseAdvancedRecurrence(true);
                        setAdvancedRecurrencePattern({
                          ...advancedRecurrencePattern,
                          useSpecialDate: true
                        });
                      }
                    }}
                  >
                    <Ionicons 
                      name={item.icon as any} 
                      size={20} 
                      color={
                        (item.value === 'simple' && !useAdvancedRecurrence && !advancedRecurrencePattern.useSpecialDate) || 
                        (item.value === 'advanced' && useAdvancedRecurrence && !advancedRecurrencePattern.useSpecialDate) ||
                        (item.value === 'special' && advancedRecurrencePattern.useSpecialDate)
                          ? '#2196F3' : '#666666'
                      } 
                      style={{ marginRight: 8 }}
                    />
                    <Text style={{
                      fontSize: 14,
                      fontWeight: 
                        (item.value === 'simple' && !useAdvancedRecurrence && !advancedRecurrencePattern.useSpecialDate) || 
                        (item.value === 'advanced' && useAdvancedRecurrence && !advancedRecurrencePattern.useSpecialDate) ||
                        (item.value === 'special' && advancedRecurrencePattern.useSpecialDate)
                          ? 'bold' : 'normal',
                      color: 
                        (item.value === 'simple' && !useAdvancedRecurrence && !advancedRecurrencePattern.useSpecialDate) || 
                        (item.value === 'advanced' && useAdvancedRecurrence && !advancedRecurrencePattern.useSpecialDate) ||
                        (item.value === 'special' && advancedRecurrencePattern.useSpecialDate)
                          ? '#2196F3' : '#333333'
                    }}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
        </View>

              {/* 简单模式的设置 */}
              {isRecurring && !useAdvancedRecurrence && !advancedRecurrencePattern.useSpecialDate && (
                <>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '500',
                    marginBottom: 12,
                    color: '#000000'
                  }}>
                    重复类型
                  </Text>
                  
                  <View style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    marginBottom: 16
                  }}>
                    {[
                      { type: 'daily', label: '每天' },
                      { type: 'weekly', label: '每周' },
                      { type: 'monthly', label: '每月' },
                      { type: 'yearly', label: '每年' }
                    ].map((item) => (
                <TouchableOpacity
                        key={item.type}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: recurrencePattern.type === item.type ? '#e3f2fd' : '#f5f5f5',
                          padding: 10,
                          borderRadius: 8,
                          marginRight: 8,
                          marginBottom: 8,
                          borderWidth: 1,
                          borderColor: recurrencePattern.type === item.type ? '#2196F3' : '#dddddd'
                        }}
                        onPress={() => {
                          setRecurrencePattern({
                            ...recurrencePattern,
                            type: item.type as RecurrenceType
                          });
                        }}
                      >
                        <Text style={{
                          fontSize: 14,
                          fontWeight: recurrencePattern.type === item.type ? 'bold' : 'normal',
                          color: recurrencePattern.type === item.type ? '#2196F3' : '#333333'
                        }}>
                          {item.label}
                  </Text>
                </TouchableOpacity>
                    ))}
                  </View>
                  
                  {/* 间隔值设置 */}
                  <View style={{
                    marginBottom: 16
                  }}>
                    <Text style={{
                      fontSize: 14,
                      marginBottom: 8,
                      color: '#666666'
                    }}>
                      间隔设置
                    </Text>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, marginRight: 8 }}>每</Text>
                      <TextInput
                        style={{
                          borderWidth: 1,
                          borderColor: '#dddddd',
                          borderRadius: 8,
                          padding: 8,
                          width: 60,
                          textAlign: 'center',
                          backgroundColor: '#ffffff',
                          fontSize: 14
                        }}
                        value={String(recurrencePattern.value || 1)}
                        onChangeText={(text) => {
                          const value = parseInt(text);
                          if (!isNaN(value) && value > 0) {
                            setRecurrencePattern({
                              ...recurrencePattern,
                              value
                            });
                          }
                        }}
                        keyboardType="numeric"
                      />
                      <Text style={{ fontSize: 14, marginLeft: 8 }}>
                        {recurrencePattern.type === 'daily' ? '天' : 
                         recurrencePattern.type === 'weekly' ? '周' : 
                         recurrencePattern.type === 'monthly' ? '月' : '年'}
                      </Text>
                    </View>
                  </View>
                  
                  {/* 周几选择 - 仅当重复类型为每周时显示 */}
                  {recurrencePattern.type === 'weekly' && (
                    <View style={{
                      marginBottom: 16
                    }}>
                      <Text style={{
                        fontSize: 14,
                        marginBottom: 8,
                        color: '#666666'
                      }}>
                        选择星期几
                      </Text>
                      
                      <View style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap'
                      }}>
                        {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
                <TouchableOpacity
                            key={index}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 18,
                              justifyContent: 'center',
                              alignItems: 'center',
                              backgroundColor: recurrencePattern.weekDay === index ? '#2196F3' : '#f5f5f5',
                              borderWidth: 1,
                              borderColor: recurrencePattern.weekDay === index ? '#2196F3' : '#dddddd',
                              margin: 4
                            }}
                            onPress={() => {
                              setRecurrencePattern({
                                ...recurrencePattern,
                                weekDay: index as WeekDay
                              });
                            }}
                          >
                            <Text style={{
                              color: recurrencePattern.weekDay === index ? '#ffffff' : '#000000',
                              fontWeight: recurrencePattern.weekDay === index ? 'bold' : 'normal'
                            }}>
                              {day}
                  </Text>
                </TouchableOpacity>
                        ))}
              </View>
            </View>
          )}
          
                  {/* 当前重复模式预览 */}
                  <View style={{
                    backgroundColor: '#e3f2fd',
                    padding: 12,
                    borderRadius: 8,
                    marginTop: 8
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
                      {recurrencePattern.type === 'daily' && `每${recurrencePattern.value || 1}天重复一次`}
                      {recurrencePattern.type === 'weekly' && recurrencePattern.weekDay !== undefined && 
                        `每${recurrencePattern.value || 1}周的星期${'日一二三四五六'[recurrencePattern.weekDay]}重复一次`}
                      {recurrencePattern.type === 'weekly' && recurrencePattern.weekDay === undefined && 
                        `每${recurrencePattern.value || 1}周重复一次`}
                      {recurrencePattern.type === 'monthly' && `每${recurrencePattern.value || 1}个月重复一次`}
                      {recurrencePattern.type === 'yearly' && `每${recurrencePattern.value || 1}年重复一次`}
                    </Text>
                  </View>
                </>
              )}
              
              {/* 高级模式的循环设置 */}
              {isRecurring && useAdvancedRecurrence && !advancedRecurrencePattern.useSpecialDate && (
                <>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '500',
                    marginBottom: 12,
                    color: '#000000'
                  }}>
                    高级循环设置
                  </Text>
                  
                  {/* 选择日期基础类型 */}
                  <View style={{
                    marginBottom: 16,
                    backgroundColor: '#ffffff',
                    padding: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#eeeeee',
                  }}>
                    <Text style={{
                      fontSize: 14,
                      marginBottom: 10,
                      color: '#666666',
                      fontWeight: '500'
                    }}>
                      选择基础周期单位
                    </Text>
                    
                    <View style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                    }}>
                      {[
                        { value: 'day', label: '天' },
                        { value: 'week', label: '周' },
                        { value: 'month', label: '月' },
                        { value: 'year', label: '年' }
                      ].map((item) => (
                <TouchableOpacity 
                          key={item.value}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: advancedRecurrencePattern.selectedDateType === item.value ? '#e3f2fd' : '#f5f5f5',
                            padding: 10,
                            borderRadius: 8,
                            marginRight: 8,
                            marginBottom: 8,
                            borderWidth: 1,
                            borderColor: advancedRecurrencePattern.selectedDateType === item.value ? '#2196F3' : '#dddddd',
                          }}
                          onPress={() => {
                            setAdvancedRecurrencePattern({
                              ...advancedRecurrencePattern,
                              selectedDateType: item.value as 'day' | 'week' | 'month' | 'year'
                            });
                          }}
                        >
                          <Text style={{
                            fontSize: 14,
                            fontWeight: advancedRecurrencePattern.selectedDateType === item.value ? 'bold' : 'normal',
                            color: advancedRecurrencePattern.selectedDateType === item.value ? '#2196F3' : '#333333',
                          }}>
                            {item.label}
                          </Text>
                </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  
                  {/* 年循环设置 */}
                  {advancedRecurrencePattern.selectedDateType === 'year' && (
                    <View style={{
                      marginBottom: 16,
                      backgroundColor: '#ffffff',
                      padding: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#eeeeee',
                    }}>
                      <Text style={{
                        fontSize: 14,
                        marginBottom: 10,
                        color: '#666666',
                        fontWeight: '500'
                      }}>
                        年循环
                      </Text>
                      
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center'
                      }}>
                        <Text style={{ fontSize: 14, marginRight: 8 }}>每</Text>
                        <TextInput
                          style={{
                            borderWidth: 1,
                            borderColor: '#dddddd',
                            borderRadius: 8,
                            padding: 8,
                            width: 60,
                            textAlign: 'center',
                            backgroundColor: '#ffffff',
                            fontSize: 14
                          }}
                          value={advancedRecurrencePattern.yearValue.toString()}
                          onChangeText={(text) => {
                            const value = parseInt(text);
                            if (!isNaN(value) && value > 0) {
                              setAdvancedRecurrencePattern({
                                ...advancedRecurrencePattern,
                                yearValue: value
                              });
                            }
                          }}
                          keyboardType="numeric"
                        />
                        <Text style={{ fontSize: 14, marginLeft: 8 }}>年</Text>
              </View>
            </View>
          )}
          
                  {/* 月循环设置 */}
                  {(advancedRecurrencePattern.selectedDateType === 'month' || 
                    advancedRecurrencePattern.selectedDateType === 'year') && (
                    <View style={{
                      marginBottom: 16,
                      backgroundColor: '#ffffff',
                      padding: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#eeeeee',
                    }}>
                      <Text style={{
                        fontSize: 14,
                        marginBottom: 10,
                        color: '#666666',
                        fontWeight: '500'
                      }}>
                        月循环
                      </Text>
                      
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ fontSize: 14, marginRight: 8 }}>每</Text>
                          <TextInput
                            style={{
                              borderWidth: 1,
                              borderColor: '#dddddd',
                              borderRadius: 8,
                              padding: 8,
                              width: 60,
                              textAlign: 'center',
                              backgroundColor: '#ffffff',
                              fontSize: 14
                            }}
                            value={advancedRecurrencePattern.monthValue.toString()}
                            onChangeText={(text) => {
                              const value = parseInt(text);
                              if (!isNaN(value) && value > 0) {
                                setAdvancedRecurrencePattern({
                                  ...advancedRecurrencePattern,
                                  monthValue: value
                                });
                              }
                            }}
                            keyboardType="numeric"
                          />
                          <Text style={{ fontSize: 14, marginLeft: 8 }}>月</Text>
                        </View>
                        
                <TouchableOpacity 
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: advancedRecurrencePattern.countDirection === 'backward' ? '#e3f2fd' : '#f5f5f5',
                            padding: 8,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: advancedRecurrencePattern.countDirection === 'backward' ? '#2196F3' : '#dddddd',
                          }}
                          onPress={() => {
                            setAdvancedRecurrencePattern({
                              ...advancedRecurrencePattern,
                              countDirection: advancedRecurrencePattern.countDirection === 'forward' ? 'backward' : 'forward'
                            });
                          }}
                        >
                          <Text style={{
                            fontSize: 14,
                            fontWeight: advancedRecurrencePattern.countDirection === 'backward' ? 'bold' : 'normal',
                            color: advancedRecurrencePattern.countDirection === 'backward' ? '#2196F3' : '#333333',
                          }}>
                            {advancedRecurrencePattern.countDirection === 'backward' ? '倒数' : '正数'}
                  </Text>
                </TouchableOpacity>
                      </View>
                    </View>
                  )}
                  
                  {/* 周循环设置 */}
                  {(advancedRecurrencePattern.selectedDateType === 'week' || 
                    advancedRecurrencePattern.selectedDateType === 'month' || 
                    advancedRecurrencePattern.selectedDateType === 'year') && (
                    <View style={{
                      marginBottom: 16,
                      backgroundColor: '#ffffff',
                      padding: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#eeeeee',
                    }}>
                      <Text style={{
                        fontSize: 14,
                        marginBottom: 10,
                        color: '#666666',
                        fontWeight: '500'
                      }}>
                        周循环
                      </Text>
                      
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={{ fontSize: 14, marginRight: 8 }}>每</Text>
                        <TextInput
                          style={{
                            borderWidth: 1,
                            borderColor: '#dddddd',
                            borderRadius: 8,
                            padding: 8,
                            width: 60,
                            textAlign: 'center',
                            backgroundColor: '#ffffff',
                            fontSize: 14
                          }}
                          value={advancedRecurrencePattern.weekValue.toString()}
                          onChangeText={(text) => {
                            const value = parseInt(text);
                            if (!isNaN(value) && value > 0) {
                              setAdvancedRecurrencePattern({
                                ...advancedRecurrencePattern,
                                weekValue: value
                              });
                            }
                          }}
                          keyboardType="numeric"
                        />
                        <Text style={{ fontSize: 14, marginLeft: 8 }}>周的</Text>
                      </View>
                      
                      <Text style={{ fontSize: 14, marginBottom: 5, color: '#666666' }}>选择星期几</Text>
                      <View style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        marginTop: 5
                      }}>
                        {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
                <TouchableOpacity 
                            key={index}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 18,
                              justifyContent: 'center',
                              alignItems: 'center',
                              backgroundColor: advancedRecurrencePattern.weekDay === index ? '#2196F3' : '#f5f5f5',
                              borderWidth: 1,
                              borderColor: advancedRecurrencePattern.weekDay === index ? '#2196F3' : '#dddddd',
                              margin: 4
                            }}
                            onPress={() => {
                              setAdvancedRecurrencePattern({
                                ...advancedRecurrencePattern,
                                weekDay: index
                              });
                            }}
                          >
                            <Text style={{
                              color: advancedRecurrencePattern.weekDay === index ? '#ffffff' : '#000000',
                              fontWeight: advancedRecurrencePattern.weekDay === index ? 'bold' : 'normal'
                            }}>
                              {day}
                  </Text>
                </TouchableOpacity>
                        ))}
              </View>
                    </View>
                  )}
                  
                  {/* 天循环设置 */}
                  {advancedRecurrencePattern.selectedDateType === 'day' && (
                    <View style={{
                      marginBottom: 16,
                      backgroundColor: '#ffffff',
                      padding: 12,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#eeeeee',
                    }}>
                      <Text style={{
                        fontSize: 14,
                        marginBottom: 10,
                        color: '#666666',
                        fontWeight: '500'
                      }}>
                        天循环
                      </Text>
                      
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 14, marginRight: 8 }}>每</Text>
                        <TextInput
                          style={{
                            borderWidth: 1,
                            borderColor: '#dddddd',
                            borderRadius: 8,
                            padding: 8,
                            width: 60,
                            textAlign: 'center',
                            backgroundColor: '#ffffff',
                            fontSize: 14
                          }}
                          value={advancedRecurrencePattern.dayValue.toString()}
                          onChangeText={(text) => {
                            const value = parseInt(text);
                            if (!isNaN(value) && value > 0) {
                              setAdvancedRecurrencePattern({
                                ...advancedRecurrencePattern,
                                dayValue: value
                              });
                            }
                          }}
                          keyboardType="numeric"
                        />
                        <Text style={{ fontSize: 14, marginLeft: 8 }}>天</Text>
                      </View>
                    </View>
                  )}
                  
                  {/* 当前设置预览 */}
                  <View style={{
                    backgroundColor: '#e3f2fd',
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 16
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
                      {getAdvancedRecurrenceDescription()}
                </Text>
              </View>
            </>
          )}

              {/* 特殊日期设置 */}
              {isRecurring && advancedRecurrencePattern.useSpecialDate && (
                <>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '500',
                    marginBottom: 12,
                    color: '#000000'
                  }}>
                    特殊日期设置
                  </Text>
                  
                  <View style={{
                    backgroundColor: '#ffffff',
                    padding: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#eeeeee',
                    marginBottom: 16
                  }}>
                    <Text style={{
                      fontSize: 14,
                      marginBottom: 12,
                      color: '#666666',
                      fontWeight: '500'
                    }}>
                      选择特殊日期类型
                    </Text>
                    
                    <View style={{
                      flexDirection: 'row',
                      flexWrap: 'wrap',
                    }}>
                      {[
                        { value: 'weekend', label: '周末', icon: 'sunny-outline' },
                        { value: 'workday', label: '工作日', icon: 'briefcase-outline' },
                        { value: 'holiday', label: '节假日', icon: 'calendar-outline' },
                        { value: 'solarTerm', label: '节气日', icon: 'leaf-outline' }
                      ].map((item) => (
                <TouchableOpacity 
                          key={item.value}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: advancedRecurrencePattern.specialDateType === item.value ? '#e3f2fd' : '#ffffff',
                            padding: 10,
                            borderRadius: 8,
                            marginRight: 8,
                            marginBottom: 8,
                            borderWidth: 1,
                            borderColor: advancedRecurrencePattern.specialDateType === item.value ? '#2196F3' : '#dddddd',
                          }}
                          onPress={() => {
                            setAdvancedRecurrencePattern({
                              ...advancedRecurrencePattern,
                              specialDateType: item.value as 'weekend' | 'workday' | 'holiday' | 'solarTerm'
                            });
                          }}
                        >
                          <Ionicons 
                            name={item.icon as any} 
                            size={18} 
                            color={advancedRecurrencePattern.specialDateType === item.value ? '#2196F3' : '#666666'} 
                            style={{ marginRight: 6 }}
                          />
                          <Text style={{
                            fontSize: 14,
                            fontWeight: advancedRecurrencePattern.specialDateType === item.value ? 'bold' : 'normal',
                            color: advancedRecurrencePattern.specialDateType === item.value ? '#2196F3' : '#333333',
                          }}>
                            {item.label}
                  </Text>
                </TouchableOpacity>
                      ))}
              </View>
              
                    <Text style={{
                      fontSize: 12,
                      marginTop: 12,
                      color: '#666666',
                      fontStyle: 'italic'
                    }}>
                      {advancedRecurrencePattern.specialDateType === 'weekend' && '重复设置将只在周六和周日生效'}
                      {advancedRecurrencePattern.specialDateType === 'workday' && '重复设置将只在周一至周五生效'}
                      {advancedRecurrencePattern.specialDateType === 'holiday' && '重复设置将在法定节假日生效'}
                      {advancedRecurrencePattern.specialDateType === 'solarTerm' && '重复设置将在二十四节气日生效'}
                    </Text>
                  </View>
                  
                  {/* 当前设置预览 */}
                  <View style={{
                    backgroundColor: '#e3f2fd',
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 16
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
                      {advancedRecurrencePattern.specialDateType === 'weekend' && '每周末重复'}
                      {advancedRecurrencePattern.specialDateType === 'workday' && '每个工作日重复'}
                      {advancedRecurrencePattern.specialDateType === 'holiday' && '每个法定节假日重复'}
                      {advancedRecurrencePattern.specialDateType === 'solarTerm' && '每个节气日重复'}
                </Text>
              </View>
            </>
          )}
            </>
          )}
        </View>
        
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
                    if (selectedDate) {
                      setDueDate(selectedDate);
                      // 对于一次性任务，设置开始日期为当前日期
                      setStartDate(new Date());
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
                    if (selectedDate) {
                      setDueDate(selectedDate);
                      // 自动计算开始日期
                      setTimeout(() => calculateStartDate(), 0);
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
                    if (selectedDate) {
                      setStartDate(selectedDate);
                      // 自动计算截止日期
                      setTimeout(() => calculateDueDate(), 0);
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