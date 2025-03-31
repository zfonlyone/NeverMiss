import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as taskService from '../services/taskService';
import { Task } from '../models/Task';

// 任务上下文类型
interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  setTasks: (tasks: Task[]) => void;
  completeTask: (taskId: number) => Promise<Task | null>;
  handleTaskOverdue: (taskId: number, action: 'reset' | 'continue' | 'skip') => Promise<Task | null>;
}

// 创建上下文
const TaskContext = createContext<TaskContextType>({
  tasks: [],
  loading: false,
  setTasks: () => {},
  completeTask: async () => null,
  handleTaskOverdue: async () => null,
});

// 任务提供者组件
export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  // 完成任务
  const completeTask = async (taskId: number) => {
    try {
      setLoading(true);
      
      // 调用完成任务服务
      const updatedTask = await taskService.completeTask(taskId);
      
      if (updatedTask) {
        // 更新本地任务列表
        const updatedTasks = tasks.map(task => 
          task.id === taskId ? updatedTask : task
        );
        setTasks(updatedTasks);
        
        // 如果任务是循环的并且已重新开始，显示成功消息
        if (updatedTask.isRecurring && updatedTask.isActive) {
          Alert.alert('任务已完成', '已生成下一个周期的任务');
        } else {
          // 一次性任务完成后标记为已完成
          Alert.alert('任务已完成', '恭喜你完成了任务！');
        }
      }
      
      return updatedTask;
    } catch (error) {
      console.error('完成任务时出错:', error);
      Alert.alert('错误', '完成任务时出错');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 处理任务逾期
  const handleTaskOverdue = async (taskId: number, action: 'reset' | 'continue' | 'skip') => {
    try {
      setLoading(true);
      let updatedTask = null;
      
      switch (action) {
        case 'reset':
          // 以当前时间重置任务
          updatedTask = await taskService.resetTaskWithCurrentTime(taskId);
          if (updatedTask) {
            Alert.alert('任务已重置', '任务已使用当前时间重新开始');
          }
          break;
          
        case 'continue':
          // 自动计算下一周期
          updatedTask = await taskService.continueToNextCycle(taskId);
          if (updatedTask) {
            Alert.alert('任务已更新', '已自动计算并进入下一周期');
          }
          break;
          
        case 'skip':
          // 跳过当前周期，标记为已完成但不做任何事
          updatedTask = await taskService.skipCurrentCycle(taskId);
          if (updatedTask) {
            Alert.alert('已跳过', '当前周期已跳过，任务已更新');
          }
          break;
      }
      
      if (updatedTask) {
        // 更新本地任务列表
        const updatedTasks = tasks.map(task => 
          task.id === taskId ? updatedTask : task
        );
        setTasks(updatedTasks);
      }
      
      return updatedTask;
    } catch (error) {
      console.error('处理逾期任务时出错:', error);
      Alert.alert('错误', '处理逾期任务时出错');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return (
    <TaskContext.Provider value={{ 
      tasks, 
      loading, 
      setTasks, 
      completeTask, 
      handleTaskOverdue 
    }}>
      {children}
    </TaskContext.Provider>
  );
};

// 使用任务的钩子
export const useTask = () => useContext(TaskContext);

// 默认导出上下文
export default TaskContext; 