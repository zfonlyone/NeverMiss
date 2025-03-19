import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  interpolateColor,
  interpolate,
} from 'react-native-reanimated';
import { useLanguage } from '../../hooks/useLanguage';
import {
  RecurrenceType,
  RecurrenceUnit,
  RecurrencePattern,
  WeekDay,
  DateType,
  WeekOfMonth
} from '../../models/Task';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_SIZE = width / 3 - 24;

interface RecurrenceSelectorProps {
  recurrencePattern: RecurrencePattern;
  dateType: DateType;
  onRecurrenceChange: (pattern: RecurrencePattern) => void;
  onDateTypeChange?: (dateType: DateType) => void;
}

export default function RecurrenceSelector({
  recurrencePattern,
  dateType,
  onRecurrenceChange,
  onDateTypeChange,
}: RecurrenceSelectorProps) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [customValue, setCustomValue] = useState(String(recurrencePattern.value || 1));
  const [activeIndex, setActiveIndex] = useState(getInitialActiveIndex());
  const [showCustom, setShowCustom] = useState(recurrencePattern.type === 'custom');

  // Animated values for options
  const animation = useSharedValue(0);

  useEffect(() => {
    animation.value = withTiming(1, {
      duration: 600,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, []);

  // Get initial active index based on current recurrence pattern
  function getInitialActiveIndex() {
    const typeMap: Record<RecurrenceType, number> = {
      'daily': 0,
      'weekly': 1,
      'monthly': 2,
      'yearly': 3,
      'weekOfMonth': 4,
      'custom': 5
    };
    return typeMap[recurrencePattern.type] || 0;
  }

  // Pattern types with icons and labels
  const patternTypes = [
    {
      type: 'daily' as RecurrenceType,
      label: t.task.daily,
      icon: <Ionicons name="sunny-outline" size={28} color="#FF9500" />,
      activeColor: '#FFD9A8',
      description: t.task.every + " X " + t.task.days
    },
    {
      type: 'weekly' as RecurrenceType,
      label: t.task.weekly,
      icon: <Ionicons name="calendar-outline" size={28} color="#5856D6" />,
      activeColor: '#B3B2EF',
      description: t.task.every + " X " + t.task.weeks
    },
    {
      type: 'monthly' as RecurrenceType,
      label: t.task.monthly,
      icon: <FontAwesome5 name="calendar-alt" size={24} color="#FF2D55" />,
      activeColor: '#FFB1C3',
      description: t.task.every + " X " + t.task.months
    },
    {
      type: 'yearly' as RecurrenceType,
      label: t.task.yearly,
      icon: <MaterialCommunityIcons name="calendar-multiselect" size={28} color="#34C759" />,
      activeColor: '#A5EBBC',
      description: t.task.every + " X " + t.task.years
    },
    {
      type: 'weekOfMonth' as RecurrenceType,
      label: t.task.weekOfMonth,
      icon: <Ionicons name="calendar-number-outline" size={28} color="#007AFF" />,
      activeColor: '#99CAFF',
      description: t.task.monthDay + " " + t.task.weekDay
    },
    {
      type: 'custom' as RecurrenceType,
      label: t.task.custom,
      icon: <Ionicons name="options-outline" size={28} color="#8E8E93" />,
      activeColor: '#D1D1D6',
      description: t.task.customDesc || "自定义重复模式"
    },
  ];

  // Date types for the segmented control
  const dateTypes = [
    { type: 'solar' as DateType, label: t.task.solarCalendar },
    { type: 'lunar' as DateType, label: t.task.lunarCalendar },
  ];

  // Quick value selections
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

  // Days of month
  const days = Array.from({ length: 31 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}`
  }));

  // Week days
  const weekDays = [
    { value: 0, label: t.task.sunday || '日', short: '日' },
    { value: 1, label: t.task.monday || '一', short: '一' },
    { value: 2, label: t.task.tuesday || '二', short: '二' },
    { value: 3, label: t.task.wednesday || '三', short: '三' },
    { value: 4, label: t.task.thursday || '四', short: '四' },
    { value: 5, label: t.task.friday || '五', short: '五' },
    { value: 6, label: t.task.saturday || '六', short: '六' },
  ];

  // Weeks of month
  const weeksOfMonth = [
    { value: 1, label: '第一周' },
    { value: 2, label: '第二周' },
    { value: 3, label: '第三周' },
    { value: 4, label: '第四周' },
    { value: 5, label: '最后一周' },
  ];

  // Animation styles for main container
  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: animation.value,
      transform: [
        { translateY: interpolate(animation.value, [0, 1], [20, 0]) }
      ]
    };
  });

  // Handle recurrence type change
  const handleTypeChange = (index: number) => {
    const newType = patternTypes[index].type;
    
    const newPattern: RecurrencePattern = {
      ...recurrencePattern,
      type: newType,
      value: 1,
    };

    // Reset specific properties based on type
    if (newType !== 'custom') {
      newPattern.unit = undefined;
      setShowCustom(false);
    } else {
      newPattern.unit = 'days';
      setShowCustom(true);
    }

    if (newType !== 'weekly') {
      newPattern.weekDay = undefined;
    }

    if (newType !== 'monthly') {
      newPattern.monthDay = undefined;
    }

    if (newType !== 'yearly') {
      newPattern.yearDay = undefined;
      newPattern.month = undefined;
    }

    if (newType !== 'weekOfMonth') {
      newPattern.weekOfMonth = undefined;
      newPattern.weekDay = undefined;
      newPattern.month = undefined;
    }

    setActiveIndex(index);
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

  // Handle custom value change
  const handleCustomValueChange = (text: string) => {
    setCustomValue(text);
    const numValue = parseInt(text);
    if (!isNaN(numValue) && numValue > 0) {
      onRecurrenceChange({
        ...recurrencePattern,
        value: numValue
      });
    }
  };

  // Handle custom unit change
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

  // Render recurrence types grid
  const renderRecurrenceTypeGrid = () => {
    return (
      <View style={styles.typeGrid}>
        {patternTypes.map((item, index) => (
          <Pressable
            key={index}
            style={[
              styles.typeCard,
              { backgroundColor: activeIndex === index ? item.activeColor : colors.card }
            ]}
            onPress={() => handleTypeChange(index)}
          >
            <View style={styles.iconContainer}>
              {item.icon}
            </View>
            <Text style={[
              styles.typeLabel,
              { color: activeIndex === index ? '#000' : colors.text }
            ]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  };

  // Render date type selector - segmented control
  const renderDateTypeSelector = () => (
    <View style={styles.dateTypeContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.task.dateType}</Text>
      <View style={[styles.segmentedControl, { backgroundColor: colors.card }]}>
        {dateTypes.map((item, index) => (
          <Pressable
            key={item.type}
            style={[
              styles.segmentButton,
              dateType === item.type ? [styles.segmentButtonActive, { backgroundColor: colors.primary }] : null,
              index === 0 ? styles.segmentButtonLeft : null,
              index === dateTypes.length - 1 ? styles.segmentButtonRight : null,
            ]}
            onPress={() => handleDateTypeChange(item.type)}
          >
            <Text style={[
              styles.segmentButtonText,
              { color: dateType === item.type ? '#fff' : colors.text }
            ]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  // Render quick value selection buttons
  const renderValueButtons = () => (
    <View style={styles.valueContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {patternTypes[activeIndex].description.replace('X', '')}
      </Text>
      
      <View style={styles.valueButtonsRow}>
        {presetValues.map((value) => (
          <Pressable
            key={value}
            style={[
              styles.valueButton,
              recurrencePattern.value === value ? [styles.valueButtonActive, { backgroundColor: colors.primary }] : { backgroundColor: colors.card }
            ]}
            onPress={() => handleValueChange(value)}
          >
            <Text style={[
              styles.valueButtonText,
              { color: recurrencePattern.value === value ? '#fff' : colors.text }
            ]}>
              {value}
            </Text>
          </Pressable>
        ))}
        
        <View style={[styles.customValueContainer, { backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.customValueInput, { color: colors.text }]}
            value={customValue}
            onChangeText={handleCustomValueChange}
            keyboardType="number-pad"
            maxLength={3}
          />
        </View>
      </View>
    </View>
  );

  // Render week day selector
  const renderWeekDaySelector = () => {
    if (recurrencePattern.type !== 'weekly' && recurrencePattern.type !== 'weekOfMonth') {
      return null;
    }

    return (
      <View style={styles.optionSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.task.weekDay}</Text>
        <View style={styles.weekDaysContainer}>
          {weekDays.map((day) => (
            <Pressable
              key={day.value}
              style={[
                styles.weekDayButton,
                recurrencePattern.weekDay === day.value ? [styles.weekDayButtonActive, { backgroundColor: colors.primary }] : { backgroundColor: colors.card }
              ]}
              onPress={() => onRecurrenceChange({
                ...recurrencePattern,
                weekDay: day.value as WeekDay
              })}
            >
              <Text style={[
                styles.weekDayText,
                { color: recurrencePattern.weekDay === day.value ? '#fff' : colors.text }
              ]}>
                {day.short}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  // Render month day selector
  const renderMonthDaySelector = () => {
    if (recurrencePattern.type !== 'monthly') {
      return null;
    }

    return (
      <View style={styles.optionSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.task.monthDay}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScrollView}>
          <View style={styles.daysContainer}>
            {days.slice(0, 31).map((day) => (
              <Pressable
                key={day.value}
                style={[
                  styles.dayButton,
                  recurrencePattern.monthDay === day.value ? [styles.dayButtonActive, { backgroundColor: colors.primary }] : { backgroundColor: colors.card }
                ]}
                onPress={() => onRecurrenceChange({
                  ...recurrencePattern,
                  monthDay: day.value
                })}
              >
                <Text style={[
                  styles.dayText,
                  { color: recurrencePattern.monthDay === day.value ? '#fff' : colors.text }
                ]}>
                  {day.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  // Render week of month selector
  const renderWeekOfMonthSelector = () => {
    if (recurrencePattern.type !== 'weekOfMonth') {
      return null;
    }

    return (
      <View style={styles.optionSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.task.firstWeek.replace('第一周', '')}</Text>
        <View style={styles.weeksContainer}>
          {weeksOfMonth.map((week) => (
            <Pressable
              key={week.value}
              style={[
                styles.weekButton,
                recurrencePattern.weekOfMonth === week.value ? [styles.weekButtonActive, { backgroundColor: colors.primary }] : { backgroundColor: colors.card }
              ]}
              onPress={() => onRecurrenceChange({
                ...recurrencePattern,
                weekOfMonth: week.value as WeekOfMonth
              })}
            >
              <Text style={[
                styles.weekText,
                { color: recurrencePattern.weekOfMonth === week.value ? '#fff' : colors.text }
              ]}>
                {week.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  // Render month selector for yearly
  const renderMonthSelector = () => {
    if (recurrencePattern.type !== 'yearly' && recurrencePattern.type !== 'weekOfMonth') {
      return null;
    }

    return (
      <View style={styles.optionSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.task.month}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthsScrollView}>
          <View style={styles.monthsContainer}>
            {months.map((month) => (
              <Pressable
                key={month.value}
                style={[
                  styles.monthButton,
                  recurrencePattern.month === month.value ? [styles.monthButtonActive, { backgroundColor: colors.primary }] : { backgroundColor: colors.card }
                ]}
                onPress={() => onRecurrenceChange({
                  ...recurrencePattern,
                  month: month.value
                })}
              >
                <Text style={[
                  styles.monthText,
                  { color: recurrencePattern.month === month.value ? '#fff' : colors.text }
                ]}>
                  {month.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  // Render custom unit selector
  const renderCustomUnitSelector = () => {
    if (recurrencePattern.type !== 'custom') {
      return null;
    }

    const units = [
      { value: 'days' as RecurrenceUnit, label: t.task.days },
      { value: 'weeks' as RecurrenceUnit, label: t.task.weeks },
      { value: 'months' as RecurrenceUnit, label: t.task.months },
      { value: 'years' as RecurrenceUnit, label: t.task.years },
    ];

    return (
      <View style={styles.optionSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t.task.customRecurrence}</Text>
        <View style={styles.unitsContainer}>
          {units.map((unit) => (
            <Pressable
              key={unit.value}
              style={[
                styles.unitButton,
                recurrencePattern.unit === unit.value ? [styles.unitButtonActive, { backgroundColor: colors.primary }] : { backgroundColor: colors.card }
              ]}
              onPress={() => handleUnitChange(unit.value)}
            >
              <Text style={[
                styles.unitText,
                { color: recurrencePattern.unit === unit.value ? '#fff' : colors.text }
              ]}>
                {unit.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <ScrollView 
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderRecurrenceTypeGrid()}
        {renderDateTypeSelector()}
        
        {!showCustom && renderValueButtons()}
        
        {renderWeekDaySelector()}
        {renderMonthDaySelector()}
        {renderWeekOfMonthSelector()}
        {renderMonthSelector()}
        {renderCustomUnitSelector()}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  typeCard: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    marginBottom: 8,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  dateTypeContainer: {
    marginBottom: 20,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#007AFF',
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
  },
  segmentButtonTextActive: {
    color: '#FFFFFF',
  },
  valueContainer: {
    marginBottom: 20,
  },
  valueButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  valueButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
  },
  valueButtonActive: {
    backgroundColor: '#007AFF',
  },
  valueButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  customValueContainer: {
    width: 60,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customValueInput: {
    fontSize: 16,
    fontWeight: '500',
    width: '100%',
    height: '100%',
    textAlign: 'center',
  },
  optionSection: {
    marginBottom: 20,
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekDayButtonActive: {
    backgroundColor: '#007AFF',
  },
  weekDayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  daysScrollView: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: width * 2.5,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
  },
  dayButtonActive: {
    backgroundColor: '#007AFF',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  weeksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  weekButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  weekButtonActive: {
    backgroundColor: '#007AFF',
  },
  weekText: {
    fontSize: 14,
    fontWeight: '500',
  },
  monthsScrollView: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  monthsContainer: {
    flexDirection: 'row',
  },
  monthButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  monthButtonActive: {
    backgroundColor: '#007AFF',
  },
  monthText: {
    fontSize: 14,
    fontWeight: '500',
  },
  unitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  unitButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  unitButtonActive: {
    backgroundColor: '#007AFF',
  },
  unitText: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 