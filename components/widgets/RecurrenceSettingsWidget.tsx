/**
 * RecurrenceSettingsWidget Component for NeverMiss
 * 
 * 循环设置小组件，用于设置任务的循环模式
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Switch,
  ScrollView,
  TextInput
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  RecurrenceType, 
  RecurrenceUnit, 
  DateType, 
  WeekDay,
  WeekType,
  RecurrencePattern
} from '../../models/Task';

interface RecurrenceSettingsWidgetProps {
  value: RecurrencePattern;
  dateType: DateType;
  onChange: (pattern: RecurrencePattern) => void;
  onDateTypeChange?: (dateType: DateType) => void;
}

export default function RecurrenceSettingsWidget({
  value,
  dateType = 'solar',
  onChange,
  onDateTypeChange
}: RecurrenceSettingsWidgetProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  // 状态管理
  const [pattern, setPattern] = useState<RecurrencePattern>(value);
  const [useLunar, setUseLunar] = useState<boolean>(dateType === 'lunar');
  
  // 同步外部值
  useEffect(() => {
    setPattern(value);
  }, [value]);

  useEffect(() => {
    setUseLunar(dateType === 'lunar');
  }, [dateType]);

  // 基本循环类型
  const basicTypes = [
    { type: 'daily' as RecurrenceType, label: t.task.daily },
    { type: 'weekly' as RecurrenceType, label: t.task.weekly },
    { type: 'monthly' as RecurrenceType, label: t.task.monthly },
    { type: 'custom' as RecurrenceType, label: t.task.custom },
  ];

  // 自定义循环单位
  const customUnits = [
    { unit: 'days' as RecurrenceUnit, label: t.task.days },
    { unit: 'weeks' as RecurrenceUnit, label: t.task.weeks },
    { unit: 'months' as RecurrenceUnit, label: t.task.months },
  ];

  // 每周几
  const weekdays = [
    { value: 0 as WeekDay, label: '周日' },
    { value: 1 as WeekDay, label: '周一' },
    { value: 2 as WeekDay, label: '周二' },
    { value: 3 as WeekDay, label: '周三' },
    { value: 4 as WeekDay, label: '周四' },
    { value: 5 as WeekDay, label: '周五' },
    { value: 6 as WeekDay, label: '周六' },
  ];

  // 大小周选项
  const alternateWeeks = [
    { value: 'big' as WeekType, label: '大周' },
    { value: 'small' as WeekType, label: '小周' },
  ];

  // 月份第几周选项
  const monthWeeks = [
    { value: 1, label: '第一个' },
    { value: 2, label: '第二个' },
    { value: 3, label: '第三个' },
    { value: 4, label: '第四个' },
    { value: -1, label: '最后一个' },
  ];

  // 更新日期类型
  const handleDateTypeChange = (useLunarValue: boolean) => {
    setUseLunar(useLunarValue);
    if (onDateTypeChange) {
      onDateTypeChange(useLunarValue ? 'lunar' : 'solar');
    }
  };

  // 获取循环描述文本
  const getRecurrenceDescription = (): string => {
    const { type, value: recValue, unit, weekDay, weekType, monthDay, yearDay } = pattern;
    
    switch (type) {
      case 'daily':
        return useLunar ? '每个农历日' : '每天';
        
      case 'weekly':
        if (weekDay !== undefined) {
          const dayName = weekdays.find(d => d.value === weekDay)?.label || '';
          return `每周${dayName}`;
        } 
        if (weekType !== undefined) {
          const typeName = alternateWeeks.find(t => t.value === weekType)?.label || '';
          return `${typeName}`;
        }
        return useLunar ? '每个农历周' : '每周';
        
      case 'monthly':
        if (monthDay !== undefined) {
          return useLunar 
            ? `每农历月${monthDay}日` 
            : `每月${monthDay}日`;
        }
        if (weekDay !== undefined) {
          const dayName = weekdays.find(d => d.value === weekDay)?.label || '';
          const weekValue = pattern.value || 1;
          const weekLabel = monthWeeks.find(w => w.value === weekValue)?.label || '';
          return `每月${weekLabel}${dayName}`;
        }
        return useLunar ? '每个农历月' : '每月';
        
      case 'custom':
        if (unit === 'days') {
          return useLunar ? `每${recValue}个农历日` : `每${recValue}天`;
        } else if (unit === 'weeks') {
          return useLunar ? `每${recValue}个农历周` : `每${recValue}周`;
        } else if (unit === 'months') {
          return useLunar ? `每${recValue}个农历月` : `每${recValue}个月`;
        }
        break;
    }
    
    return '';
  };

  // 更新循环模式并触发回调
  const updatePattern = (updates: Partial<RecurrencePattern>) => {
    const updatedPattern = { ...pattern, ...updates };
    setPattern(updatedPattern);
    onChange(updatedPattern);
  };

  // 更新循环类型
  const handleTypeChange = (type: RecurrenceType) => {
    let newPattern: RecurrencePattern = { ...pattern, type, value: 1 };
    
    // 根据类型重置相关属性
    if (type === 'custom') {
      newPattern.unit = newPattern.unit || 'days';
    } else {
      // 非自定义类型去掉单位
      delete newPattern.unit;
    }
    
    setPattern(newPattern);
    onChange(newPattern);
  };

  // 渲染自定义值输入
  const renderValueInput = () => {
    return (
      <View style={styles.valueInputContainer}>
        <Text style={[styles.label, { color: colors.text }]}>
          {t.task.every}
        </Text>
        <TextInput
          style={[
            styles.valueInput,
            { 
              color: colors.text,
              borderColor: colors.border,
            }
          ]}
          value={pattern.value?.toString() || '1'}
          onChangeText={(text) => {
            const value = parseInt(text) || 1;
            updatePattern({ value });
          }}
          keyboardType="numeric"
          placeholder="1"
          placeholderTextColor={colors.text}
        />
      </View>
    );
  };

  // 渲染周几选择器
  const renderWeekDaySelector = () => {
    return (
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>
          选择星期几
        </Text>
        <View style={styles.buttonRow}>
          {weekdays.map((day) => (
            <TouchableOpacity
              key={day.value}
              style={[
                styles.button,
                pattern.weekDay === day.value 
                  ? { backgroundColor: colors.primary } 
                  : { borderColor: colors.border },
              ]}
              onPress={() => updatePattern({ weekDay: day.value })}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: pattern.weekDay === day.value ? 'white' : colors.text },
                ]}
              >
                {day.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // 渲染大小周选择器
  const renderWeekTypeSelector = () => {
    return (
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>
          选择周类型
        </Text>
        <View style={styles.buttonRow}>
          {alternateWeeks.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.button,
                pattern.weekType === type.value 
                  ? { backgroundColor: colors.primary } 
                  : { borderColor: colors.border },
              ]}
              onPress={() => updatePattern({ weekType: type.value })}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: pattern.weekType === type.value ? 'white' : colors.text },
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // 渲染月日选择器
  const renderMonthDaySelector = () => {
    // 创建1-31的日期选项
    const days = Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: `${i + 1}日` }));
    
    return (
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>
          选择每月日期
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.daysContainer}>
            {days.map((day) => (
              <TouchableOpacity
                key={day.value}
                style={[
                  styles.dayButton,
                  pattern.monthDay === day.value 
                    ? { backgroundColor: colors.primary } 
                    : { borderColor: colors.border },
                ]}
                onPress={() => updatePattern({ monthDay: day.value })}
              >
                <Text
                  style={[
                    styles.dayButtonText,
                    { color: pattern.monthDay === day.value ? 'white' : colors.text },
                  ]}
                >
                  {day.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  // 渲染每月第几个星期几选择器
  const renderMonthWeekDaySelector = () => {
    return (
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>
          选择每月第几个星期几
        </Text>
        
        <View style={styles.section}>
          <Text style={[styles.subLabel, { color: colors.text }]}>
            第几个
          </Text>
          <View style={styles.buttonRow}>
            {monthWeeks.map((week) => (
              <TouchableOpacity
                key={week.value}
                style={[
                  styles.button,
                  pattern.value === week.value 
                    ? { backgroundColor: colors.primary } 
                    : { borderColor: colors.border },
                ]}
                onPress={() => updatePattern({ value: week.value })}
              >
                <Text
                  style={[
                    styles.buttonText,
                    { color: pattern.value === week.value ? 'white' : colors.text },
                  ]}
                >
                  {week.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {renderWeekDaySelector()}
      </View>
    );
  };

  // 渲染自定义单位选择器
  const renderCustomUnitSelector = () => {
    return (
      <View style={styles.section}>
        <Text style={[styles.label, { color: colors.text }]}>
          循环单位
        </Text>
        <View style={styles.buttonRow}>
          {customUnits.map((item) => (
            <TouchableOpacity
              key={item.unit}
              style={[
                styles.button,
                pattern.unit === item.unit 
                  ? { backgroundColor: colors.primary } 
                  : { borderColor: colors.border },
              ]}
              onPress={() => updatePattern({ unit: item.unit })}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: pattern.unit === item.unit ? 'white' : colors.text },
                ]}
              >
                {useLunar && item.unit === 'days' ? '农历日' : 
                  useLunar && item.unit === 'weeks' ? '农历周' : 
                  useLunar && item.unit === 'months' ? '农历月' : item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 日期类型选择 */}
      <View style={styles.dateTypeContainer}>
        <Text style={[styles.label, { color: colors.text }]}>日期类型</Text>
        <View style={styles.dateTypeSwitchContainer}>
          <Text style={{ color: !useLunar ? colors.primary : colors.text }}>公历</Text>
          <Switch
            value={useLunar}
            onValueChange={handleDateTypeChange}
            style={styles.switch}
          />
          <Text style={{ color: useLunar ? colors.primary : colors.text }}>农历</Text>
        </View>
      </View>

      {/* 循环类型 */}
      <Text style={[styles.label, { color: colors.text }]}>循环类型</Text>
      <View style={styles.buttonRow}>
        {basicTypes.map((item) => (
          <TouchableOpacity
            key={item.type}
            style={[
              styles.button,
              pattern.type === item.type 
                ? { backgroundColor: colors.primary } 
                : { borderColor: colors.border },
            ]}
            onPress={() => handleTypeChange(item.type)}
          >
            <Text
              style={[
                styles.buttonText,
                { color: pattern.type === item.type ? 'white' : colors.text },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 根据循环类型显示不同的设置选项 */}
      {pattern.type === 'custom' && (
        <>
          {renderValueInput()}
          {renderCustomUnitSelector()}
        </>
      )}
      
      {pattern.type === 'weekly' && (
        <>
          {renderWeekDaySelector()}
          {renderWeekTypeSelector()}
        </>
      )}
      
      {pattern.type === 'monthly' && (
        <>
          <View style={styles.optionsContainer}>
            <Text style={[styles.label, { color: colors.text }]}>选择方式</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.button,
                  pattern.monthDay !== undefined
                    ? { backgroundColor: colors.primary } 
                    : { borderColor: colors.border },
                ]}
                onPress={() => updatePattern({ 
                  monthDay: pattern.monthDay || 1, 
                  weekDay: undefined, 
                  value: 1 
                })}
              >
                <Text
                  style={[
                    styles.buttonText,
                    { color: pattern.monthDay !== undefined ? 'white' : colors.text },
                  ]}
                >
                  每月固定日期
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.button,
                  pattern.weekDay !== undefined
                    ? { backgroundColor: colors.primary } 
                    : { borderColor: colors.border },
                ]}
                onPress={() => updatePattern({ 
                  weekDay: pattern.weekDay || 1, 
                  monthDay: undefined,
                  value: pattern.value || 1 
                })}
              >
                <Text
                  style={[
                    styles.buttonText,
                    { color: pattern.weekDay !== undefined ? 'white' : colors.text },
                  ]}
                >
                  每月第几个星期几
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {pattern.monthDay !== undefined ? renderMonthDaySelector() : null}
          {pattern.weekDay !== undefined ? renderMonthWeekDaySelector() : null}
        </>
      )}

      {/* 循环说明 */}
      <View style={[styles.descriptionContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.description, { color: colors.text }]}>
          {getRecurrenceDescription()}
        </Text>
        
        {/* 农历说明 */}
        {useLunar && (
          <Text style={[styles.infoText, { color: colors.text + '80' }]}>
            农历日期将根据农历时间计算下一个循环，例如农历正月初一会循环到下一个农历正月初一。
            {pattern.type === 'monthly' && '每月循环将保持农历日期相同，例如农历每月初一。'}
            {pattern.type === 'custom' && pattern.unit === 'months' && '自定义农历月循环将保持日期相同，但根据农历月份计算。'}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    padding: 10,
  },
  section: {
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    margin: 4,
  },
  buttonText: {
    fontSize: 14,
  },
  valueInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  valueInput: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    minWidth: 60,
    textAlign: 'center',
    marginLeft: 8,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayButton: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 23,
    borderWidth: 1,
    margin: 4,
  },
  dayButtonText: {
    fontSize: 12,
  },
  optionsContainer: {
    marginVertical: 10,
  },
  descriptionContainer: {
    marginTop: 15,
    padding: 10,
    borderRadius: 6,
  },
  description: {
    fontSize: 16,
  },
  infoText: {
    fontSize: 12,
    marginTop: 8,
  },
  dateTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  dateTypeSwitchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switch: {
    marginHorizontal: 8,
  },
}); 