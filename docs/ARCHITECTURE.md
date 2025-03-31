# NeverMiss应用架构

本文档详细介绍了NeverMiss项目的架构设计、技术选择和实现思路，帮助开发者理解项目的整体结构和设计原则。

## 架构概览

NeverMiss采用修改版的MVC(Model-View-Controller)架构，结合React Native的组件化特性，同时增加了服务层（Services）来处理与外部系统的交互。整体架构如下：

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│    Models   │◄────►│ Controllers │◄────►│    Views    │
└─────────────┘      └─────────┬───┘      └─────────────┘
                             │
                     ┌───────▼───────┐
                     │    Services   │
                     └───────────────┘
```

### 主要层次

- **模型层 (Models)**: 定义数据结构、类型和业务实体
- **视图层 (Views)**: 组件和屏幕，负责UI展示和用户交互
- **控制器层 (Controllers)**: 处理应用的业务逻辑，协调模型和视图
- **服务层 (Services)**: 处理与外部系统的交互，如数据存储、API调用、通知等

## 数据流向

NeverMiss采用单向数据流，确保应用状态的可预测性和可维护性：

```
User Action → Controller → Service → Model → View → User
```

1. 用户在视图层执行操作（如创建任务）
2. 控制器接收操作并调用相应的服务
3. 服务执行操作（如存储数据）并更新模型
4. 模型变化通知视图层更新
5. 视图层重新渲染，展示最新的数据状态

## 核心技术栈

### 前端框架

- **React Native**: 跨平台移动应用开发框架
- **Expo**: 简化React Native开发的工具和服务集合
- **TypeScript**: 添加静态类型检查，提高代码质量和可维护性

### 状态管理

- **React Context API**: 全局状态管理，如主题、语言设置等
- **React Hooks**: 组件内部状态管理（useState, useEffect等）

### 路由和导航

- **Expo Router**: 基于文件系统的路由管理
- **React Navigation**: 屏幕导航管理（通过Expo Router集成）

### 数据存储

- **AsyncStorage**: 本地键值对数据存储
- **JSON序列化/反序列化**: 数据转换和持久化

### 外部系统集成

- **Expo Notifications**: 本地和推送通知管理
- **Expo Calendar**: 与设备日历应用集成

## 关键组件

### 模型层

```
models/
├── Task.ts          # 任务模型，定义任务的数据结构和类型
├── TaskCycle.ts     # 任务周期模型，管理任务的重复周期
└── TaskHistory.ts   # 任务历史记录模型，跟踪任务状态变化
```

### 视图层

```
components/          # 可复用UI组件
└── TaskList.tsx     # 任务列表组件

screens/             # 应用程序页面
├── TaskListScreen.tsx   # 任务列表页面
└── TaskFormScreen.tsx   # 任务创建/编辑页面
```

### 服务层

```
services/
├── taskService.ts       # 任务管理服务
├── storageService.ts    # 本地存储服务
├── notificationService.ts    # 通知服务
└── calendarService.ts   # 日历集成服务
```

## 关键功能实现

### 任务管理

任务管理是应用的核心功能，主要通过以下组件实现：

1. **Task模型**: 定义任务的数据结构，包括标题、描述、日期和重复设置等
2. **TaskService服务**: 提供创建、更新、删除和查询任务的方法
3. **TaskFormScreen**: 任务创建和编辑界面
4. **TaskListScreen**: 任务列表展示界面

### 循环任务

循环任务通过RecurrencePattern模型和CycleCalculator服务实现：

1. **RecurrencePattern**: 定义任务的重复模式，支持每日、每周、每月和自定义周期
2. **CycleCalculator**: 根据重复模式计算任务的下一个周期
3. **TaskCycle模型**: 管理任务的单个周期实例

### 提醒系统

提醒系统通过以下组件实现：

1. **NotificationService**: 管理本地通知的创建、更新和取消
2. **BackgroundTaskService**: 管理后台任务，定期检查未完成任务

### 数据存储

应用采用离线优先的架构，所有数据都存储在本地：

1. **StorageService**: 封装AsyncStorage，提供数据的CRUD操作
2. **ExportService**: 提供数据导出功能
3. **ImportDataFromJSON**: 支持从JSON文件导入数据

## 设计模式应用

NeverMiss项目中应用了多种设计模式，确保代码的可维护性和可扩展性：

### 单例模式

服务类通常采用单例模式，确保全局只有一个实例：

```typescript
// 单例服务示例
class NotificationService {
  private static instance: NotificationService;
  
  private constructor() {
    // 初始化代码
  }
  
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }
  
  // 服务方法...
}
```

### 工厂模式

用于创建任务和任务周期的工厂方法：

```typescript
// 工厂方法示例
export function createTask(input: CreateTaskInput): Task {
  // 创建和返回任务实例
}

export function createTaskCycle(task: Task): TaskCycle {
  // 创建和返回任务周期实例
}
```

### 策略模式

任务周期计算器使用策略模式，根据不同的重复类型采用不同的计算策略：

```typescript
// 策略模式示例
interface CycleCalculationStrategy {
  calculateNextCycle(currentCycle: TaskCycle): TaskCycle;
}

class DailyCycleStrategy implements CycleCalculationStrategy {
  calculateNextCycle(currentCycle: TaskCycle): TaskCycle {
    // 计算每日循环的下一个周期
  }
}

class WeeklyCycleStrategy implements CycleCalculationStrategy {
  calculateNextCycle(currentCycle: TaskCycle): TaskCycle {
    // 计算每周循环的下一个周期
  }
}
```

### 观察者模式

通过React Context实现状态变化的观察者模式：

```typescript
// 观察者模式示例 (通过React Context)
const TaskContext = createContext<TaskContextValue>({
  tasks: [],
  addTask: () => {},
  updateTask: () => {},
  deleteTask: () => {},
});

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // 当任务变化时通知订阅者（组件）
  
  return (
    <TaskContext.Provider value={{ tasks, addTask, updateTask, deleteTask }}>
      {children}
    </TaskContext.Provider>
  );
}
```

## 性能优化

NeverMiss采用多种策略确保应用性能：

1. **惰性加载**: 只在需要时加载组件和数据
2. **列表优化**: 使用FlatList代替ScrollView渲染长列表
3. **记忆化**: 使用React.memo、useMemo和useCallback优化渲染性能
4. **异步操作**: 大型数据操作在后台线程执行，避免阻塞UI线程

## 可扩展性考虑

NeverMiss的架构设计考虑了未来的可扩展性：

1. **模块化设计**: 各功能模块松耦合，可以独立扩展
2. **抽象服务层**: 服务层抽象了与外部系统的交互，便于更换底层实现
3. **类型系统**: TypeScript的类型系统确保代码更改的安全性

## 总结

NeverMiss采用修改版的MVC架构，结合React Native的生态系统，实现了一个高效、可靠的任务管理应用。通过清晰的职责划分和松耦合的模块设计，确保了代码的可维护性和可扩展性，能够适应未来的功能扩展和技术演进。 