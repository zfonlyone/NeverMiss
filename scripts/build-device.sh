#!/bin/bash
# 使用免费开发者账号构建并安装到设备

# 预构建步骤
echo "预构建项目..."
npx expo prebuild -p ios

# 进入iOS目录
cd ios

# 查找连接的设备ID
DEVICE_ID=$(xcrun xctrace list devices | grep -v 'Simulator' | grep -E '[0-9A-F]{8}-([0-9A-F]{4}-){3}[0-9A-F]{12}' | head -1 | sed -E 's/.*\(([0-9A-F]{8}-([0-9A-F]{4}-){3}[0-9A-F]{12})\).*/\1/')

if [ -z "$DEVICE_ID" ]; then
  echo "错误：未检测到已连接的iOS设备"
  exit 1
fi

echo "检测到设备ID: $DEVICE_ID"

# 构建并安装到设备（使用个人团队）
echo "构建并安装到设备..."
xcodebuild -workspace NeverMiss.xcworkspace -scheme NeverMiss \
  -configuration Debug -destination "id=$DEVICE_ID" \
  DEVELOPMENT_TEAM="$(security find-identity -v -p codesigning | grep 'Apple Development' | head -1 | cut -d'"' -f2)" \
  build

echo "应用已构建"
echo "请在设备上前往'设置→通用→设备管理'信任开发者证书"
echo "注意：使用免费账号签名的应用7天后需要重新签名" 