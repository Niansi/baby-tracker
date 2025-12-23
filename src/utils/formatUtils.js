// 格式化持续时间（毫秒）为 H:MM:SS
export const formatDuration = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
};

/**
 * 格式化毫秒为中文持续时间（例如：1小时25分钟）- 仅显示小时/分钟，用于描述/距离上次记录的时间
 */
export const formatDurationChinese = (ms) => {
    if (ms === null || ms === undefined || ms < 0) return '未开始';
    
    // Less than 1 minute - display in seconds
    if (ms < 60000) return `${Math.max(1, Math.round(ms / 1000))}秒`; 

    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    let result = '';
    if (hours > 0) {
        result += `${hours}小时`;
    }
    if (minutes > 0) {
        result += `${minutes}分钟`;
    }
    return result || '不足1分钟'; 
};

/**
 * 格式化毫秒为中文经过时间（H/M/S），用于实时显示（例如：1小时3分钟5秒）
 */
export const formatElapsedChineseHMS = (ms) => {
    if (ms === null || ms === undefined || ms < 0) return '未知时间';
    
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let result = '';
    if (hours > 0) {
        result += `${hours}小时`;
    }
    // Always show minutes if hours > 0, or if minutes > 0
    if (minutes > 0 || hours > 0) { 
        result += `${minutes}分钟`;
    }
    // Always show seconds for the real-time effect
    result += `${seconds}秒`;
    
    return result;
};

/**
 * 格式化毫秒为中文经过时间（仅显示小时/分钟，不显示秒）
 * 用于Highlight页面当showSeconds为false时
 */
export const formatElapsedChineseHM = (ms) => {
    if (ms === null || ms === undefined || ms < 0) return '未知时间';
    
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    let result = '';
    if (hours > 0) {
        result += `${hours}小时`;
    }
    // Always show minutes (even if 0 when hours > 0, or show 0 if less than 1 minute)
    if (hours > 0) {
        result += `${minutes}分钟`;
    } else if (minutes > 0) {
        result += `${minutes}分钟`;
    } else {
        result += '0分钟';
    }
    
    return result;
};

/**
 * 格式化毫秒为中文经过时间，根据showSeconds参数决定是否显示秒
 * @param {number} ms - 毫秒数
 * @param {boolean} showSeconds - 是否显示秒
 * @returns {string} 格式化后的时间字符串
 */
export const formatElapsedChinese = (ms, showSeconds = false) => {
    if (ms === null || ms === undefined || ms < 0) return '未知时间';
    
    if (showSeconds) {
        return formatElapsedChineseHMS(ms);
    } else {
        return formatElapsedChineseHM(ms);
    }
};

/**
 * 从 Tailwind 颜色类名提取颜色值
 * @param {string} colorClass - 颜色类名，如 'bg-blue-600'
 * @returns {string} 颜色值，如 '#2563EB'
 */
export const getColorFromClass = (colorClass) => {
  const colorMap = {
    'blue': { 600: '#2563EB', 700: '#1D4ED8' },
    'indigo': { 600: '#4F46E5', 700: '#4338CA' },
    'purple': { 600: '#7C3AED', 700: '#6D28D9' },
    'amber': { 600: '#D97706', 700: '#B45309' },
    'yellow': { 600: '#CA8A04', 700: '#A16207' },
    'gray': { 600: '#4B5563', 700: '#374151' },
    'orange': { 600: '#D97706', 700: '#B45309' },
    'green': { 600: '#059669', 700: '#047857' },
    'red': { 600: '#DC2626', 700: '#B91C1C' },
    'pink': { 600: '#EC4899', 700: '#BE185D' },
  };
  
  // 提取颜色名和色阶
  const match = colorClass.match(/bg-(\w+)-(\d+)/);
  if (match) {
    const colorName = match[1];
    const shade = parseInt(match[2]);
    return colorMap[colorName]?.[shade] || colorMap[colorName]?.[600] || '#2563EB';
  }
  
  return '#2563EB'; // 默认颜色
};

