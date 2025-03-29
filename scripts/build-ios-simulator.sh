#!/bin/bash
# iOS模拟器构建脚本 - 无需Metro服务器

# 确保目录存在
mkdir -p scripts

# 预构建步骤（生成原生iOS项目）
echo "第1步：预构建项目..."
npx expo prebuild -p ios

# 构建iOS版本（Release模式）
echo "第2步：构建Release版本..."
cd ios && xcodebuild -workspace NeverMiss.xcworkspace -scheme NeverMiss \
  -configuration Release -sdk iphonesimulator -derivedDataPath build

# 构建完成后，输出应用路径
APP_PATH="$(pwd)/build/Build/Products/Release-iphonesimulator/NeverMiss.app"
cd ..

echo "构建完成！"
echo "应用路径: $APP_PATH"
echo
echo "要在模拟器上安装应用，运行:"
echo "xcrun simctl install booted $APP_PATH"
echo
echo "要启动模拟器上的应用，运行:"
echo "xcrun simctl launch booted com.nevermiss.app" 