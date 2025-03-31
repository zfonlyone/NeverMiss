# NeverMiss项目结构

本文档详细介绍了NeverMiss项目的文件和目录结构，帮助开发者快速了解项目组织方式。

## 项目结构概览

```
NeverMiss/
├── app/                      # 应用程序主要代码
│   ├── components/           # 可复用的UI组件
│   ├── context/              # React Context相关文件
│   ├── contexts/             # 应用程序上下文管理
│   ├── controllers/          # 业务控制器
│   ├── hooks/                # 自定义React Hooks
│   ├── locales/              # 国际化相关文件
│   ├── models/               # 数据模型定义
│   ├── navigation/           # 导航相关组件
│   ├── screens/              # 应用程序屏幕/页面
│   ├── services/             # 服务层实现
│   └── utils/                # 工具函数和辅助方法
├── assets/                   # 静态资源文件
├── docs/                     # 项目文档
├── android/                  # Android平台特定代码
├── ios/                      # iOS平台特定代码
├── .expo/                    # Expo配置文件
└── .github/                  # GitHub相关配置
```

## 核心目录详解

### app/

应用程序的主要代码目录，包含所有业务逻辑和UI组件。

#### app/components/

包含可复用的UI组件，这些组件应该是无状态的，或者状态仅限于组件内部。

```
components/
├── TaskList.tsx             # 任务列表组件
├── TaskListFilter.tsx       # 任务列表筛选组件
├── FloatingActionButton.tsx # 浮动操作按钮组件
└── ...
```

#### app/models/

包含数据模型定义，定义应用程序中使用的数据结构和类型。

```
models/
├── Task.ts                  # 任务数据模型
├── TaskCycle.ts             # 任务周期模型
├── TaskHistory.ts           # 任务历史记录模型
└── _layout.tsx              # 布局组件
```

#### app/screens/

包含应用程序的主要页面，每个页面应该对应一个功能模块。

```
screens/
├── TaskListScreen.tsx       # 任务列表页面
├── TaskFormScreen.tsx       # 任务创建/编辑页面
├── SettingsScreen.tsx       # 设置页面
├── StatisticsScreen.tsx     # 统计分析页面
└── _layout.tsx              # 布局组件
```

#### app/services/

包含与外部系统交互的服务层实现，如数据存储、API调用等。

```
services/
├── taskService.ts           # 任务服务实现
├── storageService.ts        # 本地存储服务
├── cycleCalculator.ts       # 周期计算服务
├── lunarService.ts          # 农历服务
├── notificationService.ts   # 通知服务
├── calendarService.ts       # 日历服务
├── backgroundTaskService.ts # 后台任务服务
└── ...
```

#### app/contexts/

包含React Context相关文件，用于全局状态管理。

```
contexts/
├── LanguageContext.tsx      # 语言上下文
├── ThemeContext.tsx         # 主题上下文
└── ...
```

#### app/utils/

包含工具函数和辅助方法，可以被项目中的任何部分使用。

```
utils/
├── taskUtils.ts             # 任务相关工具函数
├── dateUtils.ts             # 日期处理工具函数
├── storage.ts               # 存储工具函数和存储键常量
└── ...
```

**特别说明：**
- `storage.ts`包含所有AsyncStorage相关的工具函数和存储键常量
- 所有存储键常量必须定义在`storage.ts`中的`STORAGE_KEYS`对象中
- 不应在项目的其他地方定义存储键常量，而是统一从`storage.ts`导入使用

## 根目录文件

- `App.tsx`: 应用程序入口文件，设置全局提供者和导航
- `app.json`: Expo应用配置文件
- `babel.config.js`: Babel配置文件
- `tsconfig.json`: TypeScript配置文件
- `package.json`: 项目依赖和脚本配置
- `eas.json`: EAS构建配置文件
- `metro.config.js`: Metro bundler配置文件

## 文件命名规范

- 组件文件使用大驼峰命名法，如 `TaskList.tsx`
- 非组件文件使用小驼峰命名法，如 `taskService.ts`
- 文件名应反映其内容和用途
- 测试文件应以 `.test.ts(x)` 或 `.spec.ts(x)` 结尾

## 文件位置规范

- 所有React组件应放在 `app/components` 目录下
- 页面组件应放在 `app/screens` 目录下
- 服务类应放在 `app/services` 目录下
- 数据模型应放在 `app/models` 目录下
- 工具函数应放在 `app/utils` 目录下
- 上下文提供者应放在 `app/contexts` 目录下

遵循此结构规范，可以确保代码的一致性和可维护性，使新加入的开发者能够快速理解项目结构。 