import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView, TouchableOpacity, Switch } from 'react-native';
import lunarService from '../models/services/lunarService';
import { useTheme } from '@react-navigation/native';
import LunarDatePicker from '../components/LunarDatePicker';

export default function TestLunarScreen() {
  const { colors } = useTheme();
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showLunarPicker, setShowLunarPicker] = useState(false);
  const [useLunar, setUseLunar] = useState(false);

  // 添加日志
  const addLog = (message: string) => {
    setLogs(prev => [`${new Date().toISOString().slice(11, 19)}: ${message}`, ...prev]);
  };

  // 清除日志
  const clearLogs = () => {
    setLogs([]);
  };

  // 测试农历日期转换
  const testLunarConversion = () => {
    try {
      const lunarDate = lunarService.solarToLunar(selectedDate);
      addLog(`公历转农历: ${selectedDate.toLocaleDateString()} => `
        + `农历${lunarDate.year}年${lunarDate.isLeap ? '闰' : ''}${lunarDate.month}月${lunarDate.day}日 (${lunarDate.zodiac}年)`);
      
      const solarDate = lunarService.lunarToSolar(lunarDate.year, lunarDate.month, lunarDate.day, lunarDate.isLeap);
      addLog(`农历转公历: 农历${lunarDate.year}年${lunarDate.isLeap ? '闰' : ''}${lunarDate.month}月${lunarDate.day}日 => `
        + `${solarDate.toLocaleDateString()}`);
    } catch (error) {
      addLog(`错误: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 测试农历信息获取
  const testLunarInfo = () => {
    try {
      const info = lunarService.getFullLunarInfo(selectedDate);
      addLog(`农历日期: ${info.lunarDate}`);
      addLog(`年份: ${info.lunarYear}年 (${info.ganZhi}, ${info.zodiac}年)`);
      addLog(`农历月日: ${info.isLeap ? '闰' : ''}${info.lunarMonth}月${info.lunarDay}日`);
      
      if (info.lunarFestival) {
        addLog(`农历节日: ${info.lunarFestival}`);
      }
      
      if (info.solarTerm) {
        addLog(`节气: ${info.solarTerm}`);
      }
    } catch (error) {
      addLog(`错误: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 测试农历日期增加
  const testLunarAddDays = () => {
    try {
      const newDate = lunarService.addLunarTime(selectedDate, 10, 'day');
      const lunarInfo = lunarService.solarToLunar(selectedDate);
      const newLunarInfo = lunarService.solarToLunar(newDate);
      
      addLog(`当前农历日期: 农历${lunarInfo.year}年${lunarInfo.isLeap ? '闰' : ''}${lunarInfo.month}月${lunarInfo.day}日`);
      addLog(`增加10个农历日后: 农历${newLunarInfo.year}年${newLunarInfo.isLeap ? '闰' : ''}${newLunarInfo.month}月${newLunarInfo.day}日`);
      addLog(`对应公历日期: ${newDate.toLocaleDateString()}`);
    } catch (error) {
      addLog(`错误: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 测试农历月份增加
  const testLunarAddMonths = () => {
    try {
      const newDate = lunarService.addLunarTime(selectedDate, 1, 'month');
      const lunarInfo = lunarService.solarToLunar(selectedDate);
      const newLunarInfo = lunarService.solarToLunar(newDate);
      
      addLog(`当前农历日期: 农历${lunarInfo.year}年${lunarInfo.isLeap ? '闰' : ''}${lunarInfo.month}月${lunarInfo.day}日`);
      addLog(`增加1个农历月后: 农历${newLunarInfo.year}年${newLunarInfo.isLeap ? '闰' : ''}${newLunarInfo.month}月${newLunarInfo.day}日`);
      addLog(`对应公历日期: ${newDate.toLocaleDateString()}`);
    } catch (error) {
      addLog(`错误: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 测试特殊情况：跨闰月
  const testLeapMonthHandling = () => {
    try {
      // 查找最近的闰月
      let leapYear = new Date().getFullYear();
      let leapMonth = 0;

      // 尝试最近5年
      for (let i = 0; i < 5; i++) {
        leapMonth = lunarService.getLeapMonth(leapYear + i);
        if (leapMonth > 0) {
          leapYear += i;
          break;
        }
      }

      if (leapMonth === 0) {
        addLog(`未找到最近年份的闰月`);
        return;
      }

      // 创建一个闰月前的日期
      const beforeLeapDate = lunarService.lunarToSolar(leapYear, leapMonth, 15, false);
      const afterLeapDate = lunarService.lunarToSolar(leapYear, leapMonth, 15, true);
      
      addLog(`找到闰月: ${leapYear}年闰${leapMonth}月`);
      addLog(`闰月前: ${leapMonth}月15日 => ${beforeLeapDate.toLocaleDateString()}`);
      addLog(`闰月: 闰${leapMonth}月15日 => ${afterLeapDate.toLocaleDateString()}`);

      // 测试跨闰月增加
      const nextMonthDate = lunarService.addLunarTime(beforeLeapDate, 1, 'month');
      const lunarNext = lunarService.solarToLunar(nextMonthDate);
      addLog(`${leapMonth}月15日增加1个农历月 => 农历${lunarNext.year}年${lunarNext.isLeap ? '闰' : ''}${lunarNext.month}月${lunarNext.day}日`);
    } catch (error) {
      addLog(`错误: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>农历功能测试</Text>
      
      <View style={styles.dateContainer}>
        <View style={styles.dateHeader}>
          <Text style={[styles.dateLabel, { color: colors.text }]}>
            当前选择的日期:
          </Text>
          <View style={styles.switchContainer}>
            <Text style={{ color: colors.text }}>公历</Text>
            <Switch
              value={useLunar}
              onValueChange={setUseLunar}
              style={{ marginHorizontal: 8 }}
            />
            <Text style={{ color: colors.text }}>农历</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[styles.dateButton, { borderColor: colors.border }]}
          onPress={() => setShowLunarPicker(true)}
        >
          <Text style={[styles.dateText, { color: colors.text }]}>
            {useLunar 
              ? lunarService.convertToLunar(selectedDate)
              : selectedDate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
        
        <LunarDatePicker
          visible={showLunarPicker}
          value={selectedDate}
          onChange={(date) => {
            setSelectedDate(date);
            setShowLunarPicker(false);
          }}
          onClose={() => setShowLunarPicker(false)}
        />
      </View>
      
      <View style={styles.buttonsContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={testLunarConversion}
          >
            <Text style={styles.buttonText}>测试转换</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={testLunarInfo}
          >
            <Text style={styles.buttonText}>获取农历信息</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={testLunarAddDays}
          >
            <Text style={styles.buttonText}>增加农历日</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={testLunarAddMonths}
          >
            <Text style={styles.buttonText}>增加农历月</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={testLeapMonthHandling}
        >
          <Text style={styles.buttonText}>测试闰月处理</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.logHeaderContainer}>
        <Text style={[styles.logHeader, { color: colors.text }]}>测试日志:</Text>
        <TouchableOpacity 
          style={[styles.clearButton, { backgroundColor: colors.notification }]}
          onPress={clearLogs}
        >
          <Text style={styles.clearButtonText}>清除日志</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={[styles.logContainer, { borderColor: colors.border }]}>
        {logs.length === 0 ? (
          <Text style={[styles.emptyLog, { color: colors.text + '80' }]}>
            点击上方按钮开始测试...
          </Text>
        ) : (
          logs.map((log, index) => (
            <Text key={index} style={[styles.logText, { color: colors.text }]}>
              {log}
            </Text>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  dateContainer: {
    marginBottom: 20,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
  },
  buttonsContainer: {
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    margin: 4,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
  },
  logHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logHeader: {
    fontSize: 16,
    fontWeight: '500',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  logContainer: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  logText: {
    marginBottom: 8,
    fontSize: 14,
  },
  emptyLog: {
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
}); 