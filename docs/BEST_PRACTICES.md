# NeverMiss 项目最佳实践

本文档总结了NeverMiss项目开发中的最佳实践和常见错误，帮助开发者避免重复错误并提高代码质量。

## 代码组织最佳实践

### 存储键常量管理

✅ **正确做法**:
- 所有AsyncStorage存储键常量必须定义在 `app/utils/storage.ts` 文件中的 `STORAGE_KEYS` 对象内
- 按照功能分组，如任务相关、设置相关等
- 为每个键添加注释说明其用途
- 使用时通过导入 `STORAGE_KEYS` 对象获取

```typescript
// ✅ 正确示例 - 在utils/storage.ts中定义
export const STORAGE_KEYS = {
  // 任务相关
  TASKS: 'tasks',                  // 所有任务的存储键
  TASK_CYCLES: 'task_cycles',      // 任务循环周期的存储键
  // ...其他键
};

// ✅ 正确使用方式 - 在服务中
import { STORAGE_KEYS } from '../utils/storage';

export const saveTask = async (task) => {
  await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
};
```

❌ **错误做法**:
- 创建新的常量文件如 `constants/storageKeys.ts`
- 在多个文件中重复定义存储键
- 使用字符串字面量而非常量

```typescript
// ❌ 错误示例 - 不要创建新的常量文件
// constants/storageKeys.ts
export const STORAGE_KEYS = { ... };

// ❌ 错误示例 - 直接使用字符串字面量
await AsyncStorage.getItem('tasks');
```

**原因**: 集中管理存储键可以避免拼写错误、重复定义以及不一致的命名。这也使得更改键名变得容易，因为只需在一个地方修改。

### 文件和文件夹位置

✅ **正确做法**:
- 遵循项目结构文档中的规定
- 在相应的文件夹中放置文件：
  - 组件 → `app/components/`
  - 页面 → `app/screens/`
  - 服务 → `app/services/`
  - 工具 → `app/utils/`
  - 模型 → `app/models/`

❌ **错误做法**:
- 在未经许可的情况下创建新的文件夹
- 将文件放置在错误的目录中
- 不遵循项目的文件命名规范

**原因**: 一致的项目结构使团队协作更高效，让新开发者能更容易理解和导航代码库。

## 组件开发最佳实践

### 状态管理

✅ **正确做法**:
- 状态尽可能靠近其使用位置
- 使用Context API进行全局状态管理
- 复杂组件拆分成小的、可测试的组件

❌ **错误做法**:
- 在组件之间传递过多的props
- 在组件中直接操作全局状态

### 性能优化

✅ **正确做法**:
- 使用React.memo防止不必要的重渲染
- 使用useCallback记忆事件处理函数
- 使用useMemo缓存计算结果

❌ **错误做法**:
- 在渲染函数中创建函数或对象
- 不必要的状态更新导致重渲染

## 错误处理最佳实践

✅ **正确做法**:
- 使用try-catch块处理异步操作
- 提供友好的错误提示
- 记录错误以便调试

❌ **错误做法**:
- 忽略错误处理
- 不提供用户友好的错误信息

---

遵循这些最佳实践，可以提高代码质量，减少bug，改善团队协作，并提供更好的用户体验。 