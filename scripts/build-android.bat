@echo off
chcp 65001 >nul
REM Android应用构建脚本 - 无需Metro服务器

REM 确保目录存在
if not exist scripts mkdir scripts

REM 应用包名
set PACKAGE_NAME=com.nevermiss.app

REM 预构建步骤（生成原生Android项目）
echo 第1步：预构建项目...
call npx expo prebuild -p android

REM 设置签名配置
echo 第2步：配置APK签名...
cd android

REM 检查是否已有签名配置
if not exist app\nevermiss-key.keystore (
  echo 未找到签名密钥，正在创建新的签名密钥...
  if not exist app mkdir app
  
  REM 生成签名密钥
  keytool -genkeypair -v -storetype PKCS12 -keystore app\nevermiss-key.keystore ^
    -alias nevermiss-key -keyalg RSA -keysize 2048 -validity 10000 ^
    -storepass nevermiss -keypass nevermiss ^
    -dname "CN=NeverMiss,O=ZFOnlyOne,L=Shanghai,C=CN"
    
  if errorlevel 1 (
    echo 创建签名密钥失败
    exit /b 1
  )
)

REM 检查gradle.properties是否已包含签名配置
findstr "MYAPP_UPLOAD_STORE_FILE" gradle.properties > nul
if errorlevel 1 (
  echo 添加签名配置到gradle.properties...
  echo. >> gradle.properties
  echo # 应用签名配置 >> gradle.properties
  echo MYAPP_UPLOAD_STORE_FILE=nevermiss-key.keystore >> gradle.properties
  echo MYAPP_UPLOAD_KEY_ALIAS=nevermiss-key >> gradle.properties
  echo MYAPP_UPLOAD_STORE_PASSWORD=nevermiss >> gradle.properties
  echo MYAPP_UPLOAD_KEY_PASSWORD=nevermiss >> gradle.properties
)

REM 检查app/build.gradle是否已包含签名配置
findstr "signingConfigs.release" app\build.gradle > nul
if errorlevel 1 (
  echo 修改app/build.gradle添加签名配置...
  
  REM 创建临时文件进行修改 - Windows批处理的文本处理能力有限
  REM 在实际项目中，这里可能需要使用更强大的脚本语言如PowerShell或Node.js
  echo 警告: 在Windows环境下无法自动修改build.gradle
  echo 请手动添加签名配置到app\build.gradle文件:
  echo   1. 添加signingConfigs块
  echo   2. 在defaultConfig中添加signingConfig signingConfigs.release
  echo 按任意键继续...
  pause > nul
)

REM 构建Android版本（Release模式）
echo 第3步：构建Release版本...
call gradlew assembleRelease

REM 构建完成后，输出APK路径
set APK_PATH=%CD%\app\build\outputs\apk\release\app-release.apk
cd ..

echo 构建完成！
echo APK路径: %APK_PATH%
echo.
echo 要安装APK到设备，运行:
echo adb install -r "%APK_PATH%"
echo.
echo 要启动应用，运行:
echo adb shell monkey -p %PACKAGE_NAME% -c android.intent.category.LAUNCHER 1 