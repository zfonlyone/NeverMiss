import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useLanguage } from '../hooks/useLanguage';
import { 
  RecurrenceType, 
  RecurrenceUnit, 
  RecurrencePattern, 
  WeekDay, 
  DateType,
  WeekOfMonth,
  SpecialDate
} from '../models/Task';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import SpecialDateSelector from '../app/components/SpecialDateSelector';

interface RecurrenceSettingsProps {
  recurrencePattern: RecurrencePattern;
  dateType: DateType;
  isLunar?: boolean;
  onRecurrenceChange: (pattern: RecurrencePattern) => void;
  onDateTypeChange?: (dateType: DateType) => void;
}

const RecurrenceSettings: React.FC<RecurrenceSettingsProps> = ({
  recurrencePattern,
  dateType,
  isLunar = false,
  onRecurrenceChange,
  onDateTypeChange,
}) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [customValue, setCustomValue] = useState(String(recurrencePattern.value || 1));
  const [showSpecialDateSelector, setShowSpecialDateSelector] = useState(false);

  // Update customValue when recurrencePattern.value changes externally
  useEffect(() => {
    setCustomValue(String(recurrencePattern.value || 1));
  }, [recurrencePattern.value]);

  // Common recurrence types
  const recurrenceTypes = [
    { type: 'daily', icon: 'calendar-outline', label: t.task.daily },
    { type: 'weekly', icon: 'calendar-outline', label: t.task.weekly },
    { type: 'monthly', icon: 'calendar-outline', label: t.task.monthly },
    { type: 'yearly', icon: 'calendar-outline', label: t.task.yearly },
    { type: 'weekOfMonth', icon: 'grid-outline', label: t.task.weekOfMonth },
    { type: 'custom', icon: 'options-outline', label: t.task.custom },
  ];

  // Preset values for quick selection
  const presetValues = [1, 2, 3, 7, 14, 30];

  // Recurrence units for custom pattern
  const recurrenceUnits: { value: RecurrenceUnit; label: string }[] = [
    { value: 'minutes', label: t.task.minutes },
    { value: 'hours', label: t.task.hours },
    { value: 'days', label: t.task.days },
    { value: 'weeks', label: t.task.weeks },
    { value: 'months', label: t.task.months },
    { value: 'years', label: t.task.years },
  ];

  // Weekdays
  const weekdays = [
    { value: 0, label: t.task.sunday },
    { value: 1, label: t.task.monday },
    { value: 2, label: t.task.tuesday },
    { value: 3, label: t.task.wednesday },
    { value: 4, label: t.task.thursday },
    { value: 5, label: t.task.friday },
    { value: 6, label: t.task.saturday },
  ];

  // Week of month options
  const weekOfMonthOptions = [
    { value: 1, label: t.task.firstWeek },
    { value: 2, label: t.task.secondWeek },
    { value: 3, label: t.task.thirdWeek },
    { value: 4, label: t.task.fourthWeek },
    { value: 5, label: t.task.lastWeek },
  ];

  // Months
  const months = Array.from({ length: 12 }, (_, i) => {
    const monthKeys = ['january', 'february', 'march', 'april', 'may', 'june', 
                     'july', 'august', 'september', 'october', 'november', 'december'];
    return {
      value: i + 1,
      label: t.task[monthKeys[i]]
    };
  });

  // Days of month
  const daysOfMonth = Array.from({ length: 31 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}`
  }));

  // Handle type change
  const handleTypeChange = (type: RecurrenceType) => {
    const newPattern: RecurrencePattern = {
      ...recurrencePattern,
      type,
      value: 1,
    };

    // Reset specific fields based on type
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
    }

    // Special date is only relevant for yearly recurrence
    if (type !== 'yearly') {
      newPattern.specialDate = undefined;
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

  // Handle unit change for custom recurrence
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

  // Handle special date selection
  const handleSpecialDateSelect = (specialDate: SpecialDate | null) => {
    onRecurrenceChange({
      ...recurrencePattern,
      specialDate: specialDate || undefined
    });
    setShowSpecialDateSelector(false);
  };

  // The date type selector section
  const renderDateTypeSelector = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {t.task.dateType}
      </Text>
      <View style={[styles.segmentedControl, { borderColor: colors.primary }]}>
        <TouchableOpacity
          style={[
            styles.segmentButton,
            dateType === 'solar' && [styles.segmentButtonActive, { backgroundColor: colors.primary }],
            styles.segmentButtonLeft,
          ]}
          onPress={() => handleDateTypeChange('solar')}
        >
          <Text style={[
            styles.segmentButtonText,
            { color: dateType === 'solar' ? 'white' : colors.primary }
          ]}>
            {t.task.solarCalendar}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.segmentButton,
            dateType === 'lunar' && [styles.segmentButtonActive, { backgroundColor: colors.primary }],
            styles.segmentButtonRight,
          ]}
          onPress={() => handleDateTypeChange('lunar')}
        >
          <Text style={[
            styles.segmentButtonText,
            { color: dateType === 'lunar' ? 'white' : colors.primary }
          ]}>
            {t.task.lunarCalendar}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Recurrence type selector
  const renderRecurrenceTypeSelector = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {t.task.recurrenceType}
      </Text>
      <View style={styles.typeGrid}>
        {recurrenceTypes.map(item => {
          const isActive = recurrencePattern.type === item.type;
          
          return (
            <TouchableOpacity
              key={item.type}
              style={[
                styles.typeCard,
                { borderColor: colors.border },
                isActive && [
                  styles.typeCardActive, 
                  { 
                    borderColor: colors.primary, 
                    backgroundColor: `${colors.primary}20` 
                  }
                ]
              ]}
              onPress={() => handleTypeChange(item.type as RecurrenceType)}
            >
              <View style={styles.typeCardContent}>
                <Ionicons 
                  name={item.icon as any} 
                  size={24} 
                  color={isActive ? colors.primary : colors.text} 
                />
                <Text style={[
                  styles.typeCardText,
                  { color: isActive ? colors.primary : colors.text }
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

  // Value selector with preset buttons
  const renderValueSelector = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {t.task.recurrenceValue}
      </Text>
      <View style={styles.valueContainer}>
        <View style={styles.valueButtonsContainer}>
          {presetValues.map(value => (
            <TouchableOpacity
              key={value}
              style={[
                styles.valueButton,
                { borderColor: colors.primary },
                recurrencePattern.value === value && [styles.valueButtonActive, { backgroundColor: colors.primary }]
              ]}
              onPress={() => handleValueChange(value)}
            >
              <Text style={[
                styles.valueButtonText,
                { color: recurrencePattern.value === value ? 'white' : colors.primary }
              ]}>
                {value}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.valueInputWrapper}>
          <TextInput
            style={[styles.valueInput, { borderColor: colors.border, color: colors.text }]}
            keyboardType="number-pad"
            value={customValue}
            onChangeText={(text) => {
              setCustomValue(text);
              const num = parseInt(text);
              if (!isNaN(num) && num > 0) {
                handleValueChange(num);
              }
            }}
            placeholder={t.task.every || '值'}
            placeholderTextColor={colors.text + '80'}
          />
        </View>
      </View>
    </View>
  );

  // Custom recurrence unit selector
  const renderCustomUnitSelector = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {t.task.customRecurrence || t.task.recurrenceType || '周期单位'}
      </Text>
      <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
        <Picker
          selectedValue={recurrencePattern.unit || 'days'}
          onValueChange={(value) => handleUnitChange(value as RecurrenceUnit)}
          style={{ color: colors.text }}
        >
          {recurrenceUnits.map(unit => (
            <Picker.Item key={unit.value} label={unit.label} value={unit.value} />
          ))}
        </Picker>
      </View>
    </View>
  );

  // Weekly selector - which day of the week
  const renderWeeklySelector = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {t.task.weekDay}
      </Text>
      <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
        <Picker
          selectedValue={recurrencePattern.weekDay || 0}
          onValueChange={(value) => onRecurrenceChange({ ...recurrencePattern, weekDay: value as WeekDay })}
          style={{ color: colors.text }}
        >
          {weekdays.map(day => (
            <Picker.Item key={day.value} label={day.label} value={day.value} />
          ))}
        </Picker>
      </View>
    </View>
  );

  // Monthly selector - which day of the month
  const renderMonthlySelector = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {t.task.monthDay}
      </Text>
      <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
        <Picker
          selectedValue={recurrencePattern.monthDay || 1}
          onValueChange={(value) => onRecurrenceChange({ ...recurrencePattern, monthDay: value as number })}
          style={{ color: colors.text }}
        >
          {daysOfMonth.map(day => (
            <Picker.Item key={day.value} label={day.label} value={day.value} />
          ))}
        </Picker>
      </View>
    </View>
  );
  
  // Week of month selector
  const renderWeekOfMonthSelector = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {t.task.weekOfMonth || '每月第几周'}
      </Text>
      <View style={styles.rowContainer}>
        <View style={[styles.pickerContainer, styles.halfPicker, { borderColor: colors.border }]}>
          <Text style={[styles.pickerLabel, { color: colors.text }]}>
            {'周数'}
          </Text>
          <Picker
            selectedValue={recurrencePattern.weekOfMonth || 1}
            onValueChange={(value) => onRecurrenceChange({ 
              ...recurrencePattern, 
              weekOfMonth: value as WeekOfMonth 
            })}
            style={{ color: colors.text }}
          >
            {weekOfMonthOptions.map(week => (
              <Picker.Item key={week.value} label={week.label} value={week.value} />
            ))}
          </Picker>
        </View>
        <View style={[styles.pickerContainer, styles.halfPicker, { borderColor: colors.border }]}>
          <Text style={[styles.pickerLabel, { color: colors.text }]}>{t.task.weekDay}</Text>
          <Picker
            selectedValue={recurrencePattern.weekDay || 0}
            onValueChange={(value) => onRecurrenceChange({ 
              ...recurrencePattern, 
              weekDay: value as WeekDay 
            })}
            style={{ color: colors.text }}
          >
            {weekdays.map(day => (
              <Picker.Item key={day.value} label={day.label} value={day.value} />
            ))}
          </Picker>
        </View>
      </View>
    </View>
  );

  // Yearly selector - month and day
  const renderYearlySelector = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {t.task.yearlyDate}
      </Text>
      <View style={styles.rowContainer}>
        <View style={[styles.pickerContainer, styles.halfPicker, { borderColor: colors.border }]}>
          <Text style={[styles.pickerLabel, { color: colors.text }]}>{t.task.month}</Text>
          <Picker
            selectedValue={recurrencePattern.month || 1}
            onValueChange={(value) => onRecurrenceChange({ ...recurrencePattern, month: value as number })}
            style={{ color: colors.text }}
          >
            {months.map(month => (
              <Picker.Item key={month.value} label={month.label} value={month.value} />
            ))}
          </Picker>
        </View>
        <View style={[styles.pickerContainer, styles.halfPicker, { borderColor: colors.border }]}>
          <Text style={[styles.pickerLabel, { color: colors.text }]}>{t.task.day}</Text>
          <Picker
            selectedValue={recurrencePattern.monthDay || 1}
            onValueChange={(value) => onRecurrenceChange({ ...recurrencePattern, monthDay: value as number })}
            style={{ color: colors.text }}
          >
            {daysOfMonth.map(day => (
              <Picker.Item key={day.value} label={day.label} value={day.value} />
            ))}
          </Picker>
        </View>
      </View>
    </View>
  );

  // Special date selector for yearly recurrence
  const renderSpecialDateSection = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {t.task.specialDates}
      </Text>
      {showSpecialDateSelector ? (
        <SpecialDateSelector
          selectedDate={recurrencePattern.specialDate || null}
          onDateSelect={handleSpecialDateSelect}
          isLunarCalendar={isLunar}
        />
      ) : (
        <TouchableOpacity
          style={[styles.specialDateButton, { borderColor: colors.primary }]}
          onPress={() => setShowSpecialDateSelector(true)}
        >
          {recurrencePattern.specialDate ? (
            <View style={styles.selectedDateInfo}>
              <Text style={[styles.specialDateText, { color: colors.primary }]}>
                {recurrencePattern.specialDate.name}
              </Text>
              <Text style={[styles.specialDateSubtext, { color: colors.text }]}>
                {recurrencePattern.specialDate.isLunar ? t.task.lunarCalendar : t.task.solarCalendar} {recurrencePattern.specialDate.month}月{recurrencePattern.specialDate.day}日
              </Text>
            </View>
          ) : (
            <Text style={[styles.specialDateText, { color: colors.primary }]}>
              {t.task.selectSpecialDate}
            </Text>
          )}
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {onDateTypeChange && renderDateTypeSelector()}
        {renderRecurrenceTypeSelector()}
        {renderValueSelector()}
        
        {recurrencePattern.type === 'custom' && renderCustomUnitSelector()}
        {recurrencePattern.type === 'weekly' && renderWeeklySelector()}
        {recurrencePattern.type === 'monthly' && renderMonthlySelector()}
        {recurrencePattern.type === 'yearly' && renderYearlySelector()}
        {recurrencePattern.type === 'weekOfMonth' && renderWeekOfMonthSelector()}
        
        {recurrencePattern.type === 'yearly' && renderSpecialDateSection()}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  card: {
    margin: 16,
    padding: 16,
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
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 14,
    fontWeight: '500',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  typeCard: {
    width: '31%',
    aspectRatio: 1.2,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  typeCardActive: {
    borderWidth: 2,
  },
  typeCardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  typeCardText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valueButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 2,
    gap: 8,
  },
  valueButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueButtonActive: {
    backgroundColor: '#007AFF',
  },
  valueButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  valueInputWrapper: {
    flex: 1,
    marginLeft: 16,
  },
  valueInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  halfPicker: {
    width: '48%',
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  specialDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  specialDateText: {
    fontSize: 16,
    fontWeight: '500',
  },
  specialDateSubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  selectedDateInfo: {
    flex: 1,
  },
});

export default RecurrenceSettings; 