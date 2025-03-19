# NeverMiss

<div align="center">

[![React Native](https://img.shields.io/badge/React%20Native-0.76.0-blue.svg?style=flat-square&logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2052-black.svg?style=flat-square&logo=expo)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.1.3-blue.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

</div>

<p align="center">
  <img src="assets/icon.png" alt="NeverMiss Logo" width="120" height="120">
</p>

<p align="center">
  永不错过重要任务的智能提醒应用
</p>

## ✨ 功能特点

- 🔄 **灵活的循环任务** - 每日、每周、每月或自定义间隔
- 🔔 **智能提醒系统** - 自定义提醒时间，后台监控
- 🌙 **深色模式支持** - 简洁优雅的用户界面
- 📱 **离线优先架构** - 基于 AsyncStorage 的本地数据存储

## 📱 截图

<div align="center">
  <img src="assets/screenshots/main.png" alt="主页" width="200">
  <img src="assets/screenshots/task.png" alt="任务详情" width="200">
  <img src="assets/screenshots/form.png" alt="创建任务" width="200">
  <img src="assets/screenshots/setting.png" alt="设置界面" width="200">
</div>

## 🚀 快速开始

### 环境要求

- Node.js (v18+)
- npm (v9+) 或 yarn (v1.22+)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/zfonlyone/NeverMiss.git
cd NeverMiss

# 安装依赖
npm install

# 启动开发服务器
npm start
```

详细的安装和构建指南:
- [安装与构建指南](安装指南.md)

## 🛠️ 技术栈

- [React Native](https://reactnative.dev/) - 移动应用框架
- [Expo](https://expo.dev/) - 开发平台
- [TypeScript](https://www.typescriptlang.org/) - 类型安全
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) - 本地数据存储
- [Expo Router](https://docs.expo.dev/router/introduction/) - 文件路由系统

## 📂 项目结构

```
nevermiss/
├── app/                # 应用路由和导航
├── components/         # 可复用 React 组件
├── models/             # TypeScript 类型定义
├── services/           # 业务逻辑和数据服务
└── assets/             # 静态资源
```

## 🔧 常见问题

遇到问题? 查看我们的[常见问题解决方案](安装指南.md#常见问题解决方案)。

## 🤝 贡献指南

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m '添加新功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件。

## 👏 致谢

- [Expo](https://expo.dev/) - 提供了出色的开发平台
- [React Native](https://reactnative.dev/) - 提供了移动框架
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) - 提供了可靠的数据存储解决方案
