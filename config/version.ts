/**
 * 版本配置文件
 * 统一管理所有版本相关的配置
 */

// 应用信息
export const APP_INFO = {
  // 应用版本号
  VERSION: '1.0.0',
  // 数据库版本号
  DATABASE_VERSION: 1,
  // 作者
  AUTHOR: 'zfonlyone',
  // 应用名称
  NAME: 'NeverMiss',
  // 构建号(用于应用商店)
  BUILD_NUMBER: '1',
  // 最低支持的数据库版本
  MIN_DATABASE_VERSION: 1,
} as const;

// 获取完整版本号(包含构建号)
export function getFullVersion(): string {
  return `${APP_INFO.VERSION} (${APP_INFO.BUILD_NUMBER})`;
}

// 导出默认配置
export default APP_INFO; 