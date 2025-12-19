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

