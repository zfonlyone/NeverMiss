import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useLanguage } from '../hooks/useLanguage';
import { RecurrenceType, RecurrenceUnit, DateType } from '../models/Task';
import lunarService from '../models/services/lunarService';

interface RecurrenceSettingsProps {
  recurrenceType: RecurrenceType;
  recurrenceValue: number;
  recurrenceUnit?: RecurrenceUnit;
  dateType: DateType;
  onRecurrenceChange: (type: RecurrenceType, value: number, unit?: RecurrenceUnit) => void;
  onDateTypeChange?: (dateType: DateType) => void;
}

export default function RecurrenceSettings({
  recurrenceType,
  recurrenceValue,
  recurrenceUnit,
  dateType = 'solar',
  onRecurrenceChange,
  onDateTypeChange
}: RecurrenceSettingsProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const [selectedType, setSelectedType] = React.useState<RecurrenceType>(recurrenceType);
  const [selectedValue, setSelectedValue] = React.useState<number>(recurrenceValue);
  const [selectedUnit, setSelectedUnit] = React.useState<RecurrenceUnit | undefined>(recurrenceUnit);
  const [useLunar, setUseLunar] = React.useState<boolean>(dateType === 'lunar');

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
    { value: 0, label: '周日' },
    { value: 1, label: '周一' },
    { value: 2, label: '周二' },
    { value: 3, label: '周三' },
    { value: 4, label: '周四' },
    { value: 5, label: '周五' },
    { value: 6, label: '周六' },
  ];

  // 大小周选项
  const alternateWeeks = [
    { value: 1, label: '大周' },
    { value: 2, label: '小周' },
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
    if (recurrenceType === 'daily') {
      return useLunar ? '每个农历日' : '每天';
    } else if (recurrenceType === 'weekly') {
      return useLunar ? '每个农历周' : '每周';
    } else if (recurrenceType === 'monthly') {
      return useLunar ? '每个农历月' : '每月';
    } else if (recurrenceType === 'custom') {
      if (recurrenceUnit === 'days') {
        return useLunar ? `每${recurrenceValue}个农历日` : `每${recurrenceValue}天`;
      } else if (recurrenceUnit === 'weeks') {
        return useLunar ? `每${recurrenceValue}个农历周` : `每${recurrenceValue}周`;
      } else if (recurrenceUnit === 'months') {
        return useLunar ? `每${recurrenceValue}个农历月` : `每${recurrenceValue}个月`;
      }
    }
    return '';
  };

  const handleTypeChange = (type: RecurrenceType) => {
    setSelectedType(type);
    let value = selectedValue;
    let unit = selectedUnit;

    // 重置值和单位
    if (type !== 'custom') {
      value = 1;
      unit = undefined;
    }

    setSelectedValue(value);
    setSelectedUnit(unit);
    onRecurrenceChange(type, value, unit);
  };

  const handleValueChange = (value: number) => {
    setSelectedValue(value);
    onRecurrenceChange(selectedType, value, selectedUnit);
  };

  const handleUnitChange = (unit: RecurrenceUnit) => {
    setSelectedUnit(unit);
    onRecurrenceChange(selectedType, selectedValue, unit);
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
              item.type === selectedType ? { backgroundColor: colors.primary } : { borderColor: colors.border },
            ]}
            onPress={() => {
              setSelectedType(item.type);
              if (item.type === 'custom' && !selectedUnit) {
                setSelectedUnit('days');
                onRecurrenceChange(item.type, selectedValue, 'days');
              } else {
                onRecurrenceChange(item.type, selectedValue, item.type === 'custom' ? selectedUnit : undefined);
              }
            }}
          >
            <Text
              style={[
                styles.buttonText,
                { color: item.type === selectedType ? 'white' : colors.text },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 自定义循环单位 */}
      {selectedType === 'custom' && (
        <View style={styles.customContainer}>
          <Text style={[styles.label, { color: colors.text }]}>循环单位</Text>
          <View style={styles.buttonRow}>
            {customUnits.map((item) => (
              <TouchableOpacity
                key={item.unit}
                style={[
                  styles.button,
                  item.unit === selectedUnit ? { backgroundColor: colors.primary } : { borderColor: colors.border },
                ]}
                onPress={() => {
                  setSelectedUnit(item.unit);
                  onRecurrenceChange(selectedType, selectedValue, item.unit);
                }}
              >
                <Text
                  style={[
                    styles.buttonText,
                    { color: item.unit === selectedUnit ? 'white' : colors.text },
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
      )}

      {/* 循环说明 */}
      <View style={styles.descriptionContainer}>
        <Text style={[styles.description, { color: colors.text }]}>
          {getRecurrenceDescription()}
        </Text>
        
        {/* 农历说明 */}
        {useLunar && (
          <Text style={[styles.infoText, { color: colors.text + '80' }]}>
            农历日期将根据农历时间计算下一个循环，例如农历正月初一会循环到下一个农历正月初一。
            {recurrenceType === 'monthly' && '每月循环将保持农历日期相同，例如农历每月初一。'}
            {recurrenceType === 'custom' && selectedUnit === 'months' && '自定义农历月循环将保持日期相同，但根据农历月份计算。'}
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
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
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
  customContainer: {
    marginTop: 10,
  },
  descriptionContainer: {
    marginTop: 15,
    padding: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
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