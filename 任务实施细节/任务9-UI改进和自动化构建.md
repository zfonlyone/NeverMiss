# 任务9：UI改进和自动化构建

## 需求描述
修改应用图标和启动屏幕，提升用户体验和品牌形象。同时添加GitHub Actions自动化发布和打包流程，提高开发效率和发布质量。

## 技术分析
当前的应用图标和启动屏幕可能不够现代化和吸引力。自动化构建和发布流程缺失，导致发布过程繁琐且容易出错。需要利用GitHub Actions实现CI/CD流程。

## 实施计划

### 1. 设计新的应用图标
- 创建新的应用图标设计，符合现代设计趋势
- 准备不同尺寸的图标文件（Android和iOS各种分辨率）
- 确保图标在不同背景色和环境下的可见性
- 创建自适应图标（Android）和替代图标（iOS）

### 2. 设计新的启动屏幕
- 创建新的启动屏幕设计，与应用主题和图标风格一致
- 准备不同屏幕尺寸的启动屏幕资源
- 实现深色/浅色模式的启动屏幕版本
- 优化启动屏幕加载性能

### 3. 更新应用资源
- 替换 `assets/` 目录中的图标文件
- 更新 `app.json` 中的图标和启动屏幕配置：
  ```json
  {
    "expo": {
      "icon": "./assets/icon.png",
      "splash": {
        "image": "./assets/splash.png",
        "resizeMode": "contain",
        "backgroundColor": "#ffffff"
      },
      "android": {
        "adaptiveIcon": {
          "foregroundImage": "./assets/adaptive-icon.png",
          "backgroundColor": "#ffffff"
        }
      }
    }
  }
  ```
- 添加深色模式支持配置

### 4. 设置GitHub Actions构建工作流
- 创建 `.github/workflows/build.yml` 文件：
  ```yaml
  name: Build and Release

  on:
    push:
      tags:
        - 'v*'

  jobs:
    build:
      runs-on: ubuntu-latest
      steps:
        - name: Checkout code
          uses: actions/checkout@v3

        - name: Setup Node.js
          uses: actions/setup-node@v3
          with:
            node-version: '16'
            cache: 'npm'

        - name: Install dependencies
          run: npm ci

        - name: Setup Expo
          uses: expo/expo-github-action@v7
          with:
            expo-version: latest
            eas-version: latest
            token: ${{ secrets.EXPO_TOKEN }}

        - name: Build Android
          run: eas build --platform android --non-interactive

        - name: Build iOS
          run: eas build --platform ios --non-interactive
  ```
- 配置Expo CLI和EAS CLI凭证

### 5. 配置自动发布流程
- 创建 `.github/workflows/release.yml` 文件：
  ```yaml
  name: Create Release

  on:
    push:
      tags:
        - 'v*'

  jobs:
    release:
      runs-on: ubuntu-latest
      steps:
        - name: Checkout code
          uses: actions/checkout@v3

        - name: Create Release
          id: create_release
          uses: actions/create-release@v1
          env:
            GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          with:
            tag_name: ${{ github.ref }}
            release_name: Release ${{ github.ref }}
            draft: false
            prerelease: false
            body: |
              ## 更新内容
              
              - 从提交信息自动生成的更新记录
              
              ## 下载链接
              
              - [Android APK](https://expo.dev/artifacts/...)
              - [iOS TestFlight](https://testflight.apple.com/...)
  ```
- 配置版本号自动更新

### 6. 配置EAS构建设置
- 创建或更新 `eas.json` 配置文件：
  ```json
  {
    "build": {
      "production": {
        "android": {
          "buildType": "app-bundle"
        },
        "ios": {
          "distribution": "store"
        }
      },
      "preview": {
        "android": {
          "buildType": "apk"
        },
        "ios": {
          "simulator": true
        }
      }
    },
    "submit": {
      "production": {
        "android": {
          "serviceAccountKeyPath": "path/to/key.json"
        },
        "ios": {
          "appleId": "your-apple-id@example.com",
          "ascAppId": "1234567890",
          "appleTeamId": "ABCDEFG"
        }
      }
    }
  }
  ```
- 配置构建缓存和优化选项

### 7. 添加版本更新检查
- 实现版本检查功能，在应用启动时检查新版本
- 添加更新提示UI
- 配置应用内更新通知

### 8. 测试和优化
- 在不同设备上测试新图标和启动屏幕
- 测试自动构建和发布流程
- 优化构建时间和产物大小

## 相关文件
- `assets/` - 图标和启动屏幕资源
- `app.json` - Expo应用配置
- `eas.json` - EAS构建配置
- `.github/workflows/` - GitHub Actions工作流文件
- `config/version.ts` - 版本信息

## 注意事项
- 图标设计要符合各平台的设计规范
- 启动屏幕应该简洁且加载速度快
- GitHub Actions需要适当的权限和密钥配置
- 自动发布流程需要考虑版本号管理
- 构建时需要处理敏感信息（如密钥）的安全存储
- 发布前需要考虑应用商店的审核要求
- 确保CI/CD流程的稳定性和可靠性 