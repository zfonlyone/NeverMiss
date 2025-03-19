# NeverMiss 应用架构说明

## 总体架构

NeverMiss采用修改版的MVC架构，结合了React Native的组件化特性，主要包括以下部分：

```
+----------------+        +----------------+        +----------------+
|                |        |                |        |                |
|   视图层       |        |   控制器层     |        |   服务层       |
|                |<------>|                |<------>|                |
| (Components,   |        | (Controllers)  |        | (Services)     |
|  Screens)      |        |                |        |                |
+----------------+        +----------------+        +----------------+
        ^                         ^                         ^
        |                         |                         |
        v                         v                         v
+----------------+        +----------------+        +----------------+
|                |        |                |        |                |
|   上下文       |        |   模型         |        |   工具         |
|                |        |                |        |                |
| (Contexts)     |        | (Models)       |        | (Utils)        |
|                |        |                |        |                |
+----------------+        +----------------+        +----------------+
```

## 核心模块说明

### 1. 视图层 (View Layer)

视图层负责用户界面的展示和基础交互，包括：

- **组件 (Components)**: 可复用的UI组件，如任务项、标签选择器等
- **屏幕 (Screens)**: 完整的应用页面，如主页、设置页等
- **应用结构 (App)**: 使用Expo Router实现的应用导航结构

视图层的责任：
- 渲染用户界面
- 捕获用户输入
- 调用控制器处理业务逻辑
- 响应模型变化

代码示例：
```tsx
// 视图层组件示例
const TaskItem = ({ task, onComplete, onEdit, onDelete }) => {
  return (
    <View style={styles.container}>
      <Text>{task.title}</Text>
      <View style={styles.actions}>
        <Button onPress={() => onComplete(task.id)} title="完成" />
        <Button onPress={() => onEdit(task)} title="编辑" />
        <Button onPress={() => onDelete(task.id)} title="删除" />
      </View>
    </View>
  );
};
```

### 2. 控制器层 (Controller Layer)

控制器层处理业务逻辑，作为视图和服务层之间的桥梁：

- **TaskController**: 处理任务的CRUD操作和状态更新
- **CalendarController**: 处理日历事件的创建和管理
- **NotificationController**: 处理通知的创建和触发
- **TagController**: 处理任务标签的管理

控制器层的责任：
- 处理业务逻辑
- 调用服务层进行数据操作
- 转换数据格式，满足视图层需求
- 管理异步操作状态

代码示例：
```ts
// 控制器示例
export const loadTasks = async (): Promise<ExtendedTask[]> => {
  try {
    const tasks = await taskService.getAllTasks();
    return tasks.map(task => {
      const cycles = taskService.getTaskCycles(task.id);
      return {
        ...task,
        currentCycle: findCurrentCycle(cycles),
        upcomingDate: getNextOccurrence(task),
        isActive: task.isActive
      };
    });
  } catch (error) {
    console.error('Error loading tasks:', error);
    return [];
  }
};
```

### 3. 服务层 (Service Layer)

服务层负责数据持久化和与外部系统交互：

- **taskService**: 处理任务数据的存储和检索
- **notificationService**: 管理系统通知
- **calendarService**: 与设备日历集成
- **storageService**: 管理本地存储和数据同步

服务层的责任：
- 数据持久化
- 外部API调用
- 外部系统集成
- 数据格式转换

代码示例：
```ts
// 服务层示例
export const getAllTasks = async (): Promise<Task[]> => {
  try {
    const tasksJSON = await AsyncStorage.getItem('tasks');
    if (!tasksJSON) return [];
    return JSON.parse(tasksJSON);
  } catch (error) {
    console.error('Error retrieving tasks:', error);
    throw error;
  }
};
```

### 4. 模型层 (Model Layer)

模型层定义数据结构和类型：

- **Task**: 任务基础数据结构
- **TaskCycle**: 任务周期数据结构
- **ExtendedTask**: 增强版任务数据结构，包含计算属性

代码示例：
```ts
// 模型示例
export interface Task {
  id: string;
  title: string;
  description?: string;
  recurrencePattern: RecurrencePattern;
  startDate: string;
  isLunar: boolean;
  isActive: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskCycle {
  id: string;
  taskId: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'completed' | 'skipped';
  completedAt?: string;
}

export interface ExtendedTask extends Task {
  currentCycle?: TaskCycle;
  upcomingDate?: string;
}
```

### 5. 辅助模块

- **Contexts**: 提供跨组件的状态管理，如主题、语言设置等
- **Utils**: 提供通用工具函数，如日期转换、工具函数等
- **Hooks**: 提供自定义React Hooks，封装可复用逻辑
- **Constants**: 定义应用常量，如配置参数、枚举值等

## 数据流

NeverMiss采用单向数据流，数据流动遵循以下路径：

1. 用户在视图层操作触发事件
2. 事件调用控制器层的方法
3. 控制器层处理业务逻辑，调用服务层
4. 服务层执行数据操作并返回结果
5. 控制器层处理结果并更新相关状态
6. 状态变化触发视图层重新渲染

```
+----------------+       +----------------+       +----------------+
|                |       |                |       |                |
|   用户操作     |------>|   控制器处理   |------>|   服务调用     |
|                |       |                |       |                |
+----------------+       +----------------+       +----------------+
       ^                                                  |
       |                                                  v
+----------------+       +----------------+       +----------------+
|                |       |                |       |                |
|   视图更新     |<------|   状态更新     |<------|   数据返回     |
|                |       |                |       |                |
+----------------+       +----------------+       +----------------+
```

## 状态管理

NeverMiss主要使用以下状态管理方案：

1. **React Context**: 用于全局状态管理，如主题、语言设置
2. **组件内状态**: 使用React的useState和useReducer管理组件内部状态
3. **AsyncStorage**: 用于数据持久化

全局状态通过Context Provider传递给应用组件树，局部状态由各组件自行管理。 