# 🍼 Baby Tracker - 婴儿护理记录应用

这是一个功能完整的React婴儿护理记录应用，支持多婴儿管理、活动记录、计时器等功能。

## 📱 功能特色

- **多婴儿管理**：可创建和管理多个婴儿的独立记录
- **自定义活动类型**：支持自定义活动（喂养、睡眠、换尿片等）
- **智能计时器**：实时计时功能，支持开始/停止
- **数据持久化**：使用LocalStorage本地存储，数据不丢失
- **时间线记录**：清晰的时间线展示所有记录
- **高亮提醒**：支持设置首页高亮活动，智能提醒
- **响应式设计**：完美适配手机和桌面端

## 🚀 快速开始

### 1. 安装Node.js
确保你的系统已安装Node.js (版本14+)：
```bash
node --version
npm --version
```

### 2. 安装依赖
```bash
cd baby-tracker
npm install
```

### 3. 启动开发服务器
```bash
npm run dev
```

### 4. 打开浏览器
访问 `http://localhost:5173`

## 📁 项目结构
```
baby-tracker/
├── src/
│   ├── App.jsx          # 主应用组件
│   ├── main.jsx         # 入口文件
│   └── index.css        # 样式文件
├── index.html           # HTML模板
├── package.json         # 项目配置
├── vite.config.js       # Vite配置
├── tailwind.config.js   # Tailwind配置
└── postcss.config.js    # PostCSS配置
```

## 💡 使用指南

### 创建婴儿记录
1. 点击首页右上角的「+」按钮
2. 输入婴儿昵称和开始日期
3. 选择图标和主题颜色
4. 保存即可开始记录

### 添加活动记录
- **快速记录**：点击活动按钮直接记录（适用于次数型活动）
- **数值输入**：输入具体数值（适用于奶量、体重等）
- **计时器**：开始/停止计时（适用于睡眠、喂奶等持续活动）

### 管理活动类型
1. 点击婴儿信息卡片上的设置按钮
2. 可以：
   - 添加新的活动类型
   - 编辑现有活动
   - 开启/关闭首页显示
   - 设置首页高亮提醒（最多3个）

### 查看记录
- 点击底部导航的「记录」标签
- 查看所有记录的时间线
- 点击记录可编辑或删除

## 🛠️ 技术栈

- **React 18** - 现代化的React开发
- **Vite** - 快速的构建工具
- **Tailwind CSS** - 实用优先的CSS框架
- **Lucide React** - 精美的图标库
- **LocalStorage** - 本地数据持久化

## 📦 构建生产版本

```bash
npm run build
```

构建文件将生成在 `dist/` 目录中。

## 🎨 定制化

### 添加新的活动类型
在 `DEFAULT_ACTIVITY_TYPES` 常量中添加新的活动配置：

```javascript
{
  id: 'unique-id',
  name: '活动名称',
  type: 'count', // 'count' | 'value' | 'duration'
  unit: '单位',
  icon: '图标',
  color: 'bg-blue-600',
  isTimer: false, // 仅duration类型需要
  isActive: true,
  isHighlight: false
}
```

### 自定义样式
项目使用Tailwind CSS，所有样式都在组件中使用Tailwind类名定义。

## 🔧 开发指南

### 热重载
开发服务器支持热重载，修改代码后会自动刷新。

### 代码结构
- `App.jsx` - 主应用组件，包含所有业务逻辑
- 各组件功能明确分离：
  - `Modal` - 通用模态框
  - `HighlightModal` - 高亮提醒模态框
  - `ActivityManagerModal` - 活动管理模态框
  - `BabyManagerModal` - 婴儿管理模态框
  - `HomeScreen` - 首页
  - `RecordsScreen` - 记录页
  - `AnalysisScreen` - 分析页
  - `BottomNav` - 底部导航

## 📝 许可证
MIT License

## 🤝 贡献
欢迎提交Issue和Pull Request！

---

**享受记录宝宝成长的每一天！** 👶✨