/**
 * LunarDatePicker Component for NeverMiss
 * 农历日期选择器组件
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, FlatList } from 'react-native';
import lunarService from '../models/services/lunarService';
import { useTheme } from '@react-navigation/native';

interface LunarDatePickerProps {
  value: Date; // 初始日期（公历）
  onChange: (date: Date) => void; // 返回选中的公历日期
  visible: boolean;
  onClose: () => void;
}

export default function LunarDatePicker({ value, onChange, visible, onClose }: LunarDatePickerProps) {
  // 确保传入的日期值是有效的Date对象
  const safeValue = value instanceof Date && !isNaN(value.getTime()) ? value : new Date();
  
  // 将传入的公历日期转换为农历日期
  const [lunarDate, setLunarDate] = useState(() => {
    try {
      return lunarService.solarToLunar(safeValue);
    } catch (error) {
      console.error('Error converting solar to lunar:', error);
      // 返回一个默认值，避免undefined错误
      return {
        year: new Date().getFullYear(),
        month: 1,
        day: 1,
        isLeap: false,
        zodiac: ''
      };
    }
  });
  
  // 记录用户选择的农历日期
  const [selectedYear, setSelectedYear] = useState(lunarDate.year);
  const [selectedMonth, setSelectedMonth] = useState(lunarDate.month);
  const [selectedDay, setSelectedDay] = useState(lunarDate.day);
  const [isLeapMonth, setIsLeapMonth] = useState(lunarDate.isLeap);
  
  // 状态控制当前显示的选择面板（年/月/日）
  const [currentPanel, setCurrentPanel] = useState<'year' | 'month' | 'day'>('day');
  
  const { colors } = useTheme();

  // 当输入值变化时更新内部状态
  useEffect(() => {
    try {
      // 确保传入的日期值是有效的
      if (value instanceof Date && !isNaN(value.getTime())) {
        const newLunarDate = lunarService.solarToLunar(value);
        setLunarDate(newLunarDate);
        setSelectedYear(newLunarDate.year);
        setSelectedMonth(newLunarDate.month);
        setSelectedDay(newLunarDate.day);
        setIsLeapMonth(newLunarDate.isLeap || false); // 添加默认值
      }
    } catch (error) {
      console.error('Error updating lunar date:', error);
    }
  }, [value]);

  // 生成年份列表（前后20年）
  const years = Array.from({ length: 41 }, (_, i) => lunarDate.year - 20 + i);
  
  // 获取特定年份的闰月（如果有）
  const getLeapMonth = (year: number): number => {
    try {
      return lunarService.getLeapMonth(year);
    } catch (error) {
      console.error('Error getting leap month:', error);
      return 0;
    }
  };

  // 生成月份列表（检查是否有闰月）
  const getMonths = () => {
    const months = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, isLeap: false }));
    
    // 检查是否有闰月并添加
    const leapMonth = getLeapMonth(selectedYear);
    if (leapMonth > 0) {
      months.splice(leapMonth, 0, { month: leapMonth, isLeap: true });
    }
    
    return months;
  };
  
  // 获取特定农历月的天数
  const getLunarMonthDays = (year: number, month: number, isLeap: boolean): number => {
    try {
      return lunarService.getLunarMonthDays(year, month, isLeap);
    } catch (error) {
      console.error('Error getting lunar month days:', error);
      return 30;
    }
  };

  // 生成日期列表（根据年月计算当月天数）
  const getDays = () => {
    // 根据所选年月判断当月天数
    const days = getLunarMonthDays(selectedYear, selectedMonth, isLeapMonth);
    return Array.from({ length: days }, (_, i) => i + 1);
  };
  
  // 确认选择
  const handleConfirm = () => {
    try {
      // 将选择的农历日期转换为公历
      const solarDate = lunarService.lunarToSolar(selectedYear, selectedMonth, selectedDay, isLeapMonth);
      onChange(solarDate);
      onClose();
    } catch (error) {
      // 处理无效日期错误
      console.error('Invalid lunar date', error);
      // 在生产环境中可能需要显示友好的错误提示
    }
  };
  
  // 渲染年份选择面板
  const renderYearPanel = () => {
    return (
      <FlatList
        data={years}
        numColumns={5}
        keyExtractor={item => `year-${item}`}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.itemButton,
              selectedYear === item && [styles.selectedItem, { backgroundColor: colors.primary }]
            ]}
            onPress={() => setSelectedYear(item)}
          >
            <Text style={selectedYear === item ? styles.selectedItemText : { color: colors.text }}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />
    );
  };
  
  // 渲染月份选择面板
  const renderMonthPanel = () => {
    return (
      <FlatList
        data={getMonths()}
        numColumns={4}
        keyExtractor={(item) => `month-${item.month}-${item.isLeap ? 'leap' : 'normal'}`}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.itemButton,
              selectedMonth === item.month && isLeapMonth === item.isLeap && [styles.selectedItem, { backgroundColor: colors.primary }]
            ]}
            onPress={() => {
              setSelectedMonth(item.month);
              setIsLeapMonth(item.isLeap);
              
              // 检查所选月份天数是否超过了当前选择日期
              const maxDays = getLunarMonthDays(selectedYear, item.month, item.isLeap);
              if (selectedDay > maxDays) {
                setSelectedDay(maxDays);
              }
            }}
          >
            <Text style={selectedMonth === item.month && isLeapMonth === item.isLeap ? styles.selectedItemText : { color: colors.text }}>
              {item.isLeap ? '闰' : ''}{lunarService.getLunarMonthName(item.month)}
            </Text>
          </TouchableOpacity>
        )}
      />
    );
  };
  
  // 渲染日期选择面板
  const renderDayPanel = () => {
    return (
      <FlatList
        data={getDays()}
        numColumns={7}
        keyExtractor={item => `day-${item}`}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.itemButton,
              selectedDay === item && [styles.selectedItem, { backgroundColor: colors.primary }]
            ]}
            onPress={() => setSelectedDay(item)}
          >
            <Text style={selectedDay === item ? styles.selectedItemText : { color: colors.text }}>
              {lunarService.getLunarDayName(item)}
            </Text>
          </TouchableOpacity>
        )}
      />
    );
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.pickerContainer, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: colors.text }}>取消</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>选择农历日期</Text>
            <TouchableOpacity onPress={handleConfirm}>
              <Text style={{ color: colors.primary }}>确定</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tab, currentPanel === 'year' && styles.activeTab]} 
              onPress={() => setCurrentPanel('year')}
            >
              <Text style={{ color: currentPanel === 'year' ? colors.primary : colors.text }}>
                {selectedYear}年
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, currentPanel === 'month' && styles.activeTab]} 
              onPress={() => setCurrentPanel('month')}
            >
              <Text style={{ color: currentPanel === 'month' ? colors.primary : colors.text }}>
                {isLeapMonth ? '闰' : ''}{lunarService.getLunarMonthName(selectedMonth)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, currentPanel === 'day' && styles.activeTab]} 
              onPress={() => setCurrentPanel('day')}
            >
              <Text style={{ color: currentPanel === 'day' ? colors.primary : colors.text }}>
                {lunarService.getLunarDayName(selectedDay)}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.panelContainer}>
            {currentPanel === 'year' && renderYearPanel()}
            {currentPanel === 'month' && renderMonthPanel()}
            {currentPanel === 'day' && renderDayPanel()}
          </View>
          
          <Text style={[styles.previewText, { color: colors.text }]}>
            {`${selectedYear}年${isLeapMonth ? '闰' : ''}${lunarService.getLunarMonthName(selectedMonth)}${lunarService.getLunarDayName(selectedDay)}`}
            {' '} - {' '}
            {lunarService.lunarToSolar(selectedYear, selectedMonth, selectedDay, isLeapMonth).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerContainer: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    padding: 16,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 4,
  },
  activeTab: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  panelContainer: {
    flex: 1,
    minHeight: 220,
  },
  itemButton: {
    padding: 10,
    margin: 4,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
  selectedItem: {
    backgroundColor: '#007AFF',
  },
  selectedItemText: {
    color: 'white',
  },
  previewText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
  },
}); 