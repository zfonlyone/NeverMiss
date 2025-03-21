#!/bin/bash
# Android应用构建脚本 - 无需Metro服务器

# 确保目录存在
mkdir -p scripts

# 应用包名
PACKAGE_NAME="com.nevermiss.app"

# 预构建步骤（生成原生Android项目）
echo "第1步：预构建项目..."
npx expo prebuild -p android

# 设置签名配置
echo "第2步：配置APK签名..."
cd android

# 检查是否已有签名配置
if [ ! -f app/nevermiss-key.keystore ]; then
  echo "未找到签名密钥，正在创建新的签名密钥..."
  mkdir -p app
  
  # 生成签名密钥
  keytool -genkeypair -v -storetype PKCS12 -keystore app/nevermiss-key.keystore \
    -alias nevermiss-key -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass nevermiss -keypass nevermiss \
    -dname "CN=NeverMiss,O=ZFOnlyOne,L=Shanghai,C=CN"
    
  if [ $? -ne 0 ]; then
    echo "创建签名密钥失败"
    exit 1
  fi
fi

# 检查gradle.properties是否已包含签名配置
if ! grep -q "MYAPP_UPLOAD_STORE_FILE" gradle.properties; then
  echo "添加签名配置到gradle.properties..."
  echo "" >> gradle.properties
  echo "# 应用签名配置" >> gradle.properties
  echo "MYAPP_UPLOAD_STORE_FILE=nevermiss-key.keystore" >> gradle.properties
  echo "MYAPP_UPLOAD_KEY_ALIAS=nevermiss-key" >> gradle.properties
  echo "MYAPP_UPLOAD_STORE_PASSWORD=nevermiss" >> gradle.properties
  echo "MYAPP_UPLOAD_KEY_PASSWORD=nevermiss" >> gradle.properties
fi

# 检查app/build.gradle是否已包含签名配置
if ! grep -q "signingConfigs.release" app/build.gradle; then
  echo "修改app/build.gradle添加签名配置..."
  
  # 先创建一个备份
  cp app/build.gradle app/build.gradle.bak
  
  # 使用sed添加签名配置
  sed -i.bak '
  /defaultConfig {/,/}/ {
    /versionName/a \
        signingConfig signingConfigs.release
  }
  /buildTypes {/i \
    signingConfigs {\
        release {\
            storeFile file(MYAPP_UPLOAD_STORE_FILE)\
            storePassword MYAPP_UPLOAD_STORE_PASSWORD\
            keyAlias MYAPP_UPLOAD_KEY_ALIAS\
            keyPassword MYAPP_UPLOAD_KEY_PASSWORD\
        }\
    }
  ' app/build.gradle
  
  # 检查sed是否成功
  if ! grep -q "signingConfigs.release" app/build.gradle; then
    echo "无法自动修改build.gradle，恢复备份文件"
    mv app/build.gradle.bak app/build.gradle
    exit 1
  fi
fi

# 构建Android版本（Release模式）
echo "第3步：构建Release版本..."
./gradlew assembleRelease

# 构建完成后，输出APK路径
APK_PATH="$(pwd)/app/build/outputs/apk/release/app-release.apk"
cd ..

echo "构建完成！"
echo "APK路径: $APK_PATH"
echo
echo "要安装APK到设备，运行:"
echo "adb install -r \"$APK_PATH\""
echo
echo "要启动应用，运行:"
echo "adb shell monkey -p $PACKAGE_NAME -c android.intent.category.LAUNCHER 1" 