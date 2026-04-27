# 视频上传组件 - 表单验证与提交逻辑说明

## 概述

视频上传组件 (`VideoUploader.tsx`) 是少年球探平台第二阶段核心功能之一，提供完整的视频上传、表单填写和提交功能。

## 核心功能

### 1. 视频上传
- **拖拽上传**：支持拖拽文件到上传区域
- **点击选择**：支持点击选择文件
- **多文件上传**：最多支持3个视频同时上传
- **格式验证**：仅支持 MP4、MOV 格式
- **大小限制**：单个文件最大 500MB
- **预览功能**：上传后显示视频缩略图

### 2. 表单填写
- **球员姓名**（必填）
- **比赛名称**（选填）
- **球员位置**（必填，下拉选择）
- **备注说明**（选填）

### 3. 智能表单验证
- **touched 状态跟踪**：只在用户离开字段后才显示错误提示
- **实时错误清除**：用户输入时自动清除对应字段的错误
- **提交前全量验证**：提交时检查所有字段并自动滚动到第一个错误位置
- **字段级错误显示**：每个字段独立的错误提示样式

### 4. 表单自动保存
- **自动保存到 localStorage**：表单数据变化时实时保存
- **智能恢复**：页面刷新或重新打开时自动恢复之前填写的数据
- **提交后清理**：成功提交后清除保存的数据

### 5. 用户体验优化
- **加载状态**：提交按钮显示旋转加载图标，防止重复提交
- **错误滚动**：验证失败时自动滚动到第一个错误字段
- **文件预览**：上传的视频显示缩略图和文件信息
- **删除功能**：每个上传的视频可以单独删除

### 6. 提交逻辑完善
- **登录检查**：未登录时保存数据并跳转到登录页
- **模拟上传进度**：显示上传进度动画
- **数据传递**：通过 navigate state 传递数据到下一页
- **错误处理**：上传失败时重置状态并显示错误

## 代码结构

```typescript
// 主要状态
const [videos, setVideos] = useState<VideoFile[]>([]);
const [isDragging, setIsDragging] = useState(false);
const [playerName, setPlayerName] = useState('');
const [matchName, setMatchName] = useState('');
const [playerPosition, setPlayerPosition] = useState('');
const [notes, setNotes] = useState('');
const [isSubmitting, setIsSubmitting] = useState(false);
const [errors, setErrors] = useState<FormErrors>({});
const [touched, setTouched] = useState<Record<string, boolean>>({});

// 核心函数
const validateFile = (file: File): string | null => { ... };
const validateForm = (): boolean => { ... };
const addVideo = (file: File) => { ... };
const removeVideo = (id: string) => { ... };
const handleSubmit = async () => { ... };
```

## 使用说明

1. **上传视频**：拖拽文件到上传区域，或点击选择文件
2. **填写信息**：输入球员姓名、选择位置等必填项
3. **提交**：点击"下一步：选择分析师"按钮
4. **自动保存**：表单数据会自动保存，刷新页面不会丢失

## 后续优化建议

1. **对接真实API**：将模拟数据替换为后端真实接口
2. **视频压缩**：上传前自动压缩视频，减少传输时间
3. **断点续传**：大视频支持断点续传，避免网络中断导致重新上传
4. **图片预览**：生成视频封面图，优化列表展示效果