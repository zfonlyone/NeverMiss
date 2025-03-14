# NeverMiss

NeverMiss 是一个基于 Expo 的任务提醒应用，帮助用户管理和跟踪重复性任务。

## 功能特点

- 创建和管理任务
- 灵活的重复选项（每日、每周、每月、自定义）
- 智能提醒系统
- 任务状态追踪
- 后台任务检查
- 数据导入导出

## 开发环境要求

- Node.js 18.0 或更高版本
- npm 9.0 或更高版本
- Expo CLI
- Android Studio (用于 Android 开发)
- Xcode (用于 iOS 开发，仅 macOS)

## 安装

1. 克隆仓库：
```bash
git clone https://github.com/yourusername/NeverMiss.git
cd NeverMiss
```

2. 安装依赖：
```bash
npm install
```

## 开发命令

- 启动开发服务器：
```bash
npx expo start
```

- 清除缓存并启动：
```bash
npx expo start --clear
```

- 重置项目（开发用）：
```bash
npm run reset-project
```

- 运行 Android：
```bash
npm run android
```

- 运行 iOS：
```bash
npm run ios
```

- 运行 Web 版本：
```bash
npm run web
```

- 运行测试：
```bash
npm test
```

- 运行代码检查：
```bash
npm run lint
```

## 项目结构

```
NeverMiss/
├── app/                    # 应用页面
│   ├── (tabs)/            # 标签页面
│   └── _layout.tsx        # 路由布局
├── components/            # React 组件
├── services/             # 业务服务
├── models/               # 数据模型
├── hooks/               # React Hooks
├── constants/           # 常量定义
└── scripts/            # 脚本工具
```

## 数据库结构

### tasks 表
- id: INTEGER PRIMARY KEY
- title: TEXT
- description: TEXT
- start_date_time: TEXT
- recurrence_type: TEXT
- recurrence_value: INTEGER
- recurrence_unit: TEXT
- reminder_offset: INTEGER
- is_active: INTEGER
- auto_restart: INTEGER
- created_at: TEXT
- updated_at: TEXT

### task_cycles 表
- id: INTEGER PRIMARY KEY
- task_id: INTEGER
- start_date: TEXT
- due_date: TEXT
- is_completed: INTEGER
- is_overdue: INTEGER
- completed_date: TEXT
- created_at: TEXT

## 故障排除

1. 如果遇到数据库错误，尝试重置数据库：
```bash
npm run reset-project
```

2. 如果遇到依赖问题，尝试清理并重新安装：
```bash
rm -rf node_modules
npm install
```

3. 如果 Metro 服务器出现问题，尝试清除缓存：
```bash
npx expo start --clear
```

4. 如果遇到 SQLite 相关错误，尝试重新安装：
```bash
npm uninstall expo-sqlite
npm install expo-sqlite@15.1.2
```

## 贡献

欢迎提交 Pull Request 和 Issue。

## 许可证

MIT License 
