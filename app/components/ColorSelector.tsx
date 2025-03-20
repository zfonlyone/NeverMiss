import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';

// 预定义的背景颜色
const BACKGROUND_COLORS = [
  '#FFFFFF', // 白色 (默认)
  '#F5F5F5', // 浅灰色
  '#FFF9C4', // 浅黄色
  '#E3F2FD', // 浅蓝色
  '#E8F5E9', // 浅绿色
  '#FFF3E0', // 浅橙色
  '#F3E5F5', // 浅紫色
  '#FFEBEE', // 浅红色
  '#ECEFF1', // 浅青色
];

interface ColorSelectorProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

export default function ColorSelector({ selectedColor, onColorChange }: ColorSelectorProps) {
  const { t } = useLanguage();
  const { colors, isDarkMode } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{t.task.backgroundColor}</Text>
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.colorList}
      >
        {BACKGROUND_COLORS.map((color, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.colorButton,
              { backgroundColor: color },
              selectedColor === color && [styles.colorButtonSelected, { borderColor: colors.primary }]
            ]}
            onPress={() => onColorChange(color)}
          >
            {selectedColor === color && (
              <View style={[styles.colorButtonCheck, { backgroundColor: colors.primary }]} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  colorList: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorButtonSelected: {
    borderWidth: 2,
  },
  colorButtonCheck: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
}); 