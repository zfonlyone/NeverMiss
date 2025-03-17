-- 添加日期类型字段到 tasks 表
ALTER TABLE tasks ADD COLUMN date_type TEXT NOT NULL DEFAULT 'solar' CHECK (date_type IN ('solar', 'lunar'));

-- 添加日期类型字段到 task_cycles 表
ALTER TABLE task_cycles ADD COLUMN date_type TEXT NOT NULL DEFAULT 'solar' CHECK (date_type IN ('solar', 'lunar')); 