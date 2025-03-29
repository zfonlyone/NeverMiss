#!/bin/bash
# iOS模拟器安装与运行脚本

# 应用包名
BUNDLE_ID="com.nevermiss.app"

# 应用路径
APP_PATH="$PWD/ios/build/Build/Products/Release-iphonesimulator/NeverMiss.app"

# 检查构建是否存在
if [ ! -d "$APP_PATH" ]; then
  echo "错误: 构建不存在，请先运行 ./scripts/build-ios-simulator.sh"
  exit 1
fi

# 获取当前启动的模拟器设备ID
DEVICE_ID=$(xcrun simctl list devices booted | grep "(Booted)" | head -1 | sed -E 's/.*\(([A-Z0-9-]+)\).*/\1/')

if [ -z "$DEVICE_ID" ]; then
  echo "未检测到启动的模拟器，正在启动默认模拟器..."
  # 启动默认模拟器
  xcrun simctl boot
  DEVICE_ID=$(xcrun simctl list devices booted | grep "(Booted)" | head -1 | sed -E 's/.*\(([A-Z0-9-]+)\).*/\1/')
  
  if [ -z "$DEVICE_ID" ]; then
    echo "无法启动模拟器，请手动启动Xcode模拟器后再尝试"
    exit 1
  fi
fi

echo "正在使用设备ID: $DEVICE_ID"

# 安装应用到模拟器
echo "正在安装应用到模拟器..."
xcrun simctl install $DEVICE_ID "$APP_PATH"

# 启动应用
echo "正在启动应用..."
xcrun simctl launch $DEVICE_ID $BUNDLE_ID

echo "应用已启动！" 