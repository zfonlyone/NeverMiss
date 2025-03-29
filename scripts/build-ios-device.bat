@echo off
chcp 65001 >nul
REM iOS真机构建脚本 - 无需Metro服务器

REM 确保目录存在
if not exist scripts mkdir scripts

REM 预构建步骤（生成原生iOS项目）
echo 第1步：预构建项目...
call npx expo prebuild -p ios

REM 构建iOS版本（Release模式）
echo 第2步：构建Release版本...
cd ios && xcodebuild -workspace NeverMiss.xcworkspace -scheme NeverMiss ^
  -configuration Release -sdk iphoneos -derivedDataPath build

REM 构建完成后，输出应用路径
set APP_PATH=%CD%\build\Build\Products\Release-iphoneos\NeverMiss.app
set IPA_PATH=%CD%\build\Build\Products\Release-iphoneos\NeverMiss.ipa
cd ..

REM 将.app文件打包为.ipa文件
echo 第3步：打包IPA文件...
cd ios\build\Build\Products
if not exist Payload mkdir Payload
xcopy /s /y Release-iphoneos\NeverMiss.app Payload\
REM 在Windows上需要安装额外工具来支持zip功能
REM 这里假设用户已经安装了7-Zip并添加到PATH
7z a NeverMiss.ipa Payload
move NeverMiss.ipa Release-iphoneos\
rd /s /q Payload
cd ..\..\..\..\

echo 构建完成！
echo APP路径: %APP_PATH%
echo IPA路径: %IPA_PATH%
echo.
echo 要在iPhone上安装该应用，请使用Xcode的Devices ^& Simulators功能，
echo 或通过iTunes/Apple Configurator进行安装。 