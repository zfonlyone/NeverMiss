# NeverMiss 项目结构说明

## 项目概述

NeverMiss 是一款任务管理应用，旨在帮助用户追踪和完成重要的任务和日程，支持农历和公历日期设置，以及多种提醒方式。

## 目录结构

```
/
├── .expo/                # Expo配置文件和缓存
├── .github/              # GitHub工作流和配置文件
├── .gitignore            # Git忽略文件配置
├── android/              # Android原生项目文件
├── ios/                  # iOS原生项目文件
├── app/                  # Expo Router应用入口
│   ├── _layout.tsx       # 应用布局定义
│   ├── index.tsx         # 主页面定义
│   ├── settings.tsx      # 设置路由
│   ├── tasks.tsx         # 任务列表路由
│   ├── task-form.tsx     # 任务表单路由
│   ├── statistics.tsx    # 统计分析路由
│   ├── components/       # 应用专用组件
│   ├── navigation/       # 导航配置
│   └── screens/          # 应用屏幕组件
├── assets/               # 静态资源（图片、字体等）
│   ├── icon.png          # 应用图标
│   ├── splash.png        # 启动屏幕
│   └── screenshots/      # 应用截图
├── components/           # 共享UI组件
│   ├── TaskList.tsx      # 任务列表组件
│   ├── TaskDetail.tsx    # 任务详情组件
│   └── ...               # 其他共享组件
├── config/               # 应用配置
├── constants/            # 常量定义
├── contexts/             # React Context定义
│   ├── LanguageContext.tsx  # 语言/国际化上下文
│   ├── ThemeContext.tsx     # 主题上下文
│   └── ...               # 其他上下文
├── controllers/          # 控制器层（MVC架构）
│   ├── TaskController.ts   # 任务管理控制器
│   ├── TagController.ts    # 标签管理控制器
│   ├── CalendarController.ts # 日历控制器
│   ├── NotificationController.ts # 通知控制器
│   └── index.ts          # 控制器统一导出
├── docs/                 # 项目文档
│   ├── ARCHITECTURE.md   # 架构说明文档
│   ├── CONTRIBUTING.md   # 贡献指南
│   ├── DEVELOPMENT_GUIDE.md # 开发指南
│   └── PROJECT_STRUCTURE.md # 项目结构说明
├── hooks/                # 自定义React Hooks
├── locales/              # 国际化资源
│   ├── en.ts             # 英文翻译
│   └── zh.ts             # 中文翻译
├── migrations/           # 数据库迁移脚本
├── models/               # 数据模型
│   ├── Task.ts           # 任务模型
│   ├── TaskCycle.ts      # 任务周期模型
│   └── ...               # 其他模型
├── navigation/           # 导航配置
├── scripts/              # 构建和部署脚本
├── screens/              # 应用屏幕
│   ├── HomeScreen.tsx    # 主页屏幕
│   ├── SettingsScreen.tsx # 设置屏幕
│   └── ...               # 其他屏幕
├── services/             # 服务层
│   ├── taskService.ts    # 任务数据服务
│   ├── notificationService.ts  # 通知服务
│   ├── calendarService.ts # 日历服务
│   ├── exportService.ts  # 数据导入导出服务
│   ├── preferenceService.ts # 用户偏好设置服务
│   ├── permissionService.ts # 权限管理服务
│   ├── backgroundTaskService.ts # 后台任务服务
│   ├── storageService.ts  # 本地存储服务
│   └── ...               # 其他服务
├── utils/                # 工具函数
│   ├── dateUtils.ts      # 日期处理工具
│   ├── lunarUtils.ts     # 农历处理工具
│   └── ...               # 其他工具函数
├── App.tsx               # 应用入口组件
├── app.json              # Expo应用配置
├── babel.config.js       # Babel配置
├── eas.json              # EAS构建配置
├── index.js              # 应用入口点
├── LICENSE               # 许可证文件
├── metro.config.js       # Metro打包配置
├── package.json          # 依赖管理 
├── package-lock.json     # 依赖锁定文件
├── tsconfig.json         # TypeScript配置
└── README.md             # 项目说明文档
```

## 核心目录说明

### app/

Expo Router应用的入口点，遵循基于文件系统的路由结构。每个文件代表一个路由，`_layout.tsx`定义了应用的主布局和导航结构。

### components/

包含所有可复用的UI组件，遵循组件化设计原则，每个组件应专注于单一功能。

### controllers/

采用MVC架构的控制器层，处理业务逻辑，将视图层和服务层连接起来。控制器负责数据转换、状态管理和逻辑处理。

### services/

服务层负责与外部系统交互，如本地存储、网络请求、通知系统等。服务层提供了一个抽象接口，使控制器层不需要直接处理底层实现细节。

### models/

定义了应用中使用的数据模型和类型，采用TypeScript接口确保类型安全。

## 架构说明

本项目采用修改版的MVC架构：

1. **模型层 (Models)**：`models/` 目录包含所有数据模型和类型定义，描述应用中的实体结构。

2. **视图层 (Views)**：`components/`、`screens/` 和 `app/` 目录包含所有UI组件和页面，负责数据的展示和用户交互。

3. **控制器层 (Controllers)**：`controllers/` 目录中的控制器负责处理业务逻辑，连接视图层和服务层。

4. **服务层 (Services)**：`services/` 目录包含与外部系统交互的服务，如数据存储、通知和API调用。

## 技术栈

- **Framework**: React Native + Expo
- **Navigation**: Expo Router
- **Styling**: StyleSheet
- **State Management**: React Context API
- **Internationalization**: Custom i18n solution
- **Storage**: AsyncStorage

## 开发规范

1. **文件命名**：
   - 组件文件使用 PascalCase (如 `TaskList.tsx`)
   - 非组件文件使用 camelCase (如 `dateUtils.ts`)
   - 每个文件只导出一个主要组件/函数

2. **导入顺序**：
   - 外部库
   - 内部模型/控制器
   - 内部组件/hooks
   - 样式/资源

3. **代码组织**：
   - 共享逻辑放在 controllers 和 utils 中
   - UI相关逻辑放在组件内部
   - Context用于全局状态管理

4. **路径导入**：
   - 使用相对路径 (例如: `../components/TaskList`)
   - 避免过深的路径嵌套 (不超过2级 `../../`)

5. **废弃代码处理**：
   - 不再使用的组件或屏幕放入 `*_deprecated` 目录
   - 定期清理废弃代码

## 重要概念

1. **Task (任务)**：核心数据结构，包含标题、描述、日期等基本信息。

2. **TaskCycle (任务周期)**：任务的单个实例，包含开始日期、结束日期和完成状态。

3. **ExtendedTask**：增强版任务，包含当前周期和其他计算属性。

4. **Controllers**：处理业务逻辑，如任务创建、删除和状态更新。
   - **TaskController**: 处理任务的创建、更新、删除和查询
   - **TagController**: 处理任务标签管理
   - **CalendarController**: 处理任务与日历的集成
   - **NotificationController**: 处理任务提醒和通知

5. **Services**：处理外部系统和数据交互：
   - **taskService**: 管理任务数据的存储和检索
   - **notificationService**: 处理系统通知的创建和管理
   - **calendarService**: 与设备日历的集成
   - **storageService**: 管理本地数据存储 