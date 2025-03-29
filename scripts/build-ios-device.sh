#!/bin/bash
# iOS真机构建脚本 - 无需Metro服务器

# 确保目录存在
mkdir -p scripts

# 预构建步骤（生成原生iOS项目）
echo "第1步：预构建项目..."
npx expo prebuild -p ios

# 构建iOS版本（Release模式）
echo "第2步：构建Release版本..."
cd ios && xcodebuild -workspace NeverMiss.xcworkspace -scheme NeverMiss \
  -configuration Release -sdk iphoneos -derivedDataPath build

# 构建完成后，输出应用路径
APP_PATH="$(pwd)/build/Build/Products/Release-iphoneos/NeverMiss.app"
IPA_PATH="$(pwd)/build/Build/Products/Release-iphoneos/NeverMiss.ipa"
cd ..

# 将.app文件打包为.ipa文件
echo "第3步：打包IPA文件..."
cd ios/build/Build/Products
mkdir -p Payload
cp -R Release-iphoneos/NeverMiss.app Payload/
zip -r NeverMiss.ipa Payload
mv NeverMiss.ipa Release-iphoneos/
rm -rf Payload
cd ../../../../

echo "构建完成！"
echo "APP路径: $APP_PATH"
echo "IPA路径: $IPA_PATH"
echo
echo "要在iPhone上安装该应用，请使用Xcode的Devices & Simulators功能，"
echo "或通过iTunes/Apple Configurator进行安装。" 