import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';
import {
  RecurrenceType,
  RecurrenceUnit,
  RecurrencePattern,
  WeekDay,
  WeekOfMonth,
  CompositeRecurrencePattern,

} from '../models/Task';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import RNPickerSelect from 'react-native-picker-select';




interface RecurrenceSelectorProps {
  value: RecurrencePattern;
  onChange: (pattern: RecurrencePattern) => void;
  onClose?: () => void;
  fullScreen?: boolean;
}

export default function RecurrenceSelector({
  value,
  onChange,
  onClose,
  fullScreen = false,
}: RecurrenceSelectorProps) {
  const { t } = useLanguage();
  const { colors, isDarkMode } = useTheme();
  
  const [type, setType] = useState<RecurrenceType>(value.type || 'daily');
  const [recurrenceValue, setRecurrenceValue] = useState<number>(value.value || 1);
  const [recurrenceUnit, setRecurrenceUnit] = useState<RecurrenceUnit>(value.unit || 'days');
  const [weekDay, setWeekDay] = useState<WeekDay | undefined>(value.weekDay);
  const [weekDays, setWeekDays] = useState<WeekDay[]>(value.weekDays || []);
  const [monthDay, setMonthDay] = useState<number | undefined>(value.monthDay);
  const [month, setMonth] = useState<number | undefined>(value.month);
  const [weekOfMonth, setWeekOfMonth] = useState<WeekOfMonth | undefined>(value.weekOfMonth);
  const [isCompositeMode, setIsCompositeMode] = useState<boolean>(value.type === 'composite');

  
 
  
  // 组合模式的状态
  const [yearEnabled, setYearEnabled] = useState<boolean>(
    value.type === 'composite' && (value as CompositeRecurrencePattern).yearEnabled || false
  );
  const [yearValue, setYearValue] = useState<number>(
    value.type === 'composite' ? (value as CompositeRecurrencePattern).year || 1 : 1
  );
  
  const [monthEnabled, setMonthEnabled] = useState<boolean>(
    value.type === 'composite' && (value as CompositeRecurrencePattern).monthEnabled || false
  );
  const [monthValue, setMonthValue] = useState<number>(
    value.type === 'composite' ? (value as CompositeRecurrencePattern).month || 1 : 1
  );
  
  const [weekOfMonthEnabled, setWeekOfMonthEnabled] = useState<boolean>(
    value.type === 'composite' && (value as CompositeRecurrencePattern).weekOfMonthEnabled || false
  );
  const [weekOfMonthValue, setWeekOfMonthValue] = useState<WeekOfMonth>(
    value.type === 'composite' ? (value as CompositeRecurrencePattern).weekOfMonth || 1 : 1
  );
  
  const [weekDayEnabled, setWeekDayEnabled] = useState<boolean>(
    value.type === 'composite' && (value as CompositeRecurrencePattern).weekDayEnabled || false
  );
  const [weekDayValue, setWeekDayValue] = useState<WeekDay>(
    value.type === 'composite' ? (value as CompositeRecurrencePattern).weekDay || 1 : 1
  );
  
  const [monthDayEnabled, setMonthDayEnabled] = useState<boolean>(
    value.type === 'composite' && (value as CompositeRecurrencePattern).monthDayEnabled || false
  );
  const [monthDayValue, setMonthDayValue] = useState<number>(
    value.type === 'composite' ? (value as CompositeRecurrencePattern).monthDay || 1 : 1
  );
  
  const [yearDayEnabled, setYearDayEnabled] = useState<boolean>(
    value.type === 'composite' && (value as CompositeRecurrencePattern).yearDayEnabled || false
  );
  const [yearDayValue, setYearDayValue] = useState<number>(
    value.type === 'composite' ? (value as CompositeRecurrencePattern).yearDay || 1 : 1
  );
  
  const [isReverse, setIsReverse] = useState<boolean>(
    value.isReverse || false
  );
  
  const [isLunar, setIsLunar] = useState<boolean>(
    value.isLunar || false
  );
  

  


  useEffect(() => {
    // 更新循环模式
    if (isCompositeMode) {
      // 构建组合模式
      const compositePattern: CompositeRecurrencePattern = {
        type: 'composite',
        value: 1, // 组合模式下这个值没有实际意义
        
        // 年份设置
        yearEnabled,
        year: yearValue,
        
        // 月份设置
        monthEnabled,
        month: monthValue,
        
        // 月中周设置
        weekOfMonthEnabled,
        weekOfMonth: weekOfMonthValue,
        
        // 星期几设置
        weekDayEnabled,
        weekDay: weekDayValue,
        
        // 月中日设置
        monthDayEnabled,
        monthDay: monthDayValue,
        
        // 年中日设置
        yearDayEnabled,
        yearDay: yearDayValue,
        
        // 是否倒数
        isReverse
      };
      
      onChange(compositePattern);
    } else {
      // 基本模式
      const newPattern: RecurrencePattern = {
      type,
        value: recurrenceValue,
        isLunar: isLunar,
      };

      // 根据不同循环类型添加额外属性
      switch (type) {
        case 'custom':
          newPattern.unit = recurrenceUnit;
          break;
          
        case 'weekly':
          if (weekDay !== undefined) {
            newPattern.weekDay = weekDay;
          }
          if (weekDays.length > 0) {
            newPattern.weekDays = weekDays;
          }
          break;
          
        case 'monthly':
          if (monthDay !== undefined) {
            newPattern.monthDay = monthDay;
          }
          break;
          
        case 'weekOfMonth':
          newPattern.month = month;
          newPattern.weekOfMonth = weekOfMonth;
          newPattern.weekDay = weekDay;
          break;
          
      }

      onChange(newPattern);
    }
  }, [
    type, recurrenceValue, recurrenceUnit, weekDay, weekDays, monthDay, month, weekOfMonth,
    isCompositeMode, yearEnabled, yearValue, monthEnabled, monthValue, weekOfMonthEnabled,
    weekOfMonthValue, weekDayEnabled, weekDayValue, monthDayEnabled, monthDayValue,
    yearDayEnabled, yearDayValue, isReverse, isLunar,
  ]);

  // 处理类型切换
  const handleTypeChange = (newType: RecurrenceType) => {
    setType(newType);
    
    // 如果切换到组合模式
    if (newType === 'composite') {
      setIsCompositeMode(true);
    } else {
      setIsCompositeMode(false);
    }
  };

  // 切换星期几选择
  const toggleWeekDay = (day: WeekDay) => {
    const newWeekDays = [...weekDays];
    const index = newWeekDays.indexOf(day);
    
    if (index > -1) {
      newWeekDays.splice(index, 1);
    } else {
      newWeekDays.push(day);
    }
    
    setWeekDays(newWeekDays);
  };

  // 获取星期几名称
  const getWeekDayName = (day: WeekDay): string => {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[day];
  };

  // 获取月份周数名称
  const getWeekOfMonthName = (week: WeekOfMonth): string => {
    const weeks = ['第一周', '第二周', '第三周', '第四周', '最后一周'];
    return weeks[week - 1];
  };

  // 渲染组合模式选择器
  const renderCompositeSelector = () => {
    return (
      <View style={styles.compositeContainer}>
        <Text style={[styles.title, { color: colors.text }]}>组合循环设置</Text>
        
        {/* 年份设置 */}
        <View style={styles.compositeSetting}>
          <View style={styles.switchRow}>
            <Switch 
              value={yearEnabled}
              onValueChange={setYearEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={yearEnabled ? colors.primaryLight : colors.card}
            />
            <Text style={[styles.label, { color: colors.text }]}>每</Text>
            <TextInput
              style={[
                styles.valueInput,
                { color: colors.text, borderColor: colors.border, backgroundColor: yearEnabled ? colors.card : colors.disabled }
              ]}
              value={yearValue.toString()}
              onChangeText={(text) => setYearValue(parseInt(text) || 1)}
              keyboardType="number-pad"
              editable={yearEnabled}
            />
            <Text style={[styles.label, { color: colors.text }]}>年</Text>
          </View>
        </View>
        
        {/* 月份设置 */}
        <View style={styles.compositeSetting}>
          <View style={styles.switchRow}>
            <Switch 
              value={monthEnabled}
              onValueChange={setMonthEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={monthEnabled ? colors.primaryLight : colors.card}
            />
            <Text style={[styles.label, { color: colors.text }]}>每</Text>
            <TextInput
              style={[
                styles.valueInput,
                { color: colors.text, borderColor: colors.border, backgroundColor: monthEnabled ? colors.card : colors.disabled }
              ]}
              value={monthValue.toString()}
              onChangeText={(text) => setMonthValue(parseInt(text) || 1)}
              keyboardType="number-pad"
              editable={monthEnabled}
            />
            <Text style={[styles.label, { color: colors.text }]}>月</Text>
          </View>
        </View>
        
        {/* 月中第几周设置 */}
        <View style={styles.compositeSetting}>
          <View style={styles.switchRow}>
            <Switch 
              value={weekOfMonthEnabled}
              onValueChange={setWeekOfMonthEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={weekOfMonthEnabled ? colors.primaryLight : colors.card}
            />
            <Text style={[styles.label, { color: colors.text }]}>月中</Text>
            <RNPickerSelect
              value={weekOfMonthValue}
              onValueChange={(value) => value && setWeekOfMonthValue(value as WeekOfMonth)}
              items={[
                { label: '第一周', value: 1 },
                { label: '第二周', value: 2 },
                { label: '第三周', value: 3 },
                { label: '第四周', value: 4 },
                { label: '最后一周', value: 5 }
              ]}
              style={{
                inputIOS: {
                  color: colors.text,
                  paddingVertical: 12,
                  paddingHorizontal: 10,
                  backgroundColor: weekOfMonthEnabled ? colors.card : colors.disabled,
                  borderRadius: 8,
                  width: 100,
                },
                inputAndroid: {
                  color: colors.text,
                  padding: 10,
                  backgroundColor: weekOfMonthEnabled ? colors.card : colors.disabled,
                  borderRadius: 8,
                  width: 100,
                },
              }}
              disabled={!weekOfMonthEnabled}
            />
          </View>
        </View>
        
        {/* 星期几设置 */}
        <View style={styles.compositeSetting}>
          <View style={styles.switchRow}>
          <Switch
              value={weekDayEnabled}
              onValueChange={setWeekDayEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={weekDayEnabled ? colors.primaryLight : colors.card}
            />
            <Text style={[styles.label, { color: colors.text }]}>星期</Text>
            <RNPickerSelect
              value={weekDayValue}
              onValueChange={(value) => value !== null && setWeekDayValue(value as WeekDay)}
              items={[
                { label: '星期日', value: 0 },
                { label: '星期一', value: 1 },
                { label: '星期二', value: 2 },
                { label: '星期三', value: 3 },
                { label: '星期四', value: 4 },
                { label: '星期五', value: 5 },
                { label: '星期六', value: 6 }
              ]}
              style={{
                inputIOS: {
                  color: colors.text,
                  paddingVertical: 12,
                  paddingHorizontal: 10,
                  backgroundColor: weekDayEnabled ? colors.card : colors.disabled,
                  borderRadius: 8,
                  width: 100,
                },
                inputAndroid: {
                  color: colors.text,
                  padding: 10,
                  backgroundColor: weekDayEnabled ? colors.card : colors.disabled,
                  borderRadius: 8,
                  width: 100,
                },
              }}
              disabled={!weekDayEnabled}
          />
        </View>
        </View>
        
        {/* 月中日设置 */}
        <View style={styles.compositeSetting}>
          <View style={styles.switchRow}>
            <Switch 
              value={monthDayEnabled}
              onValueChange={setMonthDayEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={monthDayEnabled ? colors.primaryLight : colors.card}
            />
            <Text style={[styles.label, { color: colors.text }]}>每月</Text>
            <TextInput
                style={[
                styles.valueInput,
                { color: colors.text, borderColor: colors.border, backgroundColor: monthDayEnabled ? colors.card : colors.disabled }
              ]}
              value={monthDayValue.toString()}
              onChangeText={(text) => setMonthDayValue(parseInt(text) || 1)}
              keyboardType="number-pad"
              editable={monthDayEnabled}
            />
            <Text style={[styles.label, { color: colors.text }]}>日</Text>
          </View>
        </View>
        
        {/* 年中日设置 */}
        <View style={styles.compositeSetting}>
          <View style={styles.switchRow}>
            <Switch 
              value={yearDayEnabled}
              onValueChange={setYearDayEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={yearDayEnabled ? colors.primaryLight : colors.card}
            />
            <Text style={[styles.label, { color: colors.text }]}>一年中第</Text>
            <TextInput
                  style={[
                styles.valueInput,
                { color: colors.text, borderColor: colors.border, backgroundColor: yearDayEnabled ? colors.card : colors.disabled }
              ]}
              value={yearDayValue.toString()}
              onChangeText={(text) => setYearDayValue(parseInt(text) || 1)}
              keyboardType="number-pad"
              editable={yearDayEnabled}
            />
            <Text style={[styles.label, { color: colors.text }]}>天</Text>
          </View>
        </View>
        
        {/* 倒数设置 */}
        <View style={styles.compositeSetting}>
          <View style={styles.switchRow}>
            <Switch 
              value={isReverse}
              onValueChange={setIsReverse}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isReverse ? colors.primaryLight : colors.card}
            />
            <Text style={[styles.label, { color: colors.text }]}>使用倒数计算</Text>
          </View>
        </View>
        
        {/* 当前组合设置的预览 */}
        <View style={styles.preview}>
          <Text style={[styles.previewTitle, { color: colors.primary }]}>当前设置:</Text>
          <Text style={[styles.previewText, { color: colors.text }]}>
            {[
              yearEnabled ? `每${yearValue}年` : '',
              monthEnabled ? `每${monthValue}月` : '',
              weekOfMonthEnabled ? getWeekOfMonthName(weekOfMonthValue) : '',
              weekDayEnabled ? getWeekDayName(weekDayValue) : '',
              monthDayEnabled ? `每月${monthDayValue}日` : '',
              yearDayEnabled ? `每年第${yearDayValue}天` : '',
              isReverse ? '(倒数)' : ''
            ].filter(Boolean).join(' ')}
                </Text>
          </View>
      </View>
    );
  };

  // 渲染基本模式选择器
  const renderBasicSelector = () => {
    return (
      <View>
        {/* 循环类型选择 */}
      <View style={styles.section}>
          <Text style={[styles.title, { color: colors.text }]}>循环类型</Text>
          <View style={styles.typeContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'daily' && styles.typeButtonActive,
                  type === 'daily' && { backgroundColor: colors.primary },
                ]}
                onPress={() => handleTypeChange('daily')}
              >
                <Text style={[
                  styles.typeText,
                  type === 'daily' && styles.typeTextActive,
                  { color: type === 'daily' ? '#fff' : colors.text }
                ]}>天</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                  style={[
                  styles.typeButton,
                  type === 'weekly' && styles.typeButtonActive,
                  type === 'weekly' && { backgroundColor: colors.primary },
                ]}
                onPress={() => handleTypeChange('weekly')}
              >
                <Text style={[
                  styles.typeText,
                  type === 'weekly' && styles.typeTextActive,
                  { color: type === 'weekly' ? '#fff' : colors.text }
                ]}>周</Text>
              </TouchableOpacity>
              
            <TouchableOpacity
              style={[
                  styles.typeButton,
                  type === 'monthly' && styles.typeButtonActive,
                  type === 'monthly' && { backgroundColor: colors.primary },
                ]}
                onPress={() => handleTypeChange('monthly')}
              >
                <Text style={[
                  styles.typeText,
                  type === 'monthly' && styles.typeTextActive,
                  { color: type === 'monthly' ? '#fff' : colors.text }
                ]}>月</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'yearly' && styles.typeButtonActive,
                  type === 'yearly' && { backgroundColor: colors.primary },
                ]}
                onPress={() => handleTypeChange('yearly')}
              >
                <Text style={[
                  styles.typeText,
                  type === 'yearly' && styles.typeTextActive,
                  { color: type === 'yearly' ? '#fff' : colors.text }
                ]}>年</Text>
            </TouchableOpacity>
              
            <TouchableOpacity
              style={[
                styles.typeButton,
                  type === 'weekOfMonth' && styles.typeButtonActive,
                  type === 'weekOfMonth' && { backgroundColor: colors.primary },
                ]}
                onPress={() => handleTypeChange('weekOfMonth')}
              >
                <Text style={[
                  styles.typeText,
                  type === 'weekOfMonth' && styles.typeTextActive,
                  { color: type === 'weekOfMonth' ? '#fff' : colors.text }
                ]}>月中周</Text>
            </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'custom' && styles.typeButtonActive,
                  type === 'custom' && { backgroundColor: colors.primary },
                ]}
                onPress={() => handleTypeChange('custom')}
              >
                <Text style={[
                  styles.typeText,
                  type === 'custom' && styles.typeTextActive,
                  { color: type === 'custom' ? '#fff' : colors.text }
                ]}>自定义</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                  style={[
                  styles.typeButton,
                  type === 'composite' && styles.typeButtonActive,
                  type === 'composite' && { backgroundColor: colors.primary },
                ]}
                onPress={() => handleTypeChange('composite')}
              >
                <Text style={[
                  styles.typeText,
                  type === 'composite' && styles.typeTextActive,
                  { color: type === 'composite' ? '#fff' : colors.text }
                ]}>组合模式</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
          </View>

        {/* 循环值设置 */}
        {type !== 'weekOfMonth' && type !== 'composite' && (
          <View style={styles.section}>
            <Text style={[styles.title, { color: colors.text }]}>
              {type === 'daily' && '间隔天数'}
              {type === 'weekly' && '间隔周数'}
              {type === 'monthly' && '间隔月数'}
              {type === 'yearly' && '间隔年数'}
              {type === 'custom' && '循环间隔'}
            </Text>
            
            <View style={styles.valueContainer}>
            <TextInput
                style={[styles.valueInput, { color: colors.text, borderColor: colors.border }]}
                value={recurrenceValue.toString()}
                onChangeText={(text) => setRecurrenceValue(parseInt(text) || 1)}
                keyboardType="number-pad"
              />
              
              {type === 'custom' && (
                <RNPickerSelect
                  value={recurrenceUnit}
                  onValueChange={(value) => value && setRecurrenceUnit(value as RecurrenceUnit)}
                  items={[
                    { label: '天', value: 'days' },
                    { label: '周', value: 'weeks' },
                    { label: '月', value: 'months' },
                    { label: '年', value: 'years' }
                  ]}
                  style={{
                    inputIOS: {
                      color: colors.text,
                      paddingVertical: 12,
                      paddingHorizontal: 10,
                      backgroundColor: colors.card,
                      borderRadius: 8,
                      width: 100,
                    },
                    inputAndroid: {
                      color: colors.text,
                      padding: 10,
                      backgroundColor: colors.card,
                      borderRadius: 8,
                      width: 100,
                    },
                  }}
                />
              )}
              
            <Text style={[styles.unitText, { color: colors.text }]}>
                {type === 'daily' && '天'}
                {type === 'weekly' && '周'}
                {type === 'monthly' && '月'}
                {type === 'yearly' && '年'}
                {type === 'custom' && (
                  recurrenceUnit === 'days' ? '天' :
                  recurrenceUnit === 'weeks' ? '周' :
                  recurrenceUnit === 'months' ? '月' : '年'
                )}
            </Text>
          </View>
        </View>
        )}
        
        {/* 星期几选择 (仅适用于每周) */}
        {type === 'weekly' && (
        <View style={styles.section}>
            <Text style={[styles.title, { color: colors.text }]}>选择星期几</Text>
            <View style={styles.weekDaysContainer}>
              {[0, 1, 2, 3, 4, 5, 6].map((day) => (
              <TouchableOpacity
                  key={day}
                style={[
                  styles.weekDayButton,
                    weekDay === day && styles.weekDayButtonActive,
                    { borderColor: colors.border, backgroundColor: weekDay === day ? colors.primary : colors.card }
                  ]}
                  onPress={() => setWeekDay(day as WeekDay)}
                >
                  <Text style={[
                    styles.weekDayText,
                    { color: weekDay === day ? '#fff' : colors.text }
                  ]}>
                    {['日', '一', '二', '三', '四', '五', '六'][day]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

        {/* 每月几号 (仅适用于每月) */}
        {type === 'monthly' && (
          <View style={styles.section}>
            <Text style={[styles.title, { color: colors.text }]}>每月几号</Text>
            <TextInput
              style={[styles.valueInput, { color: colors.text, borderColor: colors.border }]}
              value={monthDay !== undefined ? monthDay.toString() : '1'}
              onChangeText={(text) => {
                const day = parseInt(text);
                setMonthDay(day > 0 && day <= 31 ? day : 1);
              }}
              keyboardType="number-pad"
              placeholder="1-31"
              placeholderTextColor={colors.subText}
            />
          </View>
        )}
        
        {/* 每月第几周的星期几 (仅适用于 weekOfMonth) */}
        {type === 'weekOfMonth' && (
          <View>
            <View style={styles.section}>
              <Text style={[styles.title, { color: colors.text }]}>月份</Text>
              <TextInput
                style={[styles.valueInput, { color: colors.text, borderColor: colors.border }]}
                value={month !== undefined ? month.toString() : '1'}
                onChangeText={(text) => {
                  const m = parseInt(text);
                  setMonth(m > 0 && m <= 12 ? m : 1);
                }}
                keyboardType="number-pad"
                placeholder="1-12"
                placeholderTextColor={colors.subText}
              />
      </View>
      
            <View style={styles.section}>
              <Text style={[styles.title, { color: colors.text }]}>第几周</Text>
              <RNPickerSelect
                value={weekOfMonth}
                onValueChange={(value) => value && setWeekOfMonth(value as WeekOfMonth)}
                items={[
                  { label: '第一周', value: 1 },
                  { label: '第二周', value: 2 },
                  { label: '第三周', value: 3 },
                  { label: '第四周', value: 4 },
                  { label: '最后一周', value: 5 }
                ]}
                style={{
                  inputIOS: {
                    color: colors.text,
                    paddingVertical: 12,
                    paddingHorizontal: 10,
                    backgroundColor: colors.card,
                    borderRadius: 8,
                    width: 120,
                  },
                  inputAndroid: {
                    color: colors.text,
                    padding: 10,
                    backgroundColor: colors.card,
                    borderRadius: 8,
                    width: 120,
                  },
                }}
              />
      </View>
            
            <View style={styles.section}>
              <Text style={[styles.title, { color: colors.text }]}>星期几</Text>
              <View style={styles.weekDaysContainer}>
                {[0, 1, 2, 3, 4, 5, 6].map((day) => (
        <TouchableOpacity
                    key={day}
                    style={[
                      styles.weekDayButton,
                      weekDay === day && styles.weekDayButtonActive,
                      { borderColor: colors.border, backgroundColor: weekDay === day ? colors.primary : colors.card }
                    ]}
                    onPress={() => setWeekDay(day as WeekDay)}
                  >
                    <Text style={[
                      styles.weekDayText,
                      { color: weekDay === day ? '#fff' : colors.text }
                    ]}>
                      {['日', '一', '二', '三', '四', '五', '六'][day]}
                    </Text>
        </TouchableOpacity>
                ))}
      </View>
          </View>
        </View>
        )}
      </View>
    );
  };

  return (
    <View style={[
      styles.container,
      fullScreen && styles.fullScreenContainer,
      { backgroundColor: colors.background }
    ]}>
      {onClose && (
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      )}
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 切换器 - 基本模式 vs 组合模式 */}
        <View style={styles.modeSelector}>
              <TouchableOpacity
            style={[
              styles.modeButton,
              !isCompositeMode && styles.modeButtonActive,
              { backgroundColor: !isCompositeMode ? colors.primary : colors.card }
            ]}
            onPress={() => setIsCompositeMode(false)}
          >
            <Text style={[
              styles.modeButtonText,
              { color: !isCompositeMode ? '#fff' : colors.text }
            ]}>基本模式</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.modeButton,
              isCompositeMode && styles.modeButtonActive,
              { backgroundColor: isCompositeMode ? colors.primary : colors.card }
            ]}
            onPress={() => setIsCompositeMode(true)}
          >
            <Text style={[
              styles.modeButtonText,
              { color: isCompositeMode ? '#fff' : colors.text }
            ]}>组合模式</Text>
              </TouchableOpacity>
            </View>
            
        {isCompositeMode ? renderCompositeSelector() : renderBasicSelector()}
      </ScrollView>
      
      
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  fullScreenContainer: {
    flex: 1,
    borderRadius: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  section: {
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  typeButtonActive: {
    borderWidth: 0,
  },
  typeText: {
    fontSize: 14,
  },
  typeTextActive: {
    fontWeight: 'bold',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    width: 100,
    textAlign: 'center',
  },
  unitText: {
    marginLeft: 12,
    fontSize: 16,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  weekDayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  weekDayButtonActive: {
    borderWidth: 0,
  },
  weekDayText: {
    fontSize: 14,
  },
  // 组合模式样式
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  modeButtonActive: {
    borderWidth: 0,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  compositeContainer: {
    marginTop: 8,
  },
  compositeSetting: {
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    marginHorizontal: 8,
  },
  preview: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  previewText: {
    fontSize: 16,
  },
  // 特殊日期选择器样式
  specialDateContainer: {
    marginVertical: 12,
  },
  specialDateHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  specialDateButtonGroup: {
    flexDirection: 'row',
  },
  specialDateClearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 8,
  },
  specialDateSelectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  selectedSpecialDateContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  selectedSpecialDateName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  selectedSpecialDateInfo: {
    fontSize: 14,
  },
  noSpecialDateContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noSpecialDateText: {
    fontSize: 14,
  },
  specialDateModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  specialDateModalContent: {
    height: '60%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  specialDateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  specialDateModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontWeight: '500',
  },
  dateList: {
    paddingBottom: 20,
  },
  specialDateItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  specialDateName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  specialDateInfo: {
    fontSize: 14,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
}); 