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
import { addDays, addWeeks, addMonths, addYears, subDays, subWeeks, subMonths, subYears } from 'date-fns';
import * as lunarLib from 'lunar-javascript';
import * as lunarService from '../../services/lunarService';

// 获取农历库中的具体类
const { Lunar, Solar, LunarHour } = lunarLib;

interface TaskFormScreenProps {
  taskId?: number;
}

// 日期输入类型枚举
type DateInputType = 'startDate' | 'dueDate';

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
  
  // 日期输入类型（开始日期或截止日期）
  const [dateInputType, setDateInputType] = useState<DateInputType>('dueDate');
  
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

  // 根据开始日期和循环设置自动计算截止日期
  useEffect(() => {
    if (isRecurring && dateInputType === 'startDate') {
      calculateDueDate();
    }
  }, [startDate, recurrencePattern, isRecurring, dateInputType]);

  // 根据截止日期和循环设置自动计算开始日期
  useEffect(() => {
    if (isRecurring && dateInputType === 'dueDate') {
      calculateStartDate();
    }
  }, [dueDate, recurrencePattern, isRecurring, dateInputType]);

  // 计算截止日期
  const calculateDueDate = () => {
    if (!isRecurring || dateInputType !== 'startDate') return;

    if (dateType === 'lunar') {
      // 处理农历日期计算
      try {
        // 获取起始日期的农历信息
        const lunarStartDateObj = Lunar.fromDate(startDate);
        
        // 计算农历到期日期
        let lunarDueDate;
        const { type, value = 1 } = recurrencePattern;
        
        switch(type) {
          case 'daily':
            // 农历天数相加
            lunarDueDate = lunarStartDateObj.next(value);
            break;
          case 'weekly':
            // 农历周相加 (7天)
            lunarDueDate = lunarStartDateObj.next(value * 7);
            break;
          case 'monthly':
            // 农历月相加，会自动处理闰月
            const monthsToAdd = value;
            lunarDueDate = Lunar.fromYmd(
              lunarStartDateObj.getYear() + Math.floor(monthsToAdd / 12),
              ((lunarStartDateObj.getMonth() + monthsToAdd - 1) % 12) + 1,
              Math.min(lunarStartDateObj.getDay(), Lunar.getDaysOfMonth(
                lunarStartDateObj.getYear() + Math.floor((lunarStartDateObj.getMonth() + monthsToAdd - 1) / 12),
                ((lunarStartDateObj.getMonth() + monthsToAdd - 1) % 12) + 1
              ))
            );
            break;
          case 'yearly':
            // 农历年相加
            lunarDueDate = Lunar.fromYmd(
              lunarStartDateObj.getYear() + value,
              lunarStartDateObj.getMonth(),
              Math.min(lunarStartDateObj.getDay(), Lunar.getDaysOfMonth(
                lunarStartDateObj.getYear() + value,
                lunarStartDateObj.getMonth()
              ))
            );
            break;
          case 'weekOfMonth':
            // 对于月中某周某天，默认加一个农历月
            const nextMonthMonthsToAdd = 1;
            lunarDueDate = Lunar.fromYmd(
              lunarStartDateObj.getYear() + Math.floor(nextMonthMonthsToAdd / 12),
              ((lunarStartDateObj.getMonth() + nextMonthMonthsToAdd - 1) % 12) + 1,
              Math.min(lunarStartDateObj.getDay(), Lunar.getDaysOfMonth(
                lunarStartDateObj.getYear() + Math.floor((lunarStartDateObj.getMonth() + nextMonthMonthsToAdd - 1) / 12),
                ((lunarStartDateObj.getMonth() + nextMonthMonthsToAdd - 1) % 12) + 1
              ))
            );
            break;
          case 'custom':
            if (recurrencePattern.unit === 'days') {
              lunarDueDate = lunarStartDateObj.next(value);
            } else if (recurrencePattern.unit === 'weeks') {
              lunarDueDate = lunarStartDateObj.next(value * 7);
            } else if (recurrencePattern.unit === 'months') {
              const customMonthsToAdd = value;
              lunarDueDate = Lunar.fromYmd(
                lunarStartDateObj.getYear() + Math.floor(customMonthsToAdd / 12),
                ((lunarStartDateObj.getMonth() + customMonthsToAdd - 1) % 12) + 1,
                Math.min(lunarStartDateObj.getDay(), Lunar.getDaysOfMonth(
                  lunarStartDateObj.getYear() + Math.floor((lunarStartDateObj.getMonth() + customMonthsToAdd - 1) / 12),
                  ((lunarStartDateObj.getMonth() + customMonthsToAdd - 1) % 12) + 1
                ))
              );
            } else if (recurrencePattern.unit === 'years') {
              lunarDueDate = Lunar.fromYmd(
                lunarStartDateObj.getYear() + value,
                lunarStartDateObj.getMonth(),
                Math.min(lunarStartDateObj.getDay(), Lunar.getDaysOfMonth(
                  lunarStartDateObj.getYear() + value,
                  lunarStartDateObj.getMonth()
                ))
              );
            } else {
              lunarDueDate = lunarStartDateObj.next(1);
            }
            break;
          default:
            lunarDueDate = lunarStartDateObj.next(1);
        }
        
        // 将农历日期转换回公历
        // 使用正确的方法将农历对象转换为公历对象
        const solarDate = lunarDueDate.getSolar();
        const newSolarDueDate = new Date(
          solarDate.getYear(),
          solarDate.getMonth() - 1, // JavaScript月份从0开始
          solarDate.getDay(),
          dueDate.getHours(),
          dueDate.getMinutes(),
          0,
          0
        );
        
        setDueDate(newSolarDueDate);
      } catch (error) {
        console.error('农历日期计算错误:', error);
        Alert.alert('日期计算错误', '农历日期计算出现错误，请重试。');
      }
    } else {
      // 原有的公历计算逻辑
      const newDueDate = new Date(startDate);
      const { type, value = 1 } = recurrencePattern;
      let resultDate: Date;
      
      switch(type) {
        case 'daily':
          resultDate = addDays(newDueDate, value);
          break;
        case 'weekly':
          resultDate = addWeeks(newDueDate, value);
          break;
        case 'monthly':
          resultDate = addMonths(newDueDate, value);
          break;
        case 'yearly':
          resultDate = addYears(newDueDate, value);
          break;
        case 'weekOfMonth':
          // 对于月中某周某天，默认加一个月
          resultDate = addMonths(newDueDate, 1);
          break;
        case 'custom':
          if (recurrencePattern.unit === 'days') {
            resultDate = addDays(newDueDate, value);
          } else if (recurrencePattern.unit === 'weeks') {
            resultDate = addWeeks(newDueDate, value);
          } else if (recurrencePattern.unit === 'months') {
            resultDate = addMonths(newDueDate, value);
          } else if (recurrencePattern.unit === 'years') {
            resultDate = addYears(newDueDate, value);
          } else {
            resultDate = addDays(newDueDate, 1);
          }
          break;
        default:
          resultDate = addDays(newDueDate, 1);
      }
      
      // 保持时间部分一致
      resultDate.setHours(dueDate.getHours(), dueDate.getMinutes(), 0, 0);
      setDueDate(resultDate);
    }
  };

  // 计算开始日期
  const calculateStartDate = () => {
    if (!isRecurring || dateInputType !== 'dueDate') return;

    if (dateType === 'lunar') {
      // 处理农历日期计算
      try {
        // 获取截止日期的农历信息
        const lunarDueDateObj = Lunar.fromDate(dueDate);
        
        // 计算农历开始日期
        let lunarStartDate;
        const { type, value = 1 } = recurrencePattern;
        
        switch(type) {
          case 'daily':
            // 农历天数减少
            lunarStartDate = lunarDueDateObj.next(-value);
            break;
          case 'weekly':
            // 农历周减少 (7天)
            lunarStartDate = lunarDueDateObj.next(-value * 7);
            break;
          case 'monthly':
            // 农历月减少，会自动处理闰月
            const monthsToSub = value;
            let newMonth = lunarDueDateObj.getMonth() - monthsToSub;
            let newYear = lunarDueDateObj.getYear();
            
            while (newMonth <= 0) {
              newMonth += 12;
              newYear--;
            }
            
            lunarStartDate = Lunar.fromYmd(
              newYear,
              newMonth,
              Math.min(lunarDueDateObj.getDay(), Lunar.getDaysOfMonth(newYear, newMonth))
            );
            break;
          case 'yearly':
            // 农历年减少
            lunarStartDate = Lunar.fromYmd(
              lunarDueDateObj.getYear() - value,
              lunarDueDateObj.getMonth(),
              Math.min(lunarDueDateObj.getDay(), Lunar.getDaysOfMonth(
                lunarDueDateObj.getYear() - value,
                lunarDueDateObj.getMonth()
              ))
            );
            break;
          case 'weekOfMonth':
            // 对于月中某周某天，默认减一个农历月
            const prevMonthMonthsToSub = 1;
            let prevMonth = lunarDueDateObj.getMonth() - prevMonthMonthsToSub;
            let prevYear = lunarDueDateObj.getYear();
            
            if (prevMonth <= 0) {
              prevMonth += 12;
              prevYear--;
            }
            
            lunarStartDate = Lunar.fromYmd(
              prevYear,
              prevMonth,
              Math.min(lunarDueDateObj.getDay(), Lunar.getDaysOfMonth(prevYear, prevMonth))
            );
            break;
          case 'custom':
            if (recurrencePattern.unit === 'days') {
              lunarStartDate = lunarDueDateObj.next(-value);
            } else if (recurrencePattern.unit === 'weeks') {
              lunarStartDate = lunarDueDateObj.next(-value * 7);
            } else if (recurrencePattern.unit === 'months') {
              const customMonthsToSub = value;
              let customNewMonth = lunarDueDateObj.getMonth() - customMonthsToSub;
              let customNewYear = lunarDueDateObj.getYear();
              
              while (customNewMonth <= 0) {
                customNewMonth += 12;
                customNewYear--;
              }
              
              lunarStartDate = Lunar.fromYmd(
                customNewYear,
                customNewMonth,
                Math.min(lunarDueDateObj.getDay(), Lunar.getDaysOfMonth(customNewYear, customNewMonth))
              );
            } else if (recurrencePattern.unit === 'years') {
              lunarStartDate = Lunar.fromYmd(
                lunarDueDateObj.getYear() - value,
                lunarDueDateObj.getMonth(),
                Math.min(lunarDueDateObj.getDay(), Lunar.getDaysOfMonth(
                  lunarDueDateObj.getYear() - value,
                  lunarDueDateObj.getMonth()
                ))
              );
            } else {
              lunarStartDate = lunarDueDateObj.next(-1);
            }
            break;
          default:
            lunarStartDate = lunarDueDateObj.next(-1);
        }
        
        // 将农历日期转换回公历
        // 使用正确的方法将农历对象转换为公历对象
        const solarDate = lunarStartDate.getSolar();
        const newSolarStartDate = new Date(
          solarDate.getYear(),
          solarDate.getMonth() - 1, // JavaScript月份从0开始
          solarDate.getDay(),
          startDate.getHours(),
          startDate.getMinutes(),
          0,
          0
        );
        
        setStartDate(newSolarStartDate);
      } catch (error) {
        console.error('农历日期计算错误:', error);
        Alert.alert('日期计算错误', '农历日期计算出现错误，请重试。');
      }
    } else {
      // 原有的公历计算逻辑
      const newStartDate = new Date(dueDate);
      const { type, value = 1 } = recurrencePattern;
      let resultDate: Date;
      
      switch(type) {
        case 'daily':
          resultDate = subDays(newStartDate, value);
          break;
        case 'weekly':
          resultDate = subWeeks(newStartDate, value);
          break;
        case 'monthly':
          resultDate = subMonths(newStartDate, value);
          break;
        case 'yearly':
          resultDate = subYears(newStartDate, value);
          break;
        case 'weekOfMonth':
          // 对于月中某周某天，默认减一个月
          resultDate = subMonths(newStartDate, 1);
          break;
        case 'custom':
          if (recurrencePattern.unit === 'days') {
            resultDate = subDays(newStartDate, value);
          } else if (recurrencePattern.unit === 'weeks') {
            resultDate = subWeeks(newStartDate, value);
          } else if (recurrencePattern.unit === 'months') {
            resultDate = subMonths(newStartDate, value);
          } else if (recurrencePattern.unit === 'years') {
            resultDate = subYears(newStartDate, value);
          } else {
            resultDate = subDays(newStartDate, 1);
          }
          break;
        default:
          resultDate = subDays(newStartDate, 1);
      }
      
      // 保持时间部分一致
      resultDate.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0);
      setStartDate(resultDate);
    }
  };

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
      // 验证截止日期不能早于当前日期
      const currentDate = new Date();
      if (dueDate < currentDate) {
        Alert.alert(
          "错误",
          "截止日期不能早于当前日期。请选择有效的未来日期。",
          [{ text: "确定", style: "default" }]
        );
        return;
      }

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
        Alert.alert('验证错误', errors.join('\n'));
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
      
      // 对于循环任务且选择了输入开始日期，修改开始日期时自动重新计算截止日期
      if (isRecurring && dateInputType === 'startDate') {
        calculateDueDate();
      }
    }
  };

  const handleDueDateChange = (event: any, selectedDate?: Date) => {
    setShowDueDatePicker(false);
    
    if (!selectedDate) return;
    
    const currentDate = new Date();
    const newDate = new Date(selectedDate);
    
    // 验证选择的日期不早于当前日期
    if (newDate < currentDate) {
      Alert.alert(
        "错误",
        "截止日期不能早于当前日期。请选择有效的未来日期。",
        [{ text: "确定", style: "default" }]
      );
      return;
    }
    
    newDate.setHours(dueDate.getHours(), dueDate.getMinutes());
    setDueDate(newDate);
    
    // 对于循环任务且选择了输入截止日期，修改截止日期时自动重新计算开始日期
    if (isRecurring && dateInputType === 'dueDate') {
      calculateStartDate();
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

  // 格式化日期显示
  const formatDate = (date: Date) => {
    if (!date) {
      return '未设置日期';
    }
    
    if (dateType === 'lunar') {
      try {
        // 使用农历显示日期
        const lunar = Lunar.fromDate(date);
        return `${lunar.getYearInGanZhi()}年(${lunar.getYearShengXiao()})${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
      } catch (error) {
        console.error('农历日期格式化错误:', error);
        return date.toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      }
    }
    // 公历显示不变
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // 格式化时间显示
  const formatTime = (date: Date | { hour: number; minute: number } | undefined, dateType: DateType): string => {
    if (!date) return '未设置时间';
    
    let hour: number;
    let minute: number;
    
    if (date instanceof Date) {
      hour = date.getHours();
      minute = date.getMinutes();
    } else {
      hour = date.hour;
      minute = date.minute;
    }
    
    if (hour === undefined || minute === undefined) {
      return '未设置时间';
    }
    
    // 格式化为常规时间格式
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    if (dateType === 'lunar' && date instanceof Date) {
      try {
        // 创建一个新的农历对象
        const lunar = Lunar.fromDate(date);
        
        // 获取时辰名称 (采用农历的时辰表示)
        const timeIndex = Math.floor(hour / 2);
        
        // 农历时辰名称数组 (子丑寅卯...)
        const earthlyBranches = '子丑寅卯辰巳午未申酉戌亥';
        const timeChar = earthlyBranches.charAt(timeIndex % 12);
        
        // 返回农历时辰和标准时间
        return `${timeChar}时 (${timeString})`;
      } catch (error) {
        console.error('农历时间格式化错误:', error);
        return timeString;
      }
    }
    
    return timeString;
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
    const newIsRecurring = !isRecurring;
    setIsRecurring(newIsRecurring);
    
    // 如果开启循环，设置一个初始的循环模式
    if (newIsRecurring) {
      if (!recurrencePattern || !recurrencePattern.type) {
        setRecurrencePattern({
          type: 'daily',
          value: 1
        });
      }
      
      // 根据当前的日期输入类型计算相应的日期
      if (dateInputType === 'startDate') {
        calculateDueDate();
      } else {
        calculateStartDate();
      }
    }
  };

  const handleDateInputTypeChange = (type: DateInputType) => {
    setDateInputType(type);
    
    // 切换后重新计算对应的日期
    if (isRecurring) {
      if (type === 'startDate') {
        calculateDueDate();
      } else {
        calculateStartDate();
      }
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
          <View style={[styles.settingRow]}>
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
            <View style={styles.dateInputTypeContainer}>
              <Text style={[styles.dateLabel, { color: colors.text }]}>选择输入方式：</Text>
              <View style={[styles.segmentedControl, { backgroundColor: colors.border, marginBottom: 16 }]}>
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    styles.segmentButtonLeft,
                    dateInputType === 'startDate' && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => handleDateInputTypeChange('startDate')}
                >
                  <Text
                    style={[
                      styles.segmentButtonText,
                      dateInputType === 'startDate' ? { color: '#FFFFFF' } : { color: colors.text }
                    ]}
                  >
                    输入开始日期
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    styles.segmentButtonRight,
                    dateInputType === 'dueDate' && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => handleDateInputTypeChange('dueDate')}
                >
                  <Text
                    style={[
                      styles.segmentButtonText,
                      dateInputType === 'dueDate' ? { color: '#FFFFFF' } : { color: colors.text }
                    ]}
                  >
                    输入截止日期
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {/* 循环任务且用户选择输入开始日期 */}
          {isRecurring && dateInputType === 'startDate' && (
            <>
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
                    {formatTime(startDate, dateType)}
                  </Text>
                  <Ionicons name="time-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
              
              {/* 显示计算出的截止日期 */}
              <View style={styles.calculatedDueDateContainer}>
                <Text style={[styles.dateLabel, { color: colors.text, marginTop: 8 }]}>{t.task.dueDate}</Text>
                <Text style={[styles.calculatedDueDate, { color: colors.text }]}>
                  {formatDate(dueDate)} {formatTime(dueDate, dateType)}
                </Text>
              </View>
            </>
          )}

          {/* 循环任务且用户选择输入截止日期 */}
          {isRecurring && dateInputType === 'dueDate' && (
            <>
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
                    {formatTime(dueDate, dateType)}
                  </Text>
                  <Ionicons name="time-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
              
              {/* 显示计算出的开始日期 */}
              <View style={styles.calculatedDueDateContainer}>
                <Text style={[styles.dateLabel, { color: colors.text, marginTop: 8 }]}>{t.task.startDate}</Text>
                <Text style={[styles.calculatedDueDate, { color: colors.text }]}>
                  {formatDate(startDate)} {formatTime(startDate, dateType)}
                </Text>
              </View>
            </>
          )}
          
          {/* 一次性任务只显示截止日期输入框 */}
          {!isRecurring && (
            <>
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
                    {formatTime(dueDate, dateType)}
                  </Text>
                  <Ionicons name="time-outline" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </>
          )}
          
          {/* 日期时间选择器 */}
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
              {formatTime(reminderTime, 'solar')}
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  formSection: {
    marginHorizontal: 10,
    marginVertical: 8,
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  labelText: {
    fontSize: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingLabel: {
    fontSize: 16,
  },
  dateLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    flex: 2,
    marginRight: 10,
  },
  dateButtonText: {
    fontSize: 16,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    flex: 1,
  },
  timeButtonText: {
    fontSize: 16,
  },
  calculatedDueDateContainer: {
    marginBottom: 15,
  },
  calculatedDueDate: {
    fontSize: 16,
    fontWeight: '500',
  },
  dateInputTypeContainer: {
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
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  recurringToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recurringText: {
    marginRight: 10,
    fontSize: 14,
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
  headerSaveButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
  dateTypeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTypeText: {
    fontSize: 16,
    marginRight: 8,
  },
}); 