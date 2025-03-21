#!/bin/bash
# Android安装与运行脚本

# 应用包名
PACKAGE_NAME="com.nevermiss.app"

# APK路径
APK_PATH="$PWD/android/app/build/outputs/apk/release/app-release.apk"

# 检查构建是否存在
if [ ! -f "$APK_PATH" ]; then
  echo "错误: APK不存在，请先运行 ./scripts/build-android.sh"
  exit 1
fi

# 检查是否有Android设备连接
if ! adb devices | grep -q "device$"; then
  echo "未检测到已连接的Android设备或模拟器"
  
  # 尝试启动模拟器（如果已存在模拟器）
  echo "尝试启动Android模拟器..."
  EMULATOR_NAME=$(emulator -list-avds | head -1)
  
  if [ -z "$EMULATOR_NAME" ]; then
    echo "未找到Android模拟器，请先创建一个模拟器或连接真机"
    exit 1
  else
    echo "启动模拟器: $EMULATOR_NAME"
    emulator -avd "$EMULATOR_NAME" &
    
    # 等待模拟器启动
    echo "等待模拟器启动..."
    while ! adb devices | grep -q "device$"; do
      sleep 2
    done
    sleep 5 # 给模拟器一些额外的启动时间
  fi
fi

echo "检测到Android设备"

# 安装APK
echo "正在安装APK到设备..."
adb install -r "$APK_PATH"

# 启动应用
echo "正在启动应用..."
adb shell monkey -p $PACKAGE_NAME -c android.intent.category.LAUNCHER 1

echo "应用已启动！" 