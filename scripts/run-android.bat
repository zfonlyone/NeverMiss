@echo off
chcp 65001 >nul
REM Android安装与运行脚本

REM 应用包名
set PACKAGE_NAME=com.nevermiss.app

REM APK路径
set APK_PATH=%CD%\android\app\build\outputs\apk\release\app-release.apk

REM 检查构建是否存在
if not exist "%APK_PATH%" (
  echo 错误: APK不存在，请先运行 .\scripts\build-android.bat
  exit /b 1
)

REM 检查是否有Android设备连接
adb devices | findstr "device$" > nul
if errorlevel 1 (
  echo 未检测到已连接的Android设备或模拟器
  
  REM 尝试启动模拟器（如果已存在模拟器）
  echo 尝试启动Android模拟器...
  for /f "tokens=*" %%i in ('emulator -list-avds') do (
    set EMULATOR_NAME=%%i
    goto :start_emulator
  )
  
  echo 未找到Android模拟器，请先创建一个模拟器或连接真机
  exit /b 1
  
  :start_emulator
  echo 启动模拟器: %EMULATOR_NAME%
  start /b emulator -avd "%EMULATOR_NAME%"
  
  REM 等待模拟器启动
  echo 等待模拟器启动...
  :wait_loop
  timeout /t 2 > nul
  adb devices | findstr "device$" > nul
  if errorlevel 1 goto wait_loop
  
  REM 给模拟器一些额外的启动时间
  timeout /t 5 > nul
)

echo 检测到Android设备

REM 安装APK
echo 正在安装APK到设备...
adb install -r "%APK_PATH%"

REM 启动应用
echo 正在启动应用...
adb shell monkey -p %PACKAGE_NAME% -c android.intent.category.LAUNCHER 1

echo 应用已启动！ 