import { Task } from '../models/Task';
import { FilterOptions, SortOption, SortDirection, TaskStatusFilter } from '../components/TaskListFilter';

/**
 * 根据筛选条件过滤任务列表
 * @param tasks 原始任务列表
 * @param filterOptions 筛选选项
 * @returns 过滤后的任务列表
 */
export function filterTasks(tasks: Task[], filterOptions: FilterOptions): Task[] {
  if (!tasks || tasks.length === 0) return [];
  
  return tasks.filter(task => {
    // 处理搜索文本筛选
    if (filterOptions.searchText) {
      const searchLower = filterOptions.searchText.toLowerCase();
      const titleMatch = task.title.toLowerCase().includes(searchLower);
      const descMatch = task.description?.toLowerCase().includes(searchLower) || false;
      
      if (!titleMatch && !descMatch) {
        return false;
      }
    }
    
    // 处理活动状态筛选
    if (!filterOptions.showDisabled && !task.isActive) {
      return false;
    }
    
    // 处理标签筛选
    if (filterOptions.tagsFilter.length > 0) {
      if (!task.tags || task.tags.length === 0) {
        return false;
      }
      
      // 检查任务是否包含任一选中的标签
      const hasMatchingTag = task.tags.some(tag => 
        filterOptions.tagsFilter.includes(tag)
      );
      
      if (!hasMatchingTag) {
        return false;
      }
    }
    
    // 处理任务状态筛选
    if (filterOptions.statusFilter !== 'all') {
      if (!task.currentCycle) {
        return false;
      }
      
      switch (filterOptions.statusFilter) {
        case 'active':
          return !task.currentCycle.isCompleted && !task.currentCycle.isOverdue;
        case 'completed':
          return task.currentCycle.isCompleted;
        case 'overdue':
          return task.currentCycle.isOverdue;
        default:
          return true;
      }
    }
    
    return true;
  });
}

/**
 * 根据排序选项对任务列表进行排序
 * @param tasks 任务列表
 * @param sortBy 排序字段
 * @param sortDirection 排序方向（升序/降序）
 * @returns 排序后的任务列表
 */
export function sortTasks(
  tasks: Task[], 
  sortBy: SortOption = 'title', 
  sortDirection: SortDirection = 'asc'
): Task[] {
  if (!tasks || tasks.length === 0) return [];
  
  const sortedTasks = [...tasks];
  
  sortedTasks.sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'dueDate':
        // 获取当前周期的截止日期进行比较
        const aDate = a.currentCycle?.dueDate || '';
        const bDate = b.currentCycle?.dueDate || '';
        comparison = aDate.localeCompare(bDate);
        break;
      case 'createdAt':
        comparison = a.createdAt.localeCompare(b.createdAt);
        break;
      case 'lastUpdated':
        comparison = a.updatedAt.localeCompare(b.updatedAt);
        break;
      default:
        comparison = 0;
    }
    
    // 根据排序方向调整结果
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  return sortedTasks;
}

/**
 * 提取任务列表中的所有唯一标签
 * @param tasks 任务列表
 * @returns 所有唯一标签的数组
 */
export function extractAllTags(tasks: Task[]): string[] {
  if (!tasks || tasks.length === 0) return [];
  
  // 合并所有标签并去重
  const allTags = tasks.reduce((tags: string[], task) => {
    if (task.tags && task.tags.length > 0) {
      return [...tags, ...task.tags];
    }
    return tags;
  }, []);
  
  // 去重并排序
  return [...new Set(allTags)].sort();
}

// 默认导出对象，包含所有导出的函数
export default {
  filterTasks,
  sortTasks,
  extractAllTags
}; 