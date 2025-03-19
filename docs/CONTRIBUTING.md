"# 如何参与NeverMiss项目开发" 

感谢您的关注并考虑为NeverMiss项目做出贡献！以下是参与本项目开发的指南。

## 开发环境设置

1. 克隆仓库：
```bash
git clone https://github.com/your-username/NeverMiss.git
cd NeverMiss
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm start
# 或
expo start
```

## 代码风格与规范

1. **文件命名规范**
   - React组件文件使用PascalCase命名（例如：`TaskList.tsx`）
   - 非组件文件使用camelCase命名（例如：`dateUtils.ts`）
   - 文件夹名称使用小写加下划线（例如：`components_deprecated`）

2. **代码格式**
   - 使用2个空格作为缩进
   - 使用分号作为语句结束符
   - 使用单引号作为字符串引号

3. **导入顺序**
   - 外部库导入
   - 内部模型/控制器导入
   - 内部组件/hooks导入
   - 样式/资源导入

示例：
```typescript
// 外部库
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';

// 内部模型/控制器
import { TaskController } from '../controllers';
import { Task } from '../models/Task';

// 内部组件/hooks
import TaskItem from './TaskItem';
import { useTheme } from '../hooks/useTheme';

// 样式/资源
import styles from './styles';
import { colors } from '../theme';
```

## 开发流程

1. **创建分支**
   
   从master创建新的功能分支：
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **提交规范**
   
   提交信息应简洁明了，包含改动的要点，格式如下：
   ```
   类型: 简短描述

   详细描述（可选）
   ```
   
   类型可以是：
   - feat: 新功能
   - fix: 修复bug
   - docs: 文档更新
   - style: 代码风格调整，不影响功能
   - refactor: 代码重构，不新增功能或修复bug
   - test: 添加测试
   - chore: 构建过程或辅助工具的变动

3. **创建Pull Request**
   
   完成开发后，提交PR到主仓库的master分支。PR标题应包含功能概述，内容应详细描述改动内容和测试结果。

## 架构指南

开发时请遵循以下架构原则：

1. **MVC分层架构**
   - 数据模型放在`models/`目录
   - 视图组件放在`components/`和`screens/`目录
   - 业务逻辑放在`controllers/`目录
   - 外部服务交互放在`services/`目录

2. **组件设计原则**
   - 组件应尽量保持纯展示性质，业务逻辑放在controllers中
   - 使用hooks抽取复用逻辑
   - 大型组件拆分为小组件

3. **状态管理**
   - 局部状态使用`useState`
   - 共享状态使用Context API
   - 避免过深的组件嵌套和prop drilling


## 文档

- 代码应有适当的注释，特别是复杂的业务逻辑
- 更新README.md反映您的更改
- 如果添加了新功能，请更新相关文档

## 问题反馈

如发现bug或有功能建议，请在Issues中提交，并尽可能提供详细信息和复现步骤。

感谢您的贡献！ 
