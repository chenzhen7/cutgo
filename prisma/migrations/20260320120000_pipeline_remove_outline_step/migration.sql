-- 移除「分集大纲」独立步骤后，将项目进度从 6 步压缩为 5 步
UPDATE Project SET
  step = CASE
    WHEN step <= 1 THEN step
    WHEN step <= 3 THEN 2
    ELSE step - 1
  END,
  stepLabel = CASE
    WHEN step <= 1 THEN stepLabel
    WHEN step <= 3 THEN '剧本生成'
    WHEN step = 4 THEN '分镜生成'
    WHEN step = 5 THEN '视频合成'
    WHEN step >= 6 THEN '导出发布'
    ELSE stepLabel
  END;
