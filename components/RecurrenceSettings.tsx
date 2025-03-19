import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useLanguage } from '../hooks/useLanguage';
import { 
  RecurrenceType, 
  RecurrenceUnit, 
  RecurrencePattern, 
  WeekDay, 
  DateType,
  WeekOfMonth
} from '../models/Task';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';

interface RecurrenceSettingsProps {
  recurrencePattern: RecurrencePattern;
  dateType: DateType;
  onRecurrenceChange: (pattern: RecurrencePattern) => void;
  onDateTypeChange?: (dateType: DateType) => void;
}

export default function RecurrenceSettings({
  recurrencePattern,
  dateType,
  onRecurrenceChange,
  onDateTypeChange,
}: RecurrenceSettingsProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [customValue, setCustomValue] = useState(String(recurrencePattern.value || 1));

  // Basic recurrence types with their icons
  const basicTypes = [
    { 
      type: 'daily' as RecurrenceType, 
      label: t.task.daily,
      icon: (
        <View style={[styles.calendarIcon, { backgroundColor: 'white' }]}>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarHeaderText}>{t.task.january.slice(0, 2)}</Text>
          </View>
          <Text style={styles.calendarContent}>17</Text>
        </View>
      )
    },
    { 
      type: 'weekly' as RecurrenceType, 
      label: t.task.weekly,
      icon: (
        <View style={[styles.calendarIcon, { backgroundColor: 'white' }]}>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarHeaderText}>{t.task.january.slice(0, 2)}</Text>
          </View>
          <Text style={styles.calendarContent}>W</Text>
        </View>
      )
    },
    { 
      type: 'monthly' as RecurrenceType, 
      label: t.task.monthly,
      icon: (
        <View style={[styles.calendarIcon, { backgroundColor: 'white' }]}>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarHeaderText}>{t.task.january.slice(0, 2)}</Text>
          </View>
          <Text style={styles.calendarContent}>31</Text>
        </View>
      )
    },
    { 
      type: 'yearly' as RecurrenceType, 
      label: t.task.yearly,
      icon: (
        <View style={[styles.calendarIcon, { backgroundColor: '#007AFF' }]}>
          <View style={styles.calendarHeader}>
            <Text style={styles.calendarHeaderText}>年</Text>
          </View>
          <Text style={[styles.calendarContent, { color: 'white' }]}>202</Text>
        </View>
      )
    },
    { 
      type: 'weekOfMonth' as RecurrenceType, 
      label: t.task.weekOfMonth,
      icon: (
        <Text style={styles.iconText}>|||</Text>
      )
    },
    { 
      type: 'custom' as RecurrenceType, 
      label: t.task.custom,
      icon: (
        <Ionicons name="settings-outline" size={24} color="#666" />
      )
    },
  ];

  // Date types
  const dateTypes = [
    { type: 'solar' as DateType, label: t.task.solarCalendar },
    { type: 'lunar' as DateType, label: t.task.lunarCalendar },
  ];

  // Preset values for quick selection
  const presetValues = [1, 2, 3, 7, 14, 30];

  // Months
  const months = Array.from({ length: 12 }, (_, i) => {
    const monthKeys = ['january', 'february', 'march', 'april', 'may', 'june', 
                      'july', 'august', 'september', 'october', 'november', 'december'];
    return {
      value: i + 1,
      label: t.task[monthKeys[i]]
    };
  });

  // Days
  const days = Array.from({ length: 31 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1} ${t.task.day}`
  }));

  // Handle type change
  const handleTypeChange = (type: RecurrenceType) => {
    const newPattern: RecurrencePattern = {
      ...recurrencePattern,
      type,
      value: 1,
    };

    // Reset specific properties based on type
    if (type !== 'custom') {
      newPattern.unit = undefined;
    } else {
      newPattern.unit = 'days';
    }

    if (type !== 'weekly') {
      newPattern.weekDay = undefined;
    }

    if (type !== 'monthly') {
      newPattern.monthDay = undefined;
    }

    if (type !== 'yearly') {
      newPattern.yearDay = undefined;
      newPattern.month = undefined;
    }

    if (type !== 'weekOfMonth') {
      newPattern.weekOfMonth = undefined;
      newPattern.weekDay = undefined;
      newPattern.month = undefined;
    }

    onRecurrenceChange(newPattern);
  };

  // Handle value change
  const handleValueChange = (value: number) => {
    onRecurrenceChange({
      ...recurrencePattern,
      value
    });
    setCustomValue(String(value));
  };

  // Handle unit change
  const handleUnitChange = (unit: RecurrenceUnit) => {
    onRecurrenceChange({
      ...recurrencePattern,
      unit
    });
  };

  // Handle date type change
  const handleDateTypeChange = (newDateType: DateType) => {
    if (onDateTypeChange) {
      onDateTypeChange(newDateType);
    }
  };

  // Render date type selector (segmented control)
  const renderDateTypeSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t.task.dateType}</Text>
      <View style={styles.segmentedControl}>
        {dateTypes.map((item, index) => (
          <TouchableOpacity
            key={item.type}
            style={[
              styles.segmentButton,
              dateType === item.type ? styles.segmentButtonActive : null,
              index === 0 ? styles.segmentButtonLeft : null,
              index === dateTypes.length - 1 ? styles.segmentButtonRight : null,
            ]}
            onPress={() => handleDateTypeChange(item.type)}
          >
            <Text style={[
              styles.segmentButtonText,
              dateType === item.type ? styles.segmentButtonTextActive : null
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Render recurrence type grid
  const renderRecurrenceTypeSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t.task.recurrenceType}</Text>
      <View style={styles.typeGrid}>
        {basicTypes.map(item => {
          const isActive = recurrencePattern.type === item.type;
          const isYearly = item.type === 'yearly';
          
          return (
            <TouchableOpacity
              key={item.type}
              style={[
                styles.typeCard,
                isActive && styles.typeCardActive,
                isActive && isYearly && styles.yearlyCardActive
              ]}
              onPress={() => handleTypeChange(item.type)}
            >
              <View style={styles.typeCardContent}>
                {item.icon}
                <Text style={[
                  styles.typeCardText,
                  isActive && isYearly && styles.typeCardTextActive
                ]}>
                  {item.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  // Render value selector with preset buttons
  const renderValueSelector = () => (
    <View style={styles.section}>
      <View style={styles.valueButtonsContainer}>
        {presetValues.map(value => (
          <TouchableOpacity
            key={value}
            style={[
              styles.valueButton,
              recurrencePattern.value === value && styles.valueButtonActive
            ]}
            onPress={() => handleValueChange(value)}
          >
            <Text style={[
              styles.valueButtonText,
              recurrencePattern.value === value && styles.valueButtonTextActive
            ]}>
              {value}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.valueInputContainer}>
        <TextInput
          style={styles.valueInput}
          keyboardType="number-pad"
          value={customValue}
          onChangeText={(text) => {
            setCustomValue(text);
            const num = parseInt(text);
            if (!isNaN(num) && num > 0) {
              handleValueChange(num);
            }
          }}
        />
      </View>
    </View>
  );

  // Render yearly date selector
  const renderYearlyDateSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{t.task.yearlyDate}</Text>
      <View style={styles.pickerRow}>
        <View style={[styles.pickerContainer, styles.halfPicker]}>
          <Picker
            selectedValue={recurrencePattern.month || 1}
            style={styles.picker}
            onValueChange={(value) => onRecurrenceChange({ ...recurrencePattern, month: value })}
          >
            {months.map(item => (
              <Picker.Item key={item.value} label={item.label} value={item.value} />
            ))}
          </Picker>
        </View>
        <View style={[styles.pickerContainer, styles.halfPicker]}>
          <Picker
            selectedValue={recurrencePattern.monthDay || 1}
            style={styles.picker}
            onValueChange={(value) => onRecurrenceChange({ ...recurrencePattern, monthDay: value })}
          >
            {days.map(item => (
              <Picker.Item key={item.value} label={item.label} value={item.value} />
            ))}
          </Picker>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        {onDateTypeChange && renderDateTypeSelector()}
        {renderRecurrenceTypeSelector()}
        {renderValueSelector()}
        {recurrencePattern.type === 'yearly' && renderYearlyDateSelector()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  // Segmented control for date type
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    overflow: 'hidden',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  segmentButtonLeft: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  segmentButtonRight: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: '#007AFF',
  },
  segmentButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  segmentButtonTextActive: {
    color: 'white',
  },
  // Type grid layout
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeCard: {
    width: '31%',
    aspectRatio: 1,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  typeCardActive: {
    borderColor: '#007AFF',
  },
  yearlyCardActive: {
    backgroundColor: '#007AFF',
  },
  typeCardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  typeCardText: {
    fontSize: 12,
    color: '#333',
    marginTop: 4,
    textAlign: 'center',
  },
  typeCardTextActive: {
    color: 'white',
  },
  // Calendar icon
  calendarIcon: {
    width: 36,
    height: 40,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  calendarHeader: {
    height: 14,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarHeaderText: {
    fontSize: 8,
    color: 'white',
    textAlign: 'center',
  },
  calendarContent: {
    fontSize: 18,
    textAlign: 'center',
    flex: 1,
    paddingTop: 4,
  },
  // Other icons
  iconText: {
    fontSize: 24,
    color: '#666',
  },
  // Value buttons
  valueButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  valueButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  valueButtonActive: {
    backgroundColor: '#007AFF',
  },
  valueButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  valueButtonTextActive: {
    color: 'white',
  },
  valueInputContainer: {
    width: 80,
  },
  valueInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  // Picker styles
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#F8F8F8',
    overflow: 'hidden',
  },
  halfPicker: {
    width: '48%',
  },
  picker: {
    height: 150,
  },
}); 