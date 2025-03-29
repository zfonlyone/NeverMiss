# GitHub Actions 工作流说明

本文档说明GitHub Actions工作流的配置和使用方法。

## 工作流文件

| 实际工作流名称 | 文件名 | 用途 | 触发方式 |
| ----- | ----- | ----- | ----- |
| Build Release (Store Version) | `build-and-release.yml` | 构建商店签名版本用于应用商店发布 | 仅限main/master分支手动触发 |
| Build Release Test Version | `build-test.yml` | 构建无签名发布测试版本用于上架前测试 | main/master分支版本标签、手动触发 |
| Build Debug Version | `build-debug.yml` | 构建需PC服务支持的开发调试版本 | dev及开发分支提交、手动触发 |
| Build Expo Cloud Version | `build-release-eas.yml` | 使用Expo云服务托管构建应用 | 仅限main分支手动触发 |
| - | `*.bak` | 已暂停使用的构建配置 | 不触发 |

## 环境变量和密钥

工作流使用GitHub的密钥管理功能存储敏感信息，需要在仓库设置中配置以下密钥：

### Android签名相关
- `ANDROID_KEYSTORE_BASE64`: Base64编码的Android密钥库文件
- `KEYSTORE_PASSWORD`: 密钥库密码
- `KEY_ALIAS`: 密钥别名
- `KEY_PASSWORD`: 密钥密码

### iOS签名相关
- `IOS_P12_BASE64`: Base64编码的P12证书文件
- `IOS_P12_PASSWORD`: P12证书密码
- `KEYCHAIN_PASSWORD`: 密钥链密码
- `IOS_PROVISION_PROFILE_BASE64`: Base64编码的Provisioning Profile文件
- `IOS_CERTIFICATE_NAME`: iOS证书名称
- `IOS_TEAM_ID`: Apple开发者团队ID

### Expo构建相关
- `EXPO_TOKEN`: Expo访问令牌，用于云构建服务认证

## 构建产物

### Android
- 正式版: `NeverMiss-Android-Store.apk`, `NeverMiss-Android-Store.aab`
- 发布测试版: `NeverMiss-Android-ReleaseTest.apk`
- 调试版: `NeverMiss-Android-debug.apk`
- Expo云构建版: `NeverMiss-Android-ExpoCloud.apk`

### iOS
- 正式版: `NeverMiss-iOS-Store.ipa`
- 发布测试版: `NeverMiss-iOS-ReleaseTest.ipa`
- 调试版: `NeverMiss-iOS-Simulator-debug.zip`
- Expo云构建版: 仅在Expo开发者控制台可见

## 工作流配置说明

### 1. Build Release (Store Version) [build-and-release.yml]

- **触发条件**: 仅限main/master分支手动触发
- **权限**: 具有写入内容、PR和Issue的权限
- **主要步骤**:
  1. 检出代码、设置环境
  2. 检查版本号一致性
  3. Android构建：设置签名、构建APK和AAB
  4. iOS构建：配置证书、构建IPA
  5. 创建发布：上传文件、生成发布说明

### 2. Build Release Test Version [build-test.yml]

- **触发条件**: main/master分支版本标签推送、手动触发
- **主要步骤**:
  1. 标准环境设置
  2. Android: 不使用签名构建Release版APK
  3. iOS: 不使用签名构建Release版IPA
  4. 创建预发布，设置标签

### 3. Build Debug Version [build-debug.yml]

- **触发条件**: dev及开发分支推送、手动触发
- **主要步骤**:
  1. 设置开发环境
  2. Android: 构建Debug APK
  3. iOS: 构建iOS模拟器包
  4. 创建开发调试版发布

### 4. Build Expo Cloud Version [build-release-eas.yml]

- **触发条件**: 仅限main分支手动触发
- **主要步骤**:
  1. 检查当前分支是否为main
  2. 设置Expo环境和凭证
  3. Android: 使用Expo云服务构建APK
  4. iOS: 提交构建请求到Expo云服务
  5. 创建预发布，包含Android构建结果和iOS构建信息

## 工作流手动触发方法

1. 进入GitHub仓库页面
2. 点击"Actions"选项卡
3. 从左侧列表选择对应的工作流：
   - `Build Release (Store Version)` - 用于应用商店正式发布版本
   - `Build Release Test Version` - 用于上架前测试验证版本
   - `Build Debug Version` - 用于开发调试版本
   - `Build Expo Cloud Version` - 用于Expo云构建版本
4. 点击"Run workflow"按钮
5. 选择分支，点击"Run workflow"开始构建

## 关于Expo云构建

- Expo云构建使用Expo的托管服务进行应用构建
- Android构建可以下载APK用于测试
- iOS构建需要通过Expo开发者控制台查看并下载
- 需要有效的Expo账号和访问令牌
- 适用于需要使用Expo专有功能的情况 