@echo off
chcp 65001 >nul
REM iOS模拟器安装与运行脚本

REM 应用包名
set BUNDLE_ID=com.nevermiss.app

REM 应用路径
set APP_PATH=%CD%\ios\build\Build\Products\Release-iphonesimulator\NeverMiss.app

REM 检查构建是否存在
if not exist "%APP_PATH%" (
  echo 错误: 构建不存在，请先运行 .\scripts\build-ios-simulator.bat
  exit /b 1
)

REM 获取当前启动的模拟器设备ID
for /f "tokens=*" %%i in ('xcrun simctl list devices ^| findstr "(Booted)" ^| findstr /r /c:"([A-Z0-9-]\+)"') do (
  for /f "tokens=2 delims=()" %%j in ("%%i") do (
    set DEVICE_ID=%%j
    goto :device_found
  )
)

:no_device_found
echo 未检测到启动的模拟器，正在启动默认模拟器...
REM 启动默认模拟器
xcrun simctl boot

for /f "tokens=*" %%i in ('xcrun simctl list devices ^| findstr "(Booted)" ^| findstr /r /c:"([A-Z0-9-]\+)"') do (
  for /f "tokens=2 delims=()" %%j in ("%%i") do (
    set DEVICE_ID=%%j
    goto :device_found
  )
)

echo 无法启动模拟器，请手动启动Xcode模拟器后再尝试
exit /b 1

:device_found
echo 正在使用设备ID: %DEVICE_ID%

REM 安装应用到模拟器
echo 正在安装应用到模拟器...
xcrun simctl install %DEVICE_ID% "%APP_PATH%"

REM 启动应用
echo 正在启动应用...
xcrun simctl launch %DEVICE_ID% %BUNDLE_ID%

echo 应用已启动！ 