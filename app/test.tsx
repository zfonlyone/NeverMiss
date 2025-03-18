import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';
import { exportDataToJSON, importDataFromJSON, shareFile } from '../models/services/exportService';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { getAppInfo, getDatabaseInfo } from '../models/services/database';

export default function TestScreen() {
  const [log, setLog] = useState<string[]>([]);
  const [filePath, setFilePath] = useState<string | null>(null);

  const addLog = (message: string) => {
    setLog(prev => [...prev, `${new Date().toISOString().slice(11, 19)}: ${message}`]);
  };

  const clearLog = () => {
    setLog([]);
  };

  const handleExport = async () => {
    try {
      addLog('开始导出数据...');
      const result = await exportDataToJSON();
      
      if (result.success && result.filePath) {
        setFilePath(result.filePath);
        addLog(`导出成功: ${result.filePath}`);
        
        // 读取并显示文件内容
        const content = await FileSystem.readAsStringAsync(result.filePath);
        const data = JSON.parse(content);
        addLog('导出数据包含:');
        addLog(`- 应用版本: ${data.appInfo.version} (${data.appInfo.buildNumber})`);
        addLog(`- 数据库版本: ${data.dbInfo.version}`);
        addLog(`- 导出时间: ${data.exportInfo.timestamp}`);
        addLog(`- 任务数量: ${data.data.tasks.length}`);
      } else {
        addLog(`导出失败: ${result.error}`);
      }
    } catch (error) {
      addLog(`导出错误: ${error}`);
    }
  };

  const handleShare = async () => {
    if (!filePath) {
      addLog('没有可分享的文件，请先导出');
      return;
    }

    try {
      addLog('分享文件...');
      const result = await shareFile(filePath);
      if (result) {
        addLog('文件分享成功');
      } else {
        addLog('文件分享失败');
      }
    } catch (error) {
      addLog(`分享错误: ${error}`);
    }
  };

  const handleImport = async () => {
    try {
      addLog('选择导入文件...');
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        addLog(`选择了文件: ${file.name}`);
        
        const importResult = await importDataFromJSON(file.uri);
        if (importResult.success) {
          addLog('导入成功');
        } else {
          addLog(`导入失败: ${importResult.error}`);
        }
      } else {
        addLog('未选择文件');
      }
    } catch (error) {
      addLog(`导入错误: ${error}`);
    }
  };

  const handleVersion = async () => {
    try {
      addLog('获取版本信息...');
      const appInfo = await getAppInfo();
      const dbInfo = await getDatabaseInfo();
      
      addLog(`应用版本: ${appInfo.appVersion}`);
      addLog(`数据库版本: ${appInfo.databaseVersion}`);
      addLog(`作者: ${appInfo.author}`);
      addLog(`数据统计:`);
      addLog(`- 任务数: ${dbInfo.tasksCount}`);
      addLog(`- 周期数: ${dbInfo.cyclesCount}`);
      addLog(`- 历史记录数: ${dbInfo.historyCount}`);
    } catch (error) {
      addLog(`获取版本信息错误: ${error}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>任务0测试：数据库版本与应用信息集成</Text>
      
      <View style={styles.buttonContainer}>
        <Button title="导出数据" onPress={handleExport} />
        <Button title="分享文件" onPress={handleShare} />
        <Button title="导入数据" onPress={handleImport} />
        <Button title="版本信息" onPress={handleVersion} />
        <Button title="清除日志" onPress={clearLog} />
      </View>
      
      <ScrollView style={styles.logContainer}>
        <Text style={styles.logTitle}>日志:</Text>
        {log.map((line, index) => (
          <Text key={index} style={styles.logLine}>{line}</Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    marginTop: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
  },
  logTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  logLine: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
}); 