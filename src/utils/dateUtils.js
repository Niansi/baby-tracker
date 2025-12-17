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

