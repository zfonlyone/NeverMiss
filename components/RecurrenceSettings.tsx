import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useLanguage } from '../hooks/useLanguage';
import { RecurrenceType, RecurrenceUnit } from '../models/Task';

interface RecurrenceSettingsProps {
  recurrenceType: RecurrenceType;
  recurrenceValue: number;
  recurrenceUnit?: RecurrenceUnit;
  onRecurrenceChange: (type: RecurrenceType, value: number, unit?: RecurrenceUnit) => void;
}

export default function RecurrenceSettings({
  recurrenceType,
  recurrenceValue,
  recurrenceUnit,
  onRecurrenceChange,
}: RecurrenceSettingsProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const [selectedType, setSelectedType] = React.useState<RecurrenceType>(recurrenceType);
  const [selectedValue, setSelectedValue] = React.useState<number>(recurrenceValue);
  const [selectedUnit, setSelectedUnit] = React.useState<RecurrenceUnit | undefined>(recurrenceUnit);

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
      <Text style={[styles.title, { color: colors.text }]}>{t.task.recurrenceType}</Text>
      
      {/* 基本循环类型选择 */}
      <View style={styles.typeContainer}>
        {basicTypes.map((item) => (
          <TouchableOpacity
            key={item.type}
            style={[
              styles.typeButton,
              { 
                backgroundColor: selectedType === item.type ? colors.primary : colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() => handleTypeChange(item.type)}
          >
            <Text
              style={[
                styles.typeText,
                { color: selectedType === item.type ? '#fff' : colors.text },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 自定义循环设置 */}
      {selectedType === 'custom' && (
        <View style={styles.customContainer}>
          <Text style={[styles.subtitle, { color: colors.text }]}>{t.task.customRecurrence}</Text>
          
          {/* 循环单位选择 */}
          <View style={styles.unitContainer}>
            {customUnits.map((item) => (
              <TouchableOpacity
                key={item.unit}
                style={[
                  styles.unitButton,
                  { 
                    backgroundColor: selectedUnit === item.unit ? colors.primary : colors.card,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleUnitChange(item.unit)}
              >
                <Text
                  style={[
                    styles.unitText,
                    { color: selectedUnit === item.unit ? '#fff' : colors.text },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 每周几选择 */}
          {selectedUnit === 'weeks' && (
            <View style={styles.weekdayContainer}>
              {weekdays.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.weekdayButton,
                    { 
                      backgroundColor: selectedValue === item.value ? colors.primary : colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleValueChange(item.value)}
                >
                  <Text
                    style={[
                      styles.weekdayText,
                      { color: selectedValue === item.value ? '#fff' : colors.text },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 大小周选择 */}
          {selectedUnit === 'weeks' && (
            <View style={styles.alternateContainer}>
              {alternateWeeks.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.alternateButton,
                    { 
                      backgroundColor: selectedValue === item.value ? colors.primary : colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleValueChange(item.value)}
                >
                  <Text
                    style={[
                      styles.alternateText,
                      { color: selectedValue === item.value ? '#fff' : colors.text },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  typeText: {
    fontSize: 14,
  },
  customContainer: {
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  unitContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  unitButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  unitText: {
    fontSize: 14,
  },
  weekdayContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  weekdayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  weekdayText: {
    fontSize: 14,
  },
  alternateContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  alternateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  alternateText: {
    fontSize: 14,
  },
}); 