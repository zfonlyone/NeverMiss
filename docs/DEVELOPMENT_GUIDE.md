# NeverMiss 开发指南

本文档提供了NeverMiss项目的详细开发指南，包括环境设置、代码组织、最佳实践和常见任务的操作步骤。

## 目录

1. [开发环境设置](#1-开发环境设置)
2. [项目结构](#2-项目结构)
3. [开发工作流](#3-开发工作流)
4. [编码规范](#4-编码规范)
5. [常见开发任务](#5-常见开发任务)
6. [测试](#6-测试)
7. [构建和发布](#7-构建和发布)
8. [常见问题解答](#8-常见问题解答)

## 1. 开发环境设置

### 1.1 必备软件

- Node.js (v14+)
- npm或Yarn
- Git
- Android Studio (Android开发)
- Xcode (iOS开发，仅macOS)
- VS Code或其他编辑器

### 1.2 环境变量配置

在项目根目录创建`.env`文件（已在.gitignore中忽略）：

```
API_URL=http://your-api-url.com
DEBUG_MODE=true
```

### 1.3 项目设置

1. 克隆仓库并安装依赖：

```bash
git clone https://github.com/your-username/NeverMiss.git
cd NeverMiss
npm install
```

2. 启动开发服务器：

```bash
npm start
# 或
expo start
```

3. 在模拟器或设备上运行：

```bash
# Android
npm run android

# iOS
npm run ios
```

## 2. 项目结构

详细的项目结构请参见[PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md)文件。

## 3. 开发工作流

### 3.1 分支管理

- `master`分支保存stable版本
- 新功能在`feature/*`分支开发
- 错误修复在`bugfix/*`分支进行
- 发布准备在`release/*`分支上完成

### 3.2 开发流程

1. 从master创建新分支：
   ```bash
   git checkout master
   git pull
   git checkout -b feature/your-feature-name
   ```

2. 提交代码：
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feature/your-feature-name
   ```

3. 创建Pull Request，等待代码审查

4. 合并到master分支

### 3.3 代码审查流程

- 使用Pull Request进行代码审查
- 至少一名团队成员必须审查并批准
- 所有自动化测试必须通过
- 解决所有代码风格和可能的问题

## 4. 编码规范

### 4.1 JavaScript/TypeScript规范

- 使用TypeScript强类型
- 遵循ESLint配置规则
- 避免使用`any`类型
- 使用async/await替代Promise链
- 每个函数添加适当注释

### 4.2 React Native规范

- 使用函数组件和hooks
- 遵循单一职责原则
- 使用PropTypes或TypeScript类型定义props
- 避免内联样式，使用StyleSheet
- 使用memo优化渲染性能

### 4.3 样式规范

- 使用StyleSheet创建样式
- 遵循主题设置，避免硬编码颜色
- 使用一致的尺寸和间距
- 支持深色模式和RTL语言

## 5. 常见开发任务

### 5.1 添加新组件

1. 在`src/components`创建新文件，使用PascalCase命名

```tsx
// src/components/CustomButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  color?: string;
}

const CustomButton: React.FC<CustomButtonProps> = ({ title, onPress, color = '#007AFF' }) => {
  return (
    <TouchableOpacity 
      style={[styles.button, { backgroundColor: color }]} 
      onPress={onPress}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default CustomButton;
```

### 5.2 添加新屏幕

1. 在`src/screens`创建新文件
2. 在`src/app`目录中添加路由

```tsx
// src/screens/SettingsScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SettingsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>设置</Text>
      {/* 设置内容 */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

export default SettingsScreen;
```

### 5.3 添加新的API服务

1. 在`src/services`创建或更新服务文件

```ts
// src/services/userService.ts
import axios from 'axios';
import { User } from '../models/User';

const API_URL = process.env.API_URL || 'https://api.example.com';

export const getUser = async (userId: string): Promise<User> => {
  try {
    const response = await axios.get(`${API_URL}/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

export const updateUser = async (userId: string, userData: Partial<User>): Promise<User> => {
  try {
    const response = await axios.put(`${API_URL}/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};
```

### 5.4 添加新的控制器方法

1. 在`src/controllers`创建或更新控制器文件

```ts
// src/controllers/UserController.ts
import * as userService from '../services/userService';
import { User } from '../models/User';

export const getUserProfile = async (userId: string): Promise<User> => {
  try {
    const user = await userService.getUser(userId);
    return user;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<User> => {
  try {
    // 业务逻辑处理
    const validatedUpdates = validateUpdates(updates);
    // 调用服务
    const updatedUser = await userService.updateUser(userId, validatedUpdates);
    return updatedUser;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    throw error;
  }
};

// 辅助函数
const validateUpdates = (updates: Partial<User>): Partial<User> => {
  // 输入验证逻辑
  return updates;
};
```
## 6. 测试
了避免在未来开发中创建测试相关的页面和功能，建议遵循以下原则：
采用测试驱动开发（TDD）方法，将测试代码放在专门的测试目录中，而不是混合在主代码中
使用Jest等测试框架进行单元测试和集成测试
在开发新组件时，直接关注生产功能，避免创建临时测试页面
如果需要测试，可以利用专门的测试环境或开发者模式标志，而不是创建独立的测试页面

## 7. 构建和发布

### 7.1 Android构建

```bash
# 开发构建
expo build:android -t apk

# 生产构建
expo build:android -t app-bundle
```

### 7.2 iOS构建

```bash
# 开发构建
expo build:ios -t simulator

# 生产构建
expo build:ios -t archive
```

### 7.3 EAS构建

使用Expo Application Services (EAS)：

```bash
# 安装EAS CLI
npm install -g eas-cli

# 配置
eas build:configure

# 构建
eas build --platform all
```

## 8. 常见问题解答

### 8.1 运行时错误

**Q: 遇到"Cannot find module X"错误**

A: 确保已安装所有依赖：
```bash
npm install
```

如果仍有问题，尝试清除缓存：
```bash
npm cache clean --force
expo start -c
```

**Q: Metro bundler卡住**

A: 重启Metro bundler：
```bash
expo start --clear
```

### 8.2 样式问题

**Q: 组件在不同设备上显示不一致**

A: 使用相对尺寸和响应式设计：
```ts
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');
const isSmallDevice = width < 375;

const styles = StyleSheet.create({
  container: {
    padding: isSmallDevice ? 8 : 16,
  },
});
```

### 8.3 性能问题

**Q: 列表滚动卡顿**

A: 对于长列表，使用FlatList并实现性能优化：
```tsx
<FlatList
  data={items}
  renderItem={({ item }) => <ItemComponent item={item} />}
  keyExtractor={item => item.id}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
  getItemLayout={(data, index) => ({
    length: 50, // 每项高度
    offset: 50 * index,
    index,
  })}
/>
```

**Q: 组件重复渲染**

A: 使用React.memo和useCallback：
```tsx
const MemoizedComponent = React.memo(({ onPress, data }) => {
  // 组件实现
});

const ParentComponent = () => {
  const handlePress = useCallback(() => {
    // 处理点击
  }, []);
  
  return <MemoizedComponent onPress={handlePress} data={data} />;
};
``` 