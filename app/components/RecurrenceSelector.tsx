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
} from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  RecurrenceType,
  RecurrenceUnit,
  RecurrencePattern,
  WeekDay,
  WeekOfMonth,
} from '../../models/Task';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface RecurrenceSelectorProps {
  recurrencePattern: RecurrencePattern;
  onRecurrenceChange: (pattern: RecurrencePattern) => void;
}

export default function RecurrenceSelector({
  recurrencePattern,
  onRecurrenceChange,
}: RecurrenceSelectorProps) {
  const { t } = useLanguage();
  const { colors, isDarkMode } = useTheme();
  const [customValue, setCustomValue] = useState(String(recurrencePattern.value || 1));
  const [isCountFromEnd, setIsCountFromEnd] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  // 循环类型选项
  const recurrenceTypes = [
    { type: 'daily', label: t.task.daily, icon: 'sunny-outline' },
    { type: 'weekly', label: t.task.weekly, icon: 'calendar-outline' },
    { type: 'monthly', label: t.task.monthly, icon: 'calendar' },
    { type: 'yearly', label: t.task.yearly, icon: 'calendar-clear-outline' },
    { type: 'weekOfMonth', label: t.task.weekOfMonth, icon: 'calendar-number-outline' },
  ];

  // 循环值选项
  const commonValues = [1, 2, 3, 7, 14, 30];

  // 星期选项
  const weekDays = [
    { value: 0, label: t.task.sunday },
    { value: 1, label: t.task.monday },
    { value: 2, label: t.task.tuesday },
    { value: 3, label: t.task.wednesday },
    { value: 4, label: t.task.thursday },
    { value: 5, label: t.task.friday },
    { value: 6, label: t.task.saturday },
  ];

  // 月份选项
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: t.task[['january', 'february', 'march', 'april', 'may', 'june', 
                   'july', 'august', 'september', 'october', 'november', 'december'][i]] || `${i + 1}月`,
  }));

  // 月中周选项
  const weeksOfMonth = [
    { value: 1, label: t.task.firstWeek || '第一周' },
    { value: 2, label: t.task.secondWeek || '第二周' },
    { value: 3, label: t.task.thirdWeek || '第三周' },
    { value: 4, label: t.task.fourthWeek || '第四周' },
    { value: 5, label: t.task.lastWeek || '最后一周' },
  ];

  // 处理循环类型变更
  const handleTypeChange = (type: RecurrenceType) => {
    const newPattern = {
      ...recurrencePattern,
      type,
      value: recurrencePattern.value || 1,
    };

    if (type !== 'weekly' && type !== 'weekOfMonth') {
      newPattern.weekDay = undefined;
    }

    if (type !== 'monthly') {
      newPattern.monthDay = undefined;
    }

    if (type !== 'yearly') {
      newPattern.month = undefined;
    }

    if (type !== 'weekOfMonth') {
      newPattern.weekOfMonth = undefined;
    }

    onRecurrenceChange(newPattern);
  };

  // 处理循环值变更
  const handleValueChange = (value: number) => {
    onRecurrenceChange({
      ...recurrencePattern,
      value,
    });
    setCustomValue(String(value));
  };

  // 处理自定义值变更
  const handleCustomValueChange = (text: string) => {
    setCustomValue(text);
    const numValue = parseInt(text);
    if (!isNaN(numValue) && numValue > 0) {
      onRecurrenceChange({
        ...recurrencePattern,
        value: numValue,
      });
    }
  };

  // 处理星期几选择
  const handleWeekDayChange = (day: WeekDay) => {
    onRecurrenceChange({
      ...recurrencePattern,
      weekDay: day,
    });
  };

  // 处理月中第几天选择
  const handleMonthDayChange = (day: number) => {
    onRecurrenceChange({
      ...recurrencePattern,
      monthDay: day,
    });
  };

  // 处理月份选择
  const handleMonthChange = (month: number) => {
    onRecurrenceChange({
      ...recurrencePattern,
      month,
    });
  };

  // 处理月中第几周选择
  const handleWeekOfMonthChange = (week: WeekOfMonth) => {
    onRecurrenceChange({
      ...recurrencePattern,
      weekOfMonth: week,
    });
  };

  // 处理倒数切换
  const handleCountFromEndToggle = (value: boolean) => {
    setIsCountFromEnd(value);
    
    // 如果是月模式且正在使用monthDay
    if (recurrencePattern.type === 'monthly' && recurrencePattern.monthDay) {
      // 转换为从月底倒数的天数
      const newMonthDay = value 
        ? -(30 - recurrencePattern.monthDay) // 转为负数表示倒数
        : Math.abs(recurrencePattern.monthDay); // 转为正数

      onRecurrenceChange({
        ...recurrencePattern,
        monthDay: newMonthDay,
      });
    }
  };

  // 渲染日期选择器 (月中的天)
  const renderDaySelector = () => {
    if (recurrencePattern.type !== 'monthly') return null;
    
    // 生成日期选项，考虑倒数模式
    const days = isCountFromEnd
      ? Array.from({ length: 30 }, (_, i) => ({ value: -(i + 1), label: `倒数第 ${i + 1} 天` }))
      : Array.from({ length: 31 }, (_, i) => ({ value: i + 1, label: `${i + 1} 号` }));

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t.task.monthDay || '每月第几天'}
        </Text>
        <View style={styles.countToggleContainer}>
          <Text style={{ color: colors.text }}>从月末倒数:</Text>
          <Switch
            value={isCountFromEnd}
            onValueChange={handleCountFromEndToggle}
            trackColor={{ false: '#767577', true: colors.primary }}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.dayOptions}>
            {days.slice(0, 10).map((day) => (
              <TouchableOpacity
                key={day.value}
                style={[
                  styles.dayButton,
                  recurrencePattern.monthDay === day.value && [
                    styles.dayButtonActive,
                    { backgroundColor: colors.primary },
                  ],
                ]}
                onPress={() => handleMonthDayChange(day.value)}
              >
                <Text
                  style={[
                    styles.dayButtonText,
                    { color: recurrencePattern.monthDay === day.value ? '#fff' : colors.text },
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

  // 渲染月份选择器
  const renderMonthSelector = () => {
    if (recurrencePattern.type !== 'yearly' && recurrencePattern.type !== 'weekOfMonth') return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t.task.month || '月份'}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.monthOptions}>
            {months.map((month) => (
              <TouchableOpacity
                key={month.value}
                style={[
                  styles.monthButton,
                  recurrencePattern.month === month.value && [
                    styles.monthButtonActive,
                    { backgroundColor: colors.primary },
                  ],
                ]}
                onPress={() => handleMonthChange(month.value)}
              >
                <Text
                  style={[
                    styles.monthButtonText,
                    { color: recurrencePattern.month === month.value ? '#fff' : colors.text },
                  ]}
                >
                  {month.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  // 渲染月中第几周选择器
  const renderWeekOfMonthSelector = () => {
    if (recurrencePattern.type !== 'weekOfMonth') return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t.task.weekOfMonth || '第几周'}
        </Text>
        <View style={styles.weekOfMonthOptions}>
          {weeksOfMonth.map((week) => (
            <TouchableOpacity
              key={week.value}
              style={[
                styles.weekOfMonthButton,
                recurrencePattern.weekOfMonth === week.value && [
                  styles.weekOfMonthButtonActive,
                  { backgroundColor: colors.primary },
                ],
              ]}
              onPress={() => handleWeekOfMonthChange(week.value as WeekOfMonth)}
            >
              <Text
                style={[
                  styles.weekOfMonthButtonText,
                  { color: recurrencePattern.weekOfMonth === week.value ? '#fff' : colors.text },
                ]}
              >
                {week.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // 生成当前选择的描述文本
  const getRecurrenceDescription = () => {
    switch (recurrencePattern.type) {
      case 'daily':
        return `每 ${recurrencePattern.value} 天`;
        
      case 'weekly':
        return `每 ${recurrencePattern.value} 周的 ${
          recurrencePattern.weekDay !== undefined 
            ? weekDays.find(d => d.value === recurrencePattern.weekDay)?.label 
            : '(请选择星期几)'
        }`;
        
      case 'monthly':
        return `每 ${recurrencePattern.value} 月的 ${
          recurrencePattern.monthDay 
            ? (recurrencePattern.monthDay > 0 
                ? `第 ${recurrencePattern.monthDay} 天` 
                : `倒数第 ${Math.abs(recurrencePattern.monthDay)} 天`)
            : '(请选择日期)'
        }`;
        
      case 'yearly':
        return `每 ${recurrencePattern.value} 年的 ${
          recurrencePattern.month 
            ? months.find(m => m.value === recurrencePattern.month)?.label 
            : '(请选择月份)'
        } 月`;
        
      case 'weekOfMonth':
        return `每 ${recurrencePattern.value} 月的 ${
          recurrencePattern.month 
            ? months.find(m => m.value === recurrencePattern.month)?.label 
            : '(请选择月份)'
        } 月的 ${
          recurrencePattern.weekOfMonth 
            ? weeksOfMonth.find(w => w.value === recurrencePattern.weekOfMonth)?.label 
            : '(请选择第几周)'
        } 的 ${
          recurrencePattern.weekDay !== undefined 
            ? weekDays.find(d => d.value === recurrencePattern.weekDay)?.label 
            : '(请选择星期几)'
        }`;
        
      default:
        return '请选择重复类型';
    }
  };
  
  // 渲染模态框内容
  const renderModalContent = () => (
    <ScrollView style={styles.modalScrollView}>
      {/* 循环类型选择 */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t.task.recurrenceType}
        </Text>
        <View style={styles.typeList}>
          {recurrenceTypes.map((item) => (
            <TouchableOpacity
              key={item.type}
              style={[
                styles.typeButton,
                recurrencePattern.type === item.type && [
                  styles.typeButtonActive,
                  { backgroundColor: colors.primary },
                ],
              ]}
              onPress={() => handleTypeChange(item.type as RecurrenceType)}
            >
              <Ionicons
                name={item.icon as any}
                size={22}
                color={recurrencePattern.type === item.type ? '#fff' : colors.text}
                style={styles.typeIcon}
              />
              <Text
                style={[
                  styles.typeText,
                  { color: recurrencePattern.type === item.type ? '#fff' : colors.text },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 循环值选择 */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t.task.recurrenceValue}
        </Text>
        <View style={styles.valueContainer}>
          <View style={styles.valueBubbles}>
            {commonValues.map((value) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.valueBubble,
                  recurrencePattern.value === value && [
                    styles.valueBubbleActive,
                    { backgroundColor: colors.primary },
                  ],
                ]}
                onPress={() => handleValueChange(value)}
              >
                <Text
                  style={[
                    styles.valueBubbleText,
                    { color: recurrencePattern.value === value ? '#fff' : colors.text },
                  ]}
                >
                  {value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.customValueContainer}>
            <Text style={[styles.customValueLabel, { color: colors.text }]}>
              {t.task.customValue}:
            </Text>
            <TextInput
              style={[
                styles.customValueInput,
                { borderColor: colors.border, color: colors.text },
              ]}
              value={customValue}
              onChangeText={handleCustomValueChange}
              keyboardType="numeric"
              maxLength={3}
            />
            <Text style={[styles.unitText, { color: colors.text }]}>
              {recurrencePattern.type === 'daily' && t.task.days}
              {recurrencePattern.type === 'weekly' && t.task.weeks}
              {recurrencePattern.type === 'monthly' && t.task.months}
              {recurrencePattern.type === 'yearly' && t.task.years}
              {recurrencePattern.type === 'weekOfMonth' && t.task.months}
            </Text>
          </View>
        </View>
      </View>

      {/* 月份选择 - 仅当循环类型为yearly或weekOfMonth时显示 */}
      {renderMonthSelector()}

      {/* 月中第几周选择 - 仅当循环类型为weekOfMonth时显示 */}
      {renderWeekOfMonthSelector()}

      {/* 星期选择 - 仅当循环类型为weekly或weekOfMonth时显示 */}
      {(recurrencePattern.type === 'weekly' || recurrencePattern.type === 'weekOfMonth') && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t.task.weekDay}
          </Text>
          <View style={styles.weekDayList}>
            {weekDays.map((day) => (
              <TouchableOpacity
                key={day.value}
                style={[
                  styles.weekDayButton,
                  recurrencePattern.weekDay === day.value && [
                    styles.weekDayButtonActive,
                    { backgroundColor: colors.primary },
                  ],
                ]}
                onPress={() => handleWeekDayChange(day.value as WeekDay)}
              >
                <Text
                  style={[
                    styles.weekDayText,
                    { color: recurrencePattern.weekDay === day.value ? '#fff' : colors.text },
                  ]}
                >
                  {day.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* 每月第几天选择 - 仅当循环类型为monthly时显示 */}
      {renderDaySelector()}

      {/* 显示当前选择的组合 */}
      <View style={[styles.section, styles.summarySection]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          当前选择:
        </Text>
        <Text style={[styles.summaryText, { color: colors.text }]}>
          {getRecurrenceDescription()}
        </Text>
      </View>
      
      {/* 底部按钮 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.cancelButton, { borderColor: colors.border }]}
          onPress={() => setModalVisible(false)}
        >
          <Text style={{ color: colors.text }}>{t.common?.cancel || '取消'}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.confirmButton, { backgroundColor: colors.primary }]}
          onPress={() => setModalVisible(false)}
        >
          <Text style={{ color: '#FFFFFF' }}>{t.common?.save || '确定'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t.task.recurrenceSettings || '重复设置'}
        </Text>
        <TouchableOpacity
          style={[styles.selectButton, { backgroundColor: colors.primary }]}
          onPress={() => setModalVisible(true)}
        >
          <Text style={{ color: '#FFFFFF' }}>{t.common?.edit || '编辑'}</Text>
        </TouchableOpacity>
      </View>
      
      <View style={[styles.patternDisplay, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.patternRow}>
          <View style={styles.patternIconContainer}>
            <Ionicons 
              name={
                recurrencePattern.type === 'daily' ? 'sunny-outline' :
                recurrencePattern.type === 'weekly' ? 'calendar-outline' :
                recurrencePattern.type === 'monthly' ? 'calendar' :
                recurrencePattern.type === 'yearly' ? 'calendar-clear-outline' :
                'calendar-number-outline'
              } 
              size={24} 
              color={colors.primary} 
            />
          </View>
          <Text style={[styles.patternText, { color: colors.text }]}>
            {getRecurrenceDescription()}
          </Text>
        </View>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t.task.recurrenceSettings || '重复设置'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {renderModalContent()}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  patternDisplay: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  patternRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patternIconContainer: {
    marginRight: 12,
  },
  patternText: {
    fontSize: 16,
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  modalScrollView: {
    padding: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  typeList: {
    flexDirection: 'column',
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: '#f0f0f0',
  },
  typeButtonActive: {
    borderColor: 'transparent',
  },
  typeIcon: {
    marginRight: 12,
  },
  typeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  valueContainer: {
    marginTop: 8,
  },
  valueBubbles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  valueBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    marginBottom: 10,
  },
  valueBubbleActive: {
    borderColor: 'transparent',
  },
  valueBubbleText: {
    fontSize: 16,
    fontWeight: '100',
  },
  customValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customValueLabel: {
    fontSize: 16,
    marginRight: 8,
  },
  customValueInput: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    textAlign: 'center',
  },
  unitText: {
    fontSize: 16,
  },
  weekDayList: {
    marginTop: 8,
  },
  weekDayButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 8,
  },
  weekDayButtonActive: {
    borderColor: 'transparent',
  },
  weekDayText: {
    fontSize: 16,
  },
  countToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  dayOptions: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  dayButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  dayButtonActive: {
    borderColor: 'transparent',
  },
  dayButtonText: {
    fontSize: 14,
  },
  monthOptions: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
  },
  monthButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  monthButtonActive: {
    borderColor: 'transparent',
  },
  monthButtonText: {
    fontSize: 14,
  },
  weekOfMonthOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  weekOfMonthButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  weekOfMonthButtonActive: {
    borderColor: 'transparent',
  },
  weekOfMonthButtonText: {
    fontSize: 14,
  },
  summarySection: {
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginTop: 6,
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    marginRight: 8,
    borderWidth: 1,
  },
  confirmButton: {
    marginLeft: 8,
  },
}); 