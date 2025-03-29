#!/bin/bash
# iOS真机安装与运行脚本

# 应用包名
BUNDLE_ID="com.nevermiss.app"

# IPA路径
IPA_PATH="$PWD/ios/build/Build/Products/Release-iphoneos/NeverMiss.ipa"

# 检查构建是否存在
if [ ! -f "$IPA_PATH" ]; then
  echo "错误: IPA不存在，请先运行 ./scripts/build-ios-device.sh"
  exit 1
fi

# 检测已连接的设备
if ! xcrun xctrace list devices 2>&1 | grep -q "^iPhone"; then
  echo "未检测到已连接的iOS设备，请连接设备后重试"
  exit 1
fi

# 提示用户使用Xcode安装应用
echo "已检测到iOS设备连接"
echo "iOS应用需要通过Xcode进行安装，请按照以下步骤操作:"
echo "1. 打开Xcode"
echo "2. 选择 Window > Devices and Simulators"
echo "3. 选择已连接的设备"
echo "4. 点击 + 按钮，选择 $IPA_PATH 进行安装"
echo "5. 安装完成后，在设备上运行应用"
echo
echo "您也可以使用以下命令尝试直接安装:"
echo "ios-deploy --bundle \"$IPA_PATH\" --debug" 