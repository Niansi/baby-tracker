// ID 生成器
export const generateId = () => Math.random().toString(36).substr(2, 9);

// 可用的图标和颜色
export const CUSTOM_ICONS = ['👶', '👧', '👦', '🍼', '🐣', '🧸', '🌙', '☕', '🚬', '💩', '💧', '🍎', '🏃', '📚', '💊', '🧘', '💸', '🐶', '🐱', '🧷', '🤱', '🛁'];
export const CUSTOM_COLORS = [
    'bg-blue-600', 'bg-purple-600', 'bg-orange-600', 'bg-green-600', 
    'bg-red-600', 'bg-yellow-600', 'bg-pink-600', 'bg-gray-700'
]; // Use darker colors for buttons

// 默认活动类型
export const DEFAULT_ACTIVITY_TYPES = [
    { id: 'a-feeding-bottle', name: '奶瓶喂养', type: 'value', unit: 'ml', icon: '🍼', color: 'bg-blue-600', isTimer: false, isActive: true, isHighlight: false, order: 0 },
    { id: 'a-feeding-breast', name: '母乳亲喂', type: 'duration', unit: '分钟', icon: '🤱', color: 'bg-indigo-600', isTimer: true, isActive: true, isHighlight: false, order: 1 },
    { id: 'a-sleep', name: '睡觉', type: 'duration', unit: '分钟', icon: '🌙', color: 'bg-purple-600', isTimer: true, isActive: true, isHighlight: true, order: 2 }, // Default HL
    { id: 'a-poop', name: '臭臭', type: 'count', unit: '次', icon: '💩', color: 'bg-amber-600', isTimer: false, isActive: true, isHighlight: false, order: 3 },
    { id: 'a-diaper', name: '换尿片', type: 'count', unit: '次', icon: '🧷', color: 'bg-yellow-600', isTimer: false, isActive: true, isHighlight: false, order: 4 },
    { id: 'a-smoke', name: '抽烟', type: 'count', unit: '次', icon: '🚬', color: 'bg-gray-600', isTimer: false, isActive: true, isHighlight: false, order: 5 },
];

