@echo off
chcp 65001 >nul
REM iOS真机安装与运行脚本

REM 应用包名
set BUNDLE_ID=com.nevermiss.app

REM IPA路径
set IPA_PATH=%CD%\ios\build\Build\Products\Release-iphoneos\NeverMiss.ipa

REM 检查构建是否存在
if not exist "%IPA_PATH%" (
  echo 错误: IPA不存在，请先运行 .\scripts\build-ios-device.bat
  exit /b 1
)

REM 检测已连接的设备 (Windows上通常使用iTunes或Finder)
echo 已构建iOS应用，但Windows环境需要通过macOS设备安装

REM 提示用户使用Xcode安装应用
echo iOS应用需要通过Xcode进行安装，请按照以下步骤操作:
echo 1. 将IPA文件拷贝到macOS设备
echo 2. 在macOS上打开Xcode
echo 3. 选择 Window ^> Devices and Simulators
echo 4. 选择已连接的设备
echo 5. 点击 + 按钮，选择IPA文件进行安装
echo 6. 安装完成后，在设备上运行应用
echo.
echo IPA文件路径: %IPA_PATH% 