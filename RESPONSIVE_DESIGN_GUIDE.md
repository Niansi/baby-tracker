# 响应式设计适配指南

## 📱 设备分辨率分类

### iPhone 系列
- **iPhone SE / 8**: 375×667 (逻辑分辨率)
- **iPhone 12/13/14**: 390×844
- **iPhone 12/13/14 Pro Max**: 428×926
- **iPhone 14 Pro**: 393×852
- **iPhone 15 Plus**: 430×932

### iPad 系列
- **iPad Mini**: 768×1024 (竖屏) / 1024×768 (横屏)
- **iPad / iPad Air**: 820×1180 (竖屏) / 1180×820 (横屏)
- **iPad Pro 11"**: 834×1194 (竖屏) / 1194×834 (横屏)
- **iPad Pro 12.9"**: 1024×1366 (竖屏) / 1366×1024 (横屏)

### 桌面端
- **小屏笔记本**: 1024×768 及以上
- **桌面显示器**: 1280×720, 1920×1080, 2560×1440 等

## 🎯 Tailwind CSS 断点系统

Tailwind 使用移动优先（Mobile First）的响应式设计策略：

```javascript
// Tailwind 默认断点
{
  'sm': '640px',   // 小屏设备（大屏手机、小平板）
  'md': '768px',   // 中等设备（平板竖屏）
  'lg': '1024px',  // 大屏设备（平板横屏、小桌面）
  'xl': '1280px',  // 超大屏（桌面）
  '2xl': '1536px'  // 超超大屏（大桌面）
}
```

## 📐 适配策略

### 1. **移动优先设计**
- 先设计手机端（默认样式）
- 使用 `sm:`, `md:`, `lg:` 等前缀逐步增强大屏体验

### 2. **设备类型判断**
```javascript
// 方法1: 使用 CSS 媒体查询
@media (min-width: 768px) and (max-width: 1024px) {
  /* iPad 竖屏 */
}

// 方法2: 使用 JavaScript 检测
const isTablet = window.innerWidth >= 768 && window.innerWidth <= 1024;
const isDesktop = window.innerWidth > 1024;
```

### 3. **布局策略**

#### 手机端（< 640px）
- 单列布局
- 全屏宽度
- 紧凑间距

#### 平板端（768px - 1024px）
- 多列布局（2-3列）
- 适中的最大宽度
- 更大的触摸目标

#### 桌面端（> 1024px）
- 多列布局（3-4列）
- 居中容器，限制最大宽度
- 悬停效果

## 🛠️ 实际应用示例

### 容器宽度适配
```jsx
// ❌ 错误：固定宽度
<div className="w-[390px]">...</div>

// ✅ 正确：响应式宽度
<div className="w-full max-w-sm mx-auto md:max-w-2xl lg:max-w-4xl">
  {/* 手机：全宽
      平板：最大 672px
      桌面：最大 896px */}
</div>
```

### 网格布局适配
```jsx
// 手机：2列，平板：3列，桌面：4列
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {items.map(item => <Item key={item.id} />)}
</div>
```

### 字体大小适配
```jsx
// 手机：小字体，平板/桌面：大字体
<h1 className="text-2xl md:text-3xl lg:text-4xl">标题</h1>
```

### 间距适配
```jsx
// 手机：小间距，平板/桌面：大间距
<div className="p-4 md:p-6 lg:p-8">内容</div>
```

## 🎨 针对当前项目的适配建议

### 1. 移除固定尺寸
- 移除 `sm:w-[390px]` 和 `sm:h-[844px]`
- 使用响应式最大宽度

### 2. 条件显示 iPhone 框架
- 只在手机端显示 iPhone 模拟框架
- iPad/桌面端显示原生界面

### 3. 优化布局
- 手机：3列网格
- iPad：4-5列网格
- 桌面：6列网格

### 4. 内容区域优化
- 手机：紧凑布局
- iPad：更宽松的间距
- 桌面：居中容器，限制最大宽度

