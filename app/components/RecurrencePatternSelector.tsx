import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecurrencePattern, AdvancedRecurrencePattern, RecurrenceType, WeekDay } from '../models/Task';

interface RecurrencePatternSelectorProps {
  isRecurring: boolean;
  recurrencePattern: RecurrencePattern;
  useAdvancedRecurrence: boolean;
  advancedRecurrencePattern: AdvancedRecurrencePattern;
  onIsRecurringChange: (value: boolean) => void;
  onRecurrencePatternChange: (pattern: RecurrencePattern) => void;
  onUseAdvancedRecurrenceChange: (value: boolean) => void;
  onAdvancedRecurrencePatternChange: (pattern: AdvancedRecurrencePattern) => void;
}

/**
 * 重复模式选择器组件
 * 用于选择和配置任务的重复模式
 */
export default function RecurrencePatternSelector({
  isRecurring,
  recurrencePattern,
  useAdvancedRecurrence,
  advancedRecurrencePattern,
  onIsRecurringChange,
  onRecurrencePatternChange,
  onUseAdvancedRecurrenceChange,
  onAdvancedRecurrencePatternChange
}: RecurrencePatternSelectorProps) {

  // 获取高级循环描述
  const getAdvancedRecurrenceDescription = () => {
    const {
      selectedDateType,
      yearValue,
      monthValue,
      weekValue,
      dayValue,
      weekDay,
      useSpecialDate,
      specialDateType,
      countDirection
    } = advancedRecurrencePattern;
    
    // 特殊日期描述
    if (useSpecialDate) {
      switch(specialDateType) {
        case 'weekend':
          return `每周末重复`;
        case 'workday':
          return `每个工作日重复`;
        case 'holiday':
          return `每个法定节假日重复`;
        case 'solarTerm':
          return `每个节气日重复`;
        default:
          return `使用特殊日期重复`;
      }
    }
    
    // 基于日期类型的描述
    switch(selectedDateType) {
      case 'day':
        return `每 ${dayValue} 天重复一次`;
        
      case 'week':
        return `每 ${weekValue} 周的星期${'日一二三四五六'[weekDay]}重复一次`;
        
      case 'month':
        if (countDirection === 'backward') {
          return `每 ${monthValue} 月的倒数第 ${dayValue} 天重复一次`;
        } else {
          return `每 ${monthValue} 个月的第 ${dayValue} 天重复一次`;
        }
        
      case 'year':
        if (countDirection === 'backward') {
          return `每 ${yearValue} 年的第 ${monthValue} 月的倒数第 ${dayValue} 天重复一次`;
        } else {
          return `每 ${yearValue} 年的第 ${monthValue} 月的第 ${dayValue} 天重复一次`;
        }
        
      default:
        return `自定义重复模式`;
    }
  };

  // 获取简单模式描述
  const getSimpleRecurrenceDescription = () => {
    const { type, value = 1, weekDay } = recurrencePattern;
    
    switch(type) {
      case 'daily':
        return `每${value}天重复一次`;
        
      case 'weekly':
        if (weekDay !== undefined) {
          return `每${value}周的星期${'日一二三四五六'[weekDay]}重复一次`;
        } else {
          return `每${value}周重复一次`;
        }
        
      case 'monthly':
        return `每${value}个月重复一次`;
        
      case 'yearly':
        return `每${value}年重复一次`;
        
      default:
        return '自定义重复模式';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>重复设置</Text>
      
      {/* 使用按钮启用/禁用重复 */}
      <TouchableOpacity
        style={[
          styles.toggleButton, 
          { 
            backgroundColor: isRecurring ? '#e3f2fd' : '#f5f5f5',
            borderColor: isRecurring ? '#2196F3' : '#dddddd',
          }
        ]}
        onPress={() => onIsRecurringChange(!isRecurring)}
      >
        <Text style={{
          fontSize: 16,
          color: '#000000',
          fontWeight: isRecurring ? 'bold' : 'normal'
        }}>
          {isRecurring ? '已启用重复' : '启用重复'}
        </Text>
        <Ionicons 
          name={isRecurring ? "repeat" : "repeat-outline"} 
          size={24} 
          color={isRecurring ? '#2196F3' : '#666666'} 
        />
      </TouchableOpacity>
      
      {/* 仅当启用重复时显示模式选择 */}
      {isRecurring && (
        <>
          <Text style={styles.subSectionTitle}>重复模式选择</Text>
          
          <View style={styles.optionsRow}>
            {[
              { value: 'simple', label: '简单模式', icon: 'calendar-outline' as const },
              { value: 'advanced', label: '高级模式', icon: 'options-outline' as const },
              { value: 'special', label: '特殊日期', icon: 'star-outline' as const }
            ].map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.modeButton,
                  { 
                    backgroundColor: 
                      (item.value === 'simple' && !useAdvancedRecurrence && !advancedRecurrencePattern.useSpecialDate) ||
                      (item.value === 'advanced' && useAdvancedRecurrence && !advancedRecurrencePattern.useSpecialDate) ||
                      (item.value === 'special' && advancedRecurrencePattern.useSpecialDate)
                        ? '#e3f2fd' 
                        : '#f5f5f5',
                    borderColor: 
                      (item.value === 'simple' && !useAdvancedRecurrence && !advancedRecurrencePattern.useSpecialDate) ||
                      (item.value === 'advanced' && useAdvancedRecurrence && !advancedRecurrencePattern.useSpecialDate) ||
                      (item.value === 'special' && advancedRecurrencePattern.useSpecialDate)
                        ? '#2196F3' 
                        : '#dddddd',
                  }
                ]}
                onPress={() => {
                  if (item.value === 'simple') {
                    onUseAdvancedRecurrenceChange(false);
                    onAdvancedRecurrencePatternChange({
                      ...advancedRecurrencePattern,
                      useSpecialDate: false
                    });
                  } else if (item.value === 'advanced') {
                    onUseAdvancedRecurrenceChange(true);
                    onAdvancedRecurrencePatternChange({
                      ...advancedRecurrencePattern,
                      useSpecialDate: false
                    });
                  } else if (item.value === 'special') {
                    onUseAdvancedRecurrenceChange(true);
                    onAdvancedRecurrencePatternChange({
                      ...advancedRecurrencePattern,
                      useSpecialDate: true
                    });
                  }
                }}
              >
                <Ionicons 
                  name={item.icon} 
                  size={20} 
                  color={
                    (item.value === 'simple' && !useAdvancedRecurrence && !advancedRecurrencePattern.useSpecialDate) ||
                    (item.value === 'advanced' && useAdvancedRecurrence && !advancedRecurrencePattern.useSpecialDate) ||
                    (item.value === 'special' && advancedRecurrencePattern.useSpecialDate)
                      ? '#2196F3' 
                      : '#666666'
                  } 
                  style={styles.buttonIcon}
                />
                <Text style={{
                  fontSize: 14,
                  color: 
                    (item.value === 'simple' && !useAdvancedRecurrence && !advancedRecurrencePattern.useSpecialDate) ||
                    (item.value === 'advanced' && useAdvancedRecurrence && !advancedRecurrencePattern.useSpecialDate) ||
                    (item.value === 'special' && advancedRecurrencePattern.useSpecialDate)
                      ? '#2196F3' 
                      : '#666666'
                }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* 简单模式的循环设置 */}
          {!useAdvancedRecurrence && !advancedRecurrencePattern.useSpecialDate && (
            <>
              <Text style={styles.subSectionTitle}>重复类型</Text>
              
              <View style={styles.optionsRow}>
                {[
                  { type: 'daily', label: '每天' },
                  { type: 'weekly', label: '每周' },
                  { type: 'monthly', label: '每月' },
                  { type: 'yearly', label: '每年' }
                ].map((item) => (
                  <TouchableOpacity
                    key={item.type}
                    style={[
                      styles.typeButton,
                      {
                        backgroundColor: recurrencePattern.type === item.type ? '#e3f2fd' : '#f5f5f5',
                        borderColor: recurrencePattern.type === item.type ? '#2196F3' : '#dddddd'
                      }
                    ]}
                    onPress={() => {
                      onRecurrencePatternChange({
                        ...recurrencePattern,
                        type: item.type as RecurrenceType
                      });
                    }}
                  >
                    <Text style={{
                      fontSize: 14,
                      fontWeight: recurrencePattern.type === item.type ? 'bold' : 'normal',
                      color: recurrencePattern.type === item.type ? '#2196F3' : '#333333'
                    }}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* 间隔值设置 */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>间隔设置</Text>
                
                <View style={styles.inputRow}>
                  <Text style={styles.inputText}>每</Text>
                  <TextInput
                    style={styles.numberInput}
                    value={String(recurrencePattern.value || 1)}
                    onChangeText={(text) => {
                      const value = parseInt(text);
                      if (!isNaN(value) && value > 0) {
                        onRecurrencePatternChange({
                          ...recurrencePattern,
                          value
                        });
                      }
                    }}
                    keyboardType="numeric"
                  />
                  <Text style={styles.inputText}>
                    {recurrencePattern.type === 'daily' ? '天' : 
                     recurrencePattern.type === 'weekly' ? '周' : 
                     recurrencePattern.type === 'monthly' ? '月' : '年'}
                  </Text>
                </View>
              </View>
              
              {/* 周几选择 - 仅当重复类型为每周时显示 */}
              {recurrencePattern.type === 'weekly' && (
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>选择星期几</Text>
                  
                  <View style={styles.weekDaySelector}>
                    {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.weekDayButton,
                          {
                            backgroundColor: recurrencePattern.weekDay === index ? '#2196F3' : '#f5f5f5',
                            borderColor: recurrencePattern.weekDay === index ? '#2196F3' : '#dddddd',
                          }
                        ]}
                        onPress={() => {
                          onRecurrencePatternChange({
                            ...recurrencePattern,
                            weekDay: index as WeekDay
                          });
                        }}
                      >
                        <Text style={{
                          color: recurrencePattern.weekDay === index ? '#ffffff' : '#000000',
                          fontWeight: recurrencePattern.weekDay === index ? 'bold' : 'normal'
                        }}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              
              {/* 当前重复模式预览 */}
              <View style={styles.previewBox}>
                <Text style={styles.previewTitle}>当前设置</Text>
                <Text style={styles.previewText}>{getSimpleRecurrenceDescription()}</Text>
              </View>
            </>
          )}
          
          {/* 高级模式设置 */}
          {useAdvancedRecurrence && !advancedRecurrencePattern.useSpecialDate && (
            <>
              <Text style={styles.subSectionTitle}>高级循环设置</Text>
              
              {/* 选择日期基础类型 */}
              <View style={styles.settingCard}>
                <Text style={styles.settingTitle}>选择基础周期单位</Text>
                
                <View style={styles.optionsRow}>
                  {[
                    { type: 'day', label: '天' },
                    { type: 'week', label: '周' },
                    { type: 'month', label: '月' },
                    { type: 'year', label: '年' }
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.type}
                      style={[
                        styles.typeButton,
                        {
                          backgroundColor: advancedRecurrencePattern.selectedDateType === item.type ? '#e3f2fd' : '#f5f5f5',
                          borderColor: advancedRecurrencePattern.selectedDateType === item.type ? '#2196F3' : '#dddddd'
                        }
                      ]}
                      onPress={() => {
                        onAdvancedRecurrencePatternChange({
                          ...advancedRecurrencePattern,
                          selectedDateType: item.type as 'day' | 'week' | 'month' | 'year'
                        });
                      }}
                    >
                      <Text style={{
                        fontSize: 14,
                        fontWeight: advancedRecurrencePattern.selectedDateType === item.type ? 'bold' : 'normal',
                        color: advancedRecurrencePattern.selectedDateType === item.type ? '#2196F3' : '#333333'
                      }}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              {/* 年循环设置 */}
              {advancedRecurrencePattern.selectedDateType === 'year' && (
                <View style={styles.settingCard}>
                  <Text style={styles.settingTitle}>年循环</Text>
                  
                  <View style={styles.inputRow}>
                    <Text style={styles.inputText}>每</Text>
                    <TextInput
                      style={styles.numberInput}
                      value={String(advancedRecurrencePattern.yearValue)}
                      onChangeText={(text) => {
                        const value = parseInt(text);
                        if (!isNaN(value) && value > 0) {
                          onAdvancedRecurrencePatternChange({
                            ...advancedRecurrencePattern,
                            yearValue: value
                          });
                        }
                      }}
                      keyboardType="numeric"
                    />
                    <Text style={styles.inputText}>年的第</Text>
                    <TextInput
                      style={styles.numberInput}
                      value={String(advancedRecurrencePattern.monthValue)}
                      onChangeText={(text) => {
                        const value = parseInt(text);
                        if (!isNaN(value) && value > 0 && value <= 12) {
                          onAdvancedRecurrencePatternChange({
                            ...advancedRecurrencePattern,
                            monthValue: value
                          });
                        }
                      }}
                      keyboardType="numeric"
                    />
                    <Text style={styles.inputText}>月的</Text>
                  </View>
                  
                  <View style={[styles.inputRow, { marginTop: 12 }]}>
                    <TouchableOpacity
                      style={[
                        styles.directionButton,
                        {
                          backgroundColor: advancedRecurrencePattern.countDirection === 'forward' ? '#e3f2fd' : '#f5f5f5',
                          borderColor: advancedRecurrencePattern.countDirection === 'forward' ? '#2196F3' : '#dddddd'
                        }
                      ]}
                      onPress={() => {
                        onAdvancedRecurrencePatternChange({
                          ...advancedRecurrencePattern,
                          countDirection: 'forward'
                        });
                      }}
                    >
                      <Text style={{
                        color: advancedRecurrencePattern.countDirection === 'forward' ? '#2196F3' : '#333333'
                      }}>
                        第
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.directionButton,
                        {
                          backgroundColor: advancedRecurrencePattern.countDirection === 'backward' ? '#e3f2fd' : '#f5f5f5',
                          borderColor: advancedRecurrencePattern.countDirection === 'backward' ? '#2196F3' : '#dddddd',
                          marginLeft: 8
                        }
                      ]}
                      onPress={() => {
                        onAdvancedRecurrencePatternChange({
                          ...advancedRecurrencePattern,
                          countDirection: 'backward'
                        });
                      }}
                    >
                      <Text style={{
                        color: advancedRecurrencePattern.countDirection === 'backward' ? '#2196F3' : '#333333'
                      }}>
                        倒数第
                      </Text>
                    </TouchableOpacity>
                    
                    <TextInput
                      style={[styles.numberInput, { marginLeft: 8 }]}
                      value={String(advancedRecurrencePattern.dayValue)}
                      onChangeText={(text) => {
                        const value = parseInt(text);
                        if (!isNaN(value) && value > 0) {
                          onAdvancedRecurrencePatternChange({
                            ...advancedRecurrencePattern,
                            dayValue: value
                          });
                        }
                      }}
                      keyboardType="numeric"
                    />
                    <Text style={styles.inputText}>天</Text>
                  </View>
                </View>
              )}
              
              {/* 月循环设置 */}
              {advancedRecurrencePattern.selectedDateType === 'month' && (
                <View style={styles.settingCard}>
                  <Text style={styles.settingTitle}>月循环</Text>
                  
                  <View style={styles.inputRow}>
                    <Text style={styles.inputText}>每</Text>
                    <TextInput
                      style={styles.numberInput}
                      value={String(advancedRecurrencePattern.monthValue)}
                      onChangeText={(text) => {
                        const value = parseInt(text);
                        if (!isNaN(value) && value > 0) {
                          onAdvancedRecurrencePatternChange({
                            ...advancedRecurrencePattern,
                            monthValue: value
                          });
                        }
                      }}
                      keyboardType="numeric"
                    />
                    <Text style={styles.inputText}>月的</Text>
                  </View>
                  
                  <View style={[styles.inputRow, { marginTop: 12 }]}>
                    <TouchableOpacity
                      style={[
                        styles.directionButton,
                        {
                          backgroundColor: advancedRecurrencePattern.countDirection === 'forward' ? '#e3f2fd' : '#f5f5f5',
                          borderColor: advancedRecurrencePattern.countDirection === 'forward' ? '#2196F3' : '#dddddd'
                        }
                      ]}
                      onPress={() => {
                        onAdvancedRecurrencePatternChange({
                          ...advancedRecurrencePattern,
                          countDirection: 'forward'
                        });
                      }}
                    >
                      <Text style={{
                        color: advancedRecurrencePattern.countDirection === 'forward' ? '#2196F3' : '#333333'
                      }}>
                        第
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.directionButton,
                        {
                          backgroundColor: advancedRecurrencePattern.countDirection === 'backward' ? '#e3f2fd' : '#f5f5f5',
                          borderColor: advancedRecurrencePattern.countDirection === 'backward' ? '#2196F3' : '#dddddd',
                          marginLeft: 8
                        }
                      ]}
                      onPress={() => {
                        onAdvancedRecurrencePatternChange({
                          ...advancedRecurrencePattern,
                          countDirection: 'backward'
                        });
                      }}
                    >
                      <Text style={{
                        color: advancedRecurrencePattern.countDirection === 'backward' ? '#2196F3' : '#333333'
                      }}>
                        倒数第
                      </Text>
                    </TouchableOpacity>
                    
                    <TextInput
                      style={[styles.numberInput, { marginLeft: 8 }]}
                      value={String(advancedRecurrencePattern.dayValue)}
                      onChangeText={(text) => {
                        const value = parseInt(text);
                        if (!isNaN(value) && value > 0) {
                          onAdvancedRecurrencePatternChange({
                            ...advancedRecurrencePattern,
                            dayValue: value
                          });
                        }
                      }}
                      keyboardType="numeric"
                    />
                    <Text style={styles.inputText}>天</Text>
                  </View>
                </View>
              )}
              
              {/* 周循环设置 */}
              {advancedRecurrencePattern.selectedDateType === 'week' && (
                <View style={styles.settingCard}>
                  <Text style={styles.settingTitle}>周循环</Text>
                  
                  <View style={styles.inputRow}>
                    <Text style={styles.inputText}>每</Text>
                    <TextInput
                      style={styles.numberInput}
                      value={String(advancedRecurrencePattern.weekValue)}
                      onChangeText={(text) => {
                        const value = parseInt(text);
                        if (!isNaN(value) && value > 0) {
                          onAdvancedRecurrencePatternChange({
                            ...advancedRecurrencePattern,
                            weekValue: value
                          });
                        }
                      }}
                      keyboardType="numeric"
                    />
                    <Text style={styles.inputText}>周的星期</Text>
                  </View>
                  
                  <View style={styles.weekDaySelector}>
                    {['日', '一', '二', '三', '四', '五', '六'].map((day, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.weekDayButton,
                          {
                            backgroundColor: advancedRecurrencePattern.weekDay === index ? '#2196F3' : '#f5f5f5',
                            borderColor: advancedRecurrencePattern.weekDay === index ? '#2196F3' : '#dddddd',
                          }
                        ]}
                        onPress={() => {
                          onAdvancedRecurrencePatternChange({
                            ...advancedRecurrencePattern,
                            weekDay: index
                          });
                        }}
                      >
                        <Text style={{
                          color: advancedRecurrencePattern.weekDay === index ? '#ffffff' : '#000000',
                          fontWeight: advancedRecurrencePattern.weekDay === index ? 'bold' : 'normal'
                        }}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              
              {/* 天循环设置 */}
              {advancedRecurrencePattern.selectedDateType === 'day' && (
                <View style={styles.settingCard}>
                  <Text style={styles.settingTitle}>天循环</Text>
                  
                  <View style={styles.inputRow}>
                    <Text style={styles.inputText}>每</Text>
                    <TextInput
                      style={styles.numberInput}
                      value={String(advancedRecurrencePattern.dayValue)}
                      onChangeText={(text) => {
                        const value = parseInt(text);
                        if (!isNaN(value) && value > 0) {
                          onAdvancedRecurrencePatternChange({
                            ...advancedRecurrencePattern,
                            dayValue: value
                          });
                        }
                      }}
                      keyboardType="numeric"
                    />
                    <Text style={styles.inputText}>天</Text>
                  </View>
                </View>
              )}
              
              {/* 当前高级设置预览 */}
              <View style={styles.previewBox}>
                <Text style={styles.previewTitle}>当前设置</Text>
                <Text style={styles.previewText}>{getAdvancedRecurrenceDescription()}</Text>
              </View>
            </>
          )}
          
          {/* 特殊日期设置 */}
          {advancedRecurrencePattern.useSpecialDate && (
            <>
              <Text style={styles.subSectionTitle}>特殊日期设置</Text>
              
              <View style={styles.settingCard}>
                <Text style={styles.settingTitle}>选择特殊日期类型</Text>
                
                <View style={styles.optionsRow}>
                  {[
                    { type: 'weekend', label: '周末' },
                    { type: 'workday', label: '工作日' },
                    { type: 'holiday', label: '节假日' },
                    { type: 'solarTerm', label: '节气日' }
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.type}
                      style={[
                        styles.typeButton,
                        {
                          backgroundColor: advancedRecurrencePattern.specialDateType === item.type ? '#e3f2fd' : '#f5f5f5',
                          borderColor: advancedRecurrencePattern.specialDateType === item.type ? '#2196F3' : '#dddddd'
                        }
                      ]}
                      onPress={() => {
                        onAdvancedRecurrencePatternChange({
                          ...advancedRecurrencePattern,
                          specialDateType: item.type as 'weekend' | 'workday' | 'holiday' | 'solarTerm'
                        });
                      }}
                    >
                      <Text style={{
                        fontSize: 14,
                        fontWeight: advancedRecurrencePattern.specialDateType === item.type ? 'bold' : 'normal',
                        color: advancedRecurrencePattern.specialDateType === item.type ? '#2196F3' : '#333333'
                      }}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                {/* 特殊日期频率设置 */}
                <View style={[styles.inputRow, { marginTop: 16 }]}>
                  <Text style={styles.inputText}>每</Text>
                  <TextInput
                    style={styles.numberInput}
                    value={String(advancedRecurrencePattern.selectedDateType === 'day' ? advancedRecurrencePattern.dayValue : 
                                 advancedRecurrencePattern.selectedDateType === 'week' ? advancedRecurrencePattern.weekValue :
                                 advancedRecurrencePattern.selectedDateType === 'month' ? advancedRecurrencePattern.monthValue :
                                 advancedRecurrencePattern.yearValue)}
                    onChangeText={(text) => {
                      const value = parseInt(text);
                      if (!isNaN(value) && value > 0) {
                        const updatedPattern = { ...advancedRecurrencePattern };
                        switch (advancedRecurrencePattern.selectedDateType) {
                          case 'day':
                            updatedPattern.dayValue = value;
                            break;
                          case 'week':
                            updatedPattern.weekValue = value;
                            break;
                          case 'month':
                            updatedPattern.monthValue = value;
                            break;
                          case 'year':
                            updatedPattern.yearValue = value;
                            break;
                        }
                        onAdvancedRecurrencePatternChange(updatedPattern);
                      }
                    }}
                    keyboardType="numeric"
                  />
                  <Text style={styles.inputText}>个</Text>
                  <Text style={styles.inputText}>
                    {advancedRecurrencePattern.specialDateType === 'weekend' ? '周末' : 
                     advancedRecurrencePattern.specialDateType === 'workday' ? '工作日' : 
                     advancedRecurrencePattern.specialDateType === 'holiday' ? '节假日' : '节气日'}
                  </Text>
                </View>
              </View>
              
              {/* 当前特殊日期设置预览 */}
              <View style={styles.previewBox}>
                <Text style={styles.previewTitle}>当前设置</Text>
                <Text style={styles.previewText}>{getAdvancedRecurrenceDescription()}</Text>
              </View>
            </>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000000'
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    color: '#000000'
  },
  toggleButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  buttonIcon: {
    marginRight: 6
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  inputSection: {
    marginBottom: 16
  },
  settingCard: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eeeeee',
  },
  settingTitle: {
    fontSize: 14,
    marginBottom: 10,
    color: '#666666',
    fontWeight: '500'
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666666'
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  inputText: {
    fontSize: 14,
    marginRight: 8
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#dddddd',
    borderRadius: 8,
    padding: 8,
    width: 60,
    textAlign: 'center',
    backgroundColor: '#ffffff',
    fontSize: 14,
    marginRight: 8
  },
  weekDaySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8
  },
  weekDayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    margin: 4
  },
  directionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  previewBox: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 8
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2196F3',
    marginBottom: 4
  },
  previewText: {
    fontSize: 14
  }
}); 