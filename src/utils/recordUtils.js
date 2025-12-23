/**
 * 查找指定活动的最后一条记录
 * @param {Array} records - 所有记录
 * @param {string} babyId - 当前婴儿 ID
 * @param {string} activityId - 活动类型 ID
 * @returns {Object|undefined} 最新的记录对象
 */
export const getLastRecord = (records, babyId, activityId) => {
    return records
        .filter(r => r.babyId === babyId && r.activityTypeId === activityId)
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))[0];
};

/**
 * 按时间范围过滤记录
 * @param {Array} records - 所有记录
 * @param {string} startDate - 开始日期 (YYYY-MM-DD)
 * @param {string} endDate - 结束日期 (YYYY-MM-DD)
 * @returns {Array} 过滤后的记录数组
 */
export const getRecordsByDateRange = (records, startDate, endDate) => {
    if (!startDate || !endDate) return records;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // 包含结束日期的整天
    
    return records.filter(record => {
        const recordDate = new Date(record.startTime);
        return recordDate >= start && recordDate <= end;
    });
};

/**
 * 计算每日记录数量
 * @param {Array} records - 记录数组
 * @returns {Array} 每日记录数量数组，格式: [{ date: 'YYYY-MM-DD', count: number }]
 */
export const getDailyRecordCounts = (records) => {
    const dailyCounts = {};
    
    records.forEach(record => {
        const dateKey = new Date(record.startTime).toISOString().split('T')[0];
        dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
    });
    
    return Object.entries(dailyCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * 按活动类型统计
 * @param {Array} records - 记录数组
 * @param {Object} activityMap - 活动映射对象 { activityId: activity }
 * @returns {Object} 统计结果 { activityId: { count, totalDuration, totalValue } }
 */
export const getActivityTypeStats = (records, activityMap) => {
    const stats = {};
    
    records.forEach(record => {
        const activityId = record.activityTypeId;
        const activity = activityMap[activityId];
        
        if (!activity) return;
        
        if (!stats[activityId]) {
            stats[activityId] = {
                count: 0,
                totalDuration: 0,
                totalValue: 0,
                activity
            };
        }
        
        stats[activityId].count += 1;
        
        if (activity.type === 'duration' && record.duration) {
            stats[activityId].totalDuration += record.duration;
        }
        
        if (activity.type === 'value' && record.value) {
            stats[activityId].totalValue += record.value;
        }
    });
    
    return stats;
};

/**
 * 计算时长类活动的时间序列数据
 * @param {Array} records - 记录数组
 * @param {Object} activityMap - 活动映射对象
 * @param {string} startDate - 开始日期
 * @param {string} endDate - 结束日期
 * @returns {Array} 时间序列数据 [{ date, [activityId]: duration }]
 */
export const getDurationTrends = (records, activityMap, startDate, endDate) => {
    const filteredRecords = getRecordsByDateRange(records, startDate, endDate);
    const durationActivities = Object.values(activityMap).filter(a => a.type === 'duration');
    
    // 生成日期范围
    const dateMap = {};
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        dateMap[dateKey] = {};
        durationActivities.forEach(activity => {
            dateMap[dateKey][activity.id] = 0;
        });
    }
    
    // 聚合每日数据
    filteredRecords.forEach(record => {
        const activity = activityMap[record.activityTypeId];
        if (!activity || activity.type !== 'duration' || !record.duration) return;
        
        const dateKey = new Date(record.startTime).toISOString().split('T')[0];
        if (dateMap[dateKey]) {
            dateMap[dateKey][activity.id] = (dateMap[dateKey][activity.id] || 0) + record.duration;
        }
    });
    
    // 转换为数组并计算累计值
    const result = [];
    let cumulative = {};
    durationActivities.forEach(activity => {
        cumulative[activity.id] = 0;
    });
    
    Object.entries(dateMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([date, values]) => {
            const dayData = { date };
            durationActivities.forEach(activity => {
                cumulative[activity.id] += values[activity.id] || 0;
                dayData[activity.id] = cumulative[activity.id];
            });
            result.push(dayData);
        });
    
    return result;
};

/**
 * 计算数值类活动的时间序列数据
 * @param {Array} records - 记录数组
 * @param {Object} activityMap - 活动映射对象
 * @param {string} startDate - 开始日期
 * @param {string} endDate - 结束日期
 * @returns {Array} 时间序列数据 [{ date, [activityId]: value }]
 */
export const getValueTrends = (records, activityMap, startDate, endDate) => {
    const filteredRecords = getRecordsByDateRange(records, startDate, endDate);
    const valueActivities = Object.values(activityMap).filter(a => a.type === 'value');
    
    // 生成日期范围
    const dateMap = {};
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        dateMap[dateKey] = {};
        valueActivities.forEach(activity => {
            dateMap[dateKey][activity.id] = 0;
        });
    }
    
    // 聚合每日数据
    filteredRecords.forEach(record => {
        const activity = activityMap[record.activityTypeId];
        if (!activity || activity.type !== 'value' || record.value === undefined) return;
        
        const dateKey = new Date(record.startTime).toISOString().split('T')[0];
        if (dateMap[dateKey]) {
            dateMap[dateKey][activity.id] = (dateMap[dateKey][activity.id] || 0) + record.value;
        }
    });
    
    // 转换为数组并计算累计值
    const result = [];
    let cumulative = {};
    valueActivities.forEach(activity => {
        cumulative[activity.id] = 0;
    });
    
    Object.entries(dateMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([date, values]) => {
            const dayData = { date };
            valueActivities.forEach(activity => {
                cumulative[activity.id] += values[activity.id] || 0;
                dayData[activity.id] = cumulative[activity.id];
            });
            result.push(dayData);
        });
    
    return result;
};


/**
 * 计算24小时活动分布热力图数据
 * @param {Array} records - 记录数组
 * @param {Object} activityMap - 活动映射对象
 * @returns {Array} 热力图数据 [{ hour: 0-23, [activityId]: count }]
 */
export const getHourlyActivityHeatmap = (records, activityMap) => {
  const heatmapData = {};
  
  // 初始化24小时数据
  for (let hour = 0; hour < 24; hour++) {
    heatmapData[hour] = {};
    Object.keys(activityMap).forEach(activityId => {
      heatmapData[hour][activityId] = 0;
    });
  }
  
  // 统计每个小时的活动
  records.forEach(record => {
    const recordDate = new Date(record.startTime);
    const hour = recordDate.getHours();
    const activityId = record.activityTypeId;
    
    if (heatmapData[hour] && activityMap[activityId]) {
      heatmapData[hour][activityId] = (heatmapData[hour][activityId] || 0) + 1;
    }
  });
  
  // 转换为数组
  return Object.entries(heatmapData)
    .map(([hour, activities]) => ({
      hour: parseInt(hour),
      ...activities
    }))
    .sort((a, b) => a.hour - b.hour);
};
