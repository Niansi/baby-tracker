// 格式化时间为 HH:mm
export const formatTime = (date) => new Date(date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });

// 格式化日期为 YYYY-MM-DD
export const formatDateKey = (date) => new Date(date).toISOString().split('T')[0];

// 计算天数差
export const calculateDaysOld = (startDateStr) => {
    if (!startDateStr) return 'N/A';
    const start = new Date(startDateStr);
    const today = new Date();
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(today.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays > 0 ? diffDays : 0; 
};

// 格式化年龄显示：xx年xx个月x天，整年时省略个月/天，整月时省略天
export const formatAge = (startDateStr) => {
    if (!startDateStr) return 'N/A';
    const start = new Date(startDateStr);
    const today = new Date();
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    let years = today.getFullYear() - start.getFullYear();
    let months = today.getMonth() - start.getMonth();
    let days = today.getDate() - start.getDate();
    
    // 调整月份和天数
    if (days < 0) {
        months--;
        const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        days += lastMonth.getDate();
    }
    
    if (months < 0) {
        years--;
        months += 12;
    }
    
    // 如果开始日期晚于今天，返回0
    if (years < 0 || (years === 0 && months < 0) || (years === 0 && months === 0 && days < 0)) {
        return '0天';
    }
    
    // 构建显示文本
    let parts = [];
    
    if (years > 0) {
        parts.push(`${years}年`);
    }
    
    if (months > 0) {
        parts.push(`${months}个月`);
    }
    
    if (days > 0) {
        parts.push(`${days}天`);
    }
    
    // 如果所有都是0，显示1天
    if (parts.length === 0) {
        return '1天';
    }
    
    return parts.join('');
};

/**
 * 获取最近N天的日期范围
 * @param {number} days - 天数
 * @returns {Object} { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
 */
export const getDateRange = (days) => {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);
    
    return {
        startDate: formatDateKey(startDate),
        endDate: formatDateKey(endDate)
    };
};

/**
 * 格式化日期显示（今天、昨天、具体日期）
 * @param {string} dateStr - 日期字符串 (YYYY-MM-DD)
 * @returns {string} 格式化后的日期显示
 */
export const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);
    
    if (targetDate.getTime() === today.getTime()) {
        return '今天';
    } else if (targetDate.getTime() === yesterday.getTime()) {
        return '昨天';
    } else {
        const month = targetDate.getMonth() + 1;
        const day = targetDate.getDate();
        return `${month}月${day}日`;
    }
};

