# NeverMiss代码开发规范

本文档规定了NeverMiss项目的代码开发规范，以确保代码质量和一致性。所有贡献者都应遵循这些规范。

## 代码风格

### 通用规范

- 使用TypeScript编写所有代码，充分利用其类型系统
- 使用2个空格缩进（不使用Tab）
- 行尾不留空格
- 文件末尾留一个空行
- 使用单引号（`'`）作为字符串的引号
- 每行最大长度为100个字符
- 使用分号（`;`）结束语句
- 使用ES6+特性，如箭头函数、解构赋值、模板字符串等

### React/React Native规范

- 组件使用函数式组件，不使用类组件
- 使用React Hooks管理状态和副作用
- 组件props使用显式的类型定义
- 组件props应该是只读的，不应该在组件内部修改
- 使用`useCallback`和`useMemo`优化性能
- 避免在渲染中创建新函数或对象
- 使用`StyleSheet.create()`定义样式
- 样式属性按照字母顺序排列

### 示例

```tsx
import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface TaskItemProps {
  id: number;
  title: string;
  isCompleted: boolean;
  onToggle: (id: number) => void;
}

export default function TaskItem({ id, title, isCompleted, onToggle }: TaskItemProps) {
  const { colors } = useTheme();
  
  const handleToggle = useCallback(() => {
    onToggle(id);
  }, [id, onToggle]);
  
  const containerStyle = useMemo(() => [
    styles.container,
    { backgroundColor: isCompleted ? colors.success : colors.card }
  ], [isCompleted, colors]);
  
  return (
    <TouchableOpacity style={containerStyle} onPress={handleToggle}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.status}>{isCompleted ? '已完成' : '进行中'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    marginBottom: 12,
    padding: 16,
  },
  status: {
    fontSize: 14,
    marginTop: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
```

## 命名规范

### 文件命名

- 组件文件使用大驼峰（PascalCase）命名法，如`TaskList.tsx`
- 非组件文件使用小驼峰（camelCase）命名法，如`taskService.ts`
- 测试文件以`.test.ts(x)`或`.spec.ts(x)`结尾，如`taskService.test.ts`
- 常量文件使用小驼峰命名，如`constants.ts`

### 变量和函数命名

- 变量和函数使用小驼峰命名法
- 布尔变量应以`is`、`has`、`should`等前缀开头，如`isLoading`
- 常量使用全大写，用下划线分隔，如`MAX_RETRY_COUNT`
- 私有方法和变量以下划线（`_`）开头，如`_privateMethod`
- 事件处理函数以`handle`开头，如`handleSubmit`
- React组件的事件处理props以`on`开头，如`onSubmit`

### 类型和接口命名

- 类型和接口使用大驼峰命名法
- 接口名不要以`I`开头
- 类型名可以以`T`开头，但不是必须的
- 枚举类型使用单数形式，如`TaskStatus`而不是`TaskStatuses`

## 项目规范

### 导入顺序

导入语句应按照以下顺序排列，并用空行分隔：

1. React和React Native核心库
2. 第三方库
3. 导入的类型
4. 自定义组件
5. 自定义工具函数和服务
6. 样式文件、常量和资源

示例：

```tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

import { Task, TaskStatus } from '../models/Task';

import TaskList from '../components/TaskList';
import EmptyState from '../components/EmptyState';

import { filterTasks } from '../utils/taskUtils';
import * as TaskService from '../services/taskService';
import { STORAGE_KEYS } from '../utils/storage';

import { COLORS, SPACING } from '../constants';
import imageSource from '../assets/images/task.png';
```

### 常量和配置管理

- 所有AsyncStorage存储键常量应定义在`utils/storage.ts`中的`STORAGE_KEYS`对象中
- 不要在其他文件中重新定义存储键
- 通过导入`STORAGE_KEYS`对象使用存储键，而不是使用字符串字面量
- 存储键命名使用全大写，用下划线分隔，如`TASK_HISTORY`
- 相关的存储键应按功能分组，并添加注释说明用途

示例：

```typescript
// utils/storage.ts
export const STORAGE_KEYS = {
  // 任务相关
  TASKS: 'tasks',                 // 所有任务的存储键
  TASK_CYCLES: 'task_cycles',     // 任务循环周期的存储键
  TASK_HISTORY: 'task_history',   // 任务历史记录的存储键
  
  // 用户偏好
  SETTINGS: 'settings',           // 用户设置
  LANGUAGE: 'language',           // 语言设置
  THEME: 'theme',                 // 主题设置
} as const;

// 使用示例 - 在services/storageService.ts中
import { STORAGE_KEYS } from '../utils/storage';

export const getTasks = async () => {
  try {
    const tasksJson = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
    // ...其他代码
  } catch (error) {
    // ...错误处理
  }
};
```

### 目录结构

- 遵循[项目结构文档](PROJECT_STRUCTURE.md)中规定的目录结构
- 相关文件应放在同一目录下
- 组件应放在`components`目录下
- 页面应放在`screens`目录下
- 服务应放在`services`目录下

## 代码质量

### 注释规范

- 使用JSDoc格式注释函数和组件
- 复杂的逻辑应该添加注释解释
- 避免无意义的注释
- 代码应该是自解释的，优先考虑使用有意义的变量和函数名，而不是依赖注释

示例：

```tsx
/**
 * 根据指定条件过滤任务
 * @param tasks 任务列表
 * @param filter 过滤条件
 * @returns 过滤后的任务列表
 */
export function filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
  // 实现过滤逻辑
}
```

### 错误处理

- 使用try-catch块处理可能抛出异常的代码
- 在异常处理中提供有意义的错误信息
- 使用`console.error`记录错误，便于调试
- 适当向用户显示友好的错误消息

```tsx
try {
  const result = await TaskService.createTask(taskData);
  // 处理成功结果
} catch (error) {
  console.error('创建任务失败:', error);
  Alert.alert('错误', '无法创建任务，请稍后重试');
}
```

### 性能优化

- 使用`React.memo`包装纯组件
- 使用`useCallback`记忆事件处理函数
- 使用`useMemo`缓存计算结果
- 使用`FlatList`代替`ScrollView`渲染列表
- 避免在渲染函数中进行昂贵的计算
- 使用`StyleSheet.create`创建样式对象，而不是内联样式

## 最佳实践

1. **状态管理**: 使用React Context或zustand进行全局状态管理
2. **组件拆分**: 保持组件的单一职责，拆分复杂组件
3. **逻辑复用**: 抽取共享逻辑到自定义Hooks
4. **类型安全**: 利用TypeScript的类型系统，避免使用`any`类型
5. **响应式设计**: 使用相对单位而不是固定像素值，确保应用在不同屏幕尺寸上正常显示
6. **无障碍**: 添加适当的`accessibilityLabel`和`accessibilityHint`属性
7. **国际化**: 使用i18n库而不是硬编码文本
8. **测试**: 为关键功能编写单元测试
9. **整洁代码**: 遵循SOLID原则，保持代码整洁和可维护

## 提交规范

- 提交消息应该清晰地描述变更内容
- 使用以下格式：`<类型>: <简短描述>`
- 类型可以是：`feat`、`fix`、`docs`、`style`、`refactor`、`test`、`chore`等
- 描述应该简洁明了，不超过50个字符
- 如需详细说明，可以在提交消息的正文中添加

示例：

```
feat: 添加任务过滤功能

添加了按状态、标签和日期过滤任务的功能，优化了用户体验。
```

遵循这些规范可以提高代码质量和可维护性，使团队合作更加高效。 