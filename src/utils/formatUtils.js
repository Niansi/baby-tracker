// 格式化持续时间（毫秒）为 H:MM:SS
export const formatDuration = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const parts = [
      hours > 0 ? `${hours}:` : '',
      minutes.toString().padStart(hours > 0 ? 2 : 1, '0'),
      seconds.toString().padStart(2, '0')
  ];
  return parts.join(':');
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

