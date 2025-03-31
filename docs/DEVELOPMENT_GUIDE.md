# NeverMiss开发指南

本文档提供了NeverMiss项目的开发环境搭建、项目运行和调试方法，帮助开发者快速上手项目开发。

## 环境要求

在开始开发前，请确保您的环境满足以下要求：

- Node.js (v14+)
- npm (v9+) 或 yarn (v1.22+)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Git](https://git-scm.com/)
- Android Studio (Android开发)
- Xcode (iOS开发，仅macOS)
- 一个支持JavaScript/TypeScript的代码编辑器，推荐使用Visual Studio Code

## 环境搭建

### 基础环境

1. 安装Node.js和npm：
   - 访问[Node.js官网](https://nodejs.org/)下载并安装最新的LTS版本

2. 安装Expo CLI：
   ```bash
   npm install -g expo-cli
   ```

3. 安装Git：
   - 访问[Git官网](https://git-scm.com/)下载并安装

### Android开发环境

1. 安装Android Studio：
   - 访问[Android Studio官网](https://developer.android.com/studio)下载并安装

2. 创建Android模拟器：
   - 打开Android Studio
   - 点击"Tools"→"Device Manager"→"Create Device"
   - 选择设备类型和系统镜像，推荐使用API 31或更高版本
   - 完成创建并启动模拟器

### iOS开发环境（仅macOS）

1. 安装Xcode：
   - 在App Store中搜索并安装Xcode

2. 安装Cocoapods：
   ```bash
   sudo gem install cocoapods
   ```

3. 安装Xcode命令行工具：
   ```bash
   xcode-select --install
   ```

## 获取项目代码

```bash
# 克隆仓库
git clone https://github.com/zfonlyone/NeverMiss.git
cd NeverMiss

# 安装项目依赖
npm install
```

## 运行项目

### 使用Expo Go

Expo Go是一个客户端应用，可以在您的设备上直接运行Expo项目，无需构建原生代码。

1. 在您的设备上安装Expo Go应用：
   - [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)

2. 启动开发服务器：
   ```bash
   npm start
   # 或
   expo start
   ```

3. 连接到Expo Go：
   - 使用设备上的Expo Go应用扫描终端中显示的QR码
   - 或在模拟器中运行：按`a`启动Android模拟器，按`i`启动iOS模拟器

### 使用原生构建

如果您需要使用原生模块或测试与设备硬件的交互，您需要构建原生应用：

1. 构建并运行Android应用：
   ```bash
   npx expo run:android
   ```

2. 构建并运行iOS应用（仅macOS）：
   ```bash
   npx expo run:ios
   ```

## 调试技巧

### 浏览器调试

1. 启动应用后，按`d`打开开发者菜单
2. 选择"Debug JS Remotely"
3. 将在浏览器中打开一个新标签，按F12打开开发者工具
4. 在Console和Sources标签中调试JavaScript代码

### 使用React Native Debugger

[React Native Debugger](https://github.com/jhen0409/react-native-debugger)是一个强大的调试工具，提供了更多功能：

1. 下载并安装React Native Debugger
2. 运行React Native Debugger
3. 在应用中启用远程调试
4. 使用React Native Debugger提供的增强功能，如Redux DevTools集成和网络请求检查

### 日志和控制台输出

- 使用`console.log()`、`console.warn()`和`console.error()`在代码中输出调试信息
- 日志将显示在终端和远程调试器的控制台中

### 性能调试

1. 使用Expo Dev Tools的Performance Monitor观察应用性能
2. 启用Performance Monitor：在开发者菜单中选择"Show Performance Monitor"
3. 关注关键指标如帧率、内存使用和耗时的JavaScript操作

## 项目配置

### Expo配置

主要配置文件为`app.json`和`app.config.js`，用于配置应用的基本信息、权限和原生功能：

```json
{
  "expo": {
    "name": "NeverMiss",
    "slug": "nevermiss",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "updates": {
      "fallbackToCacheTimeout": 0
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.zfonlyone.nevermiss"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.zfonlyone.nevermiss"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      // 配置的插件
    ]
  }
}
```

### TypeScript配置

TypeScript配置位于`tsconfig.json`文件中：

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

## 常见任务

### 添加新页面

1. 在`app/screens`目录下创建新页面组件，使用PascalCase命名，如`MyNewScreen.tsx`：
   ```tsx
   import React from 'react';
   import { View, Text, StyleSheet } from 'react-native';
   
   export default function MyNewScreen() {
     return (
       <View style={styles.container}>
         <Text>My New Screen</Text>
       </View>
     );
   }
   
   const styles = StyleSheet.create({
     container: {
       flex: 1,
       justifyContent: 'center',
       alignItems: 'center',
     },
   });
   ```

2. 根据文件系统路由，在Expo Router中配置页面路径：
   - 将文件放置在`app/`目录的适当位置，如`app/myNewScreen.tsx`
   - 或在`app/screens/myNewScreen.tsx`并使用导航

### 添加新组件

1. 在`app/components`目录下创建新组件，使用PascalCase命名，如`MyComponent.tsx`：
   ```tsx
   import React from 'react';
   import { View, Text, StyleSheet } from 'react-native';
   
   interface MyComponentProps {
     title: string;
   }
   
   export default function MyComponent({ title }: MyComponentProps) {
     return (
       <View style={styles.container}>
         <Text>{title}</Text>
       </View>
     );
   }
   
   const styles = StyleSheet.create({
     container: {
       padding: 16,
       backgroundColor: '#f5f5f5',
       borderRadius: 8,
     },
   });
   ```

2. 在需要的地方导入并使用组件：
   ```tsx
   import MyComponent from '../components/MyComponent';
   
   // 在组件内部
   <MyComponent title="Hello World" />
   ```

### 添加新服务

1. 在`app/services`目录下创建新服务，使用camelCase命名，如`myService.ts`：
   ```typescript
   /**
    * 我的服务
    * 处理特定功能的逻辑
    */
   
   /**
    * 执行某个操作
    * @param param1 参数1
    * @param param2 参数2
    * @returns 操作结果
    */
   export function doSomething(param1: string, param2: number): boolean {
     // 实现逻辑
     return true;
   }
   
   /**
    * 异步获取数据
    * @param id 数据ID
    * @returns Promise包含数据对象
    */
   export async function fetchData(id: string): Promise<any> {
     try {
       // 异步操作
       return { id, data: 'some data' };
     } catch (error) {
       console.error('获取数据失败:', error);
       throw error;
     }
   }
   ```

2. 在需要的地方导入并使用服务：
   ```typescript
   import * as MyService from '../services/myService';
   
   // 使用服务
   const result = MyService.doSomething('test', 123);
   const data = await MyService.fetchData('abc123');
   ```

## 构建和发布

### 使用EAS构建

Expo应用服务(EAS)提供了强大的构建和发布功能：

1. 配置EAS：
   ```bash
   npm install -g eas-cli
   eas login
   eas build:configure
   ```

2. 构建预览版：
   ```bash
   # Android
   eas build --platform android --profile preview
   
   # iOS
   eas build --platform ios --profile preview
   ```

3. 构建生产版：
   ```bash
   # Android
   eas build --platform android --profile production
   
   # iOS
   eas build --platform ios --profile production
   ```

### 本地构建

如果您需要在本地构建应用：

1. Android APK：
   ```bash
   npx eas build --platform android --profile preview --local
   ```

2. iOS（需要Xcode）：
   ```bash
   npx eas build --platform ios --profile preview --local
   ```

## 常见问题

### 启动开发服务器失败

问题：执行`npm start`或`expo start`时失败
解决方法：
- 确认所有依赖已正确安装：`npm install`
- 清除Metro缓存：`npx expo start -c`
- 检查端口是否被占用，尝试指定不同端口：`npx expo start --port 19001`

### 无法连接到开发服务器

问题：设备无法连接到开发服务器
解决方法：
- 确保设备和电脑在同一网络
- 尝试使用隧道连接：`npx expo start --tunnel`
- 检查防火墙设置，确保相关端口已开放

### 模块解析错误

问题：出现"Unable to resolve module..."错误
解决方法：
- 重启开发服务器并清除缓存：`npx expo start -c`
- 检查导入路径是否正确
- 确认依赖已正确安装

### Android构建失败

问题：Android构建过程失败
解决方法：
- 检查`app.json`中的`android.package`是否有效
- 确认SDK和构建工具版本兼容
- 查看详细的构建日志，解决特定错误

### iOS构建失败

问题：iOS构建过程失败
解决方法：
- 确保有有效的Apple开发者账号
- 检查证书和配置文件设置
- 更新Xcode和CocoaPods到最新版本

## 更多资源

- [Expo文档](https://docs.expo.dev/)
- [React Native文档](https://reactnative.dev/docs/getting-started)
- [TypeScript文档](https://www.typescriptlang.org/docs/)
- [项目架构说明](ARCHITECTURE.md)
- [代码开发规范](CODE_STANDARDS.md)

## 获取帮助

如果您遇到问题或需要帮助，可以：

- 查阅[常见问题解决方案](常见问题解决方案.md)
- 在GitHub Issues中提问
- 联系项目维护者 