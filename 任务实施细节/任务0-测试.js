/**
 * 任务0 - 数据库版本与应用信息集成测试脚本
 */

const testExportImport = async () => {
  console.log('开始测试导出和导入功能...');
  
  try {
    // 1. 导出数据到JSON
    console.log('测试：导出数据到JSON');
    const exportResult = await exportDataToJSON();
    
    if (!exportResult.success) {
      console.error('导出失败:', exportResult.error);
      return;
    }
    
    console.log('导出成功，文件路径:', exportResult.filePath);
    
    // 2. 读取导出的JSON文件
    console.log('测试：读取导出的JSON文件');
    const fileContent = await FileSystem.readAsStringAsync(exportResult.filePath);
    const exportData = JSON.parse(fileContent);
    
    // 3. 验证版本信息是否包含在导出数据中
    console.log('测试：验证版本信息');
    
    if (!exportData.appInfo || !exportData.dbInfo) {
      console.error('导出数据中没有包含版本信息');
      return;
    }
    
    console.log('应用版本信息:', exportData.appInfo);
    console.log('数据库版本信息:', exportData.dbInfo);
    console.log('导出信息:', exportData.exportInfo);
    
    // 4. 模拟导入
    console.log('测试：导入数据');
    const importResult = await importDataFromJSON(exportResult.filePath);
    
    if (!importResult.success) {
      console.error('导入失败:', importResult.error);
      return;
    }
    
    console.log('导入成功');
    
    // 5. 测试版本兼容性检查
    console.log('测试：版本兼容性检查');
    
    // 创建一个版本号更高的测试数据
    const incompatibleData = { ...exportData };
    incompatibleData.dbInfo.version = 999; // 设置一个非常高的版本号
    
    // 写入临时文件
    const tempFilePath = `${FileSystem.documentDirectory}temp_test.json`;
    await FileSystem.writeAsStringAsync(tempFilePath, JSON.stringify(incompatibleData));
    
    // 尝试导入
    const incompatibleImportResult = await importDataFromJSON(tempFilePath);
    
    if (incompatibleImportResult.success) {
      console.error('版本兼容性检查失败: 高版本数据被成功导入');
    } else {
      console.log('版本兼容性检查成功:', incompatibleImportResult.error);
    }
    
    // 清理测试文件
    await FileSystem.deleteAsync(tempFilePath, { idempotent: true });
    
    console.log('测试完成');
  } catch (error) {
    console.error('测试过程中出现错误:', error);
  }
};

// 导出测试函数
export { testExportImport }; 