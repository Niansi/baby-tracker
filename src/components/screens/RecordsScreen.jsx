import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Check, Trash2 } from 'lucide-react';
import Modal from '../common/Modal';
import NumberSelector from '../ui/NumberSelector';
import { formatTime, formatDateKey, formatDateDisplay, getDateRange } from '../../utils/dateUtils';
import { formatDuration, formatDurationChinese } from '../../utils/formatUtils';
import { getActivityTypeStats } from '../../utils/recordUtils';

// 4. Records Screen (Simplified logic to use generic activity data)
const RecordsScreen = ({ records, onUpdateRecord, onDeleteRecord, activeBaby, activeBabyActivities }) => {
  const [editingRecord, setEditingRecord] = useState(null);
  const [editValue, setEditValue] = useState(0);
  const [editTime, setEditTime] = useState('');
  const [swipingRecordId, setSwipingRecordId] = useState(null);
  const swipeStartX = useRef(null);
  const swipeCurrentX = useRef(null);
  
  // Filter and enrich records
  const activityMap = useMemo(() => activeBabyActivities.reduce((acc, curr) => {
      acc[curr.id] = curr;
      return acc;
  }, {}), [activeBabyActivities]);
  
  const activeBabyRecords = useMemo(() => records
    .filter(r => r.babyId === activeBaby.id)
    .map(r => ({
        ...r,
        activity: activityMap[r.activityTypeId] || { name: '未知活动', icon: '❓', color: 'bg-gray-300', type: 'count', unit: '?' },
        dateKey: formatDateKey(r.startTime)
    })), [records, activeBaby.id, activityMap]);

  // 计算今日和昨日的统计
  const todayStats = useMemo(() => {
    const today = formatDateKey(new Date());
    const todayRecords = activeBabyRecords.filter(r => r.dateKey === today);
    return getActivityTypeStats(todayRecords, activityMap);
  }, [activeBabyRecords, activityMap]);

  const yesterdayStats = useMemo(() => {
    const yesterday = formatDateKey(new Date(Date.now() - 24 * 60 * 60 * 1000));
    const yesterdayRecords = activeBabyRecords.filter(r => r.dateKey === yesterday);
    return getActivityTypeStats(yesterdayRecords, activityMap);
  }, [activeBabyRecords, activityMap]);

  // 按日期分组记录
  const groupedRecords = useMemo(() => {
    const groups = {};
    activeBabyRecords.forEach(record => {
      if (!groups[record.dateKey]) {
        groups[record.dateKey] = [];
      }
      groups[record.dateKey].push(record);
    });
    
    // 按日期排序，最新的在前
    return Object.entries(groups)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([dateKey, records]) => ({
        dateKey,
        dateDisplay: formatDateDisplay(dateKey),
        records: records.sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
      }));
  }, [activeBabyRecords]);

  // Effect to sync editingRecord with editValue when modal opens/changes
  useEffect(() => {
    if (editingRecord) {
        const activity = activityMap[editingRecord.activityTypeId];
        let val = editingRecord.value || 0;
        
        // For duration type, convert duration MS to minutes for editing
        if (activity?.type === 'duration') {
             val = Math.round((editingRecord.duration || 0) / 60000);
        }
        setEditValue(val);
        
        // 设置编辑时间
        const date = new Date(editingRecord.startTime);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        setEditTime(`${hours}:${minutes}`);
    }
  }, [editingRecord, activityMap]);

  const handleSaveEdit = () => {
      if (!editingRecord) return;
      let updated = { ...editingRecord };
      const activity = activityMap[editingRecord.activityTypeId];
      
      if (activity?.type === 'duration') {
          updated.duration = editValue * 60000;
          updated.value = editValue; 
      } else if (activity?.type === 'value') {
          updated.value = editValue;
      }
      
      // 更新时间
      if (editTime) {
        const [hours, minutes] = editTime.split(':').map(Number);
        const newDate = new Date(updated.startTime);
        newDate.setHours(hours, minutes, 0, 0);
        updated.startTime = newDate.toISOString();
        if (updated.endTime) {
          const duration = updated.duration || 0;
          const endDate = new Date(newDate.getTime() + duration);
          updated.endTime = endDate.toISOString();
        }
      }
      
      onUpdateRecord(updated);
      setEditingRecord(null);
  };

  // 左滑删除处理
  const handleTouchStart = (e, recordId) => {
    swipeStartX.current = e.touches[0].clientX;
    swipeCurrentX.current = swipeStartX.current;
  };

  const handleTouchMove = (e, recordId) => {
    if (swipeStartX.current === null) return;
    swipeCurrentX.current = e.touches[0].clientX;
    const diff = swipeStartX.current - swipeCurrentX.current;
    
    if (diff > 50) {
      setSwipingRecordId(recordId);
    } else if (diff < -50) {
      setSwipingRecordId(null);
    }
  };

  const handleTouchEnd = () => {
    swipeStartX.current = null;
    swipeCurrentX.current = null;
  };

  const handleDelete = (recordId) => {
    onDeleteRecord(recordId);
    setSwipingRecordId(null);
  };

  // 计算同比变化
  const getComparison = (activityId, activity) => {
    const today = todayStats[activityId];
    const yesterday = yesterdayStats[activityId];
    
    if (!today) return null;
    
    let todayValue, yesterdayValue;
    
    // 根据活动类型选择比较的值
    if (activity.type === 'duration') {
      todayValue = today.totalDuration || 0;
      yesterdayValue = yesterday?.totalDuration || 0;
    } else if (activity.type === 'value') {
      todayValue = today.totalValue || 0;
      yesterdayValue = yesterday?.totalValue || 0;
    } else {
      // count 类型比较次数
      todayValue = today.count || 0;
      yesterdayValue = yesterday?.count || 0;
    }
    
    if (yesterdayValue === 0) {
      return todayValue > 0 ? 'new' : null;
    }
    
    const diff = todayValue - yesterdayValue;
    const percent = Math.round((diff / yesterdayValue) * 100);
    
    return { diff, percent, todayValue, yesterdayValue };
  };

  return (
    <div className="pt-14 pb-24 px-5 h-full flex flex-col animate-fade-in overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">{activeBaby.name} 的记录</h1>
        <div className="text-xs md:text-sm text-gray-500 font-medium">{activeBabyRecords.length} 条记录</div>
      </div>

      {/* 今日记录概览 */}
      {Object.keys(todayStats).length > 0 && (
        <div className="mb-4 shrink-0">
          <div className="text-sm font-semibold text-gray-700 mb-2">今日概览</div>
          <div className="overflow-x-auto no-scrollbar -mx-5 px-5">
            <div className="flex gap-3 pb-2">
              {activeBabyActivities
                .filter(activity => todayStats[activity.id])
                .map(activity => {
                  const stats = todayStats[activity.id];
                  const comparison = getComparison(activity.id, activity);
                  
                  // 获取活动颜色的浅色版本用于背景
                  let bgColorClass = 'bg-gray-50'; // 默认背景色
                  if (activity.color.includes('-600')) {
                    bgColorClass = activity.color.replace('-600', '-50');
                  } else if (activity.color.includes('-700')) {
                    bgColorClass = activity.color.replace('-700', '-50');
                  } else if (activity.color.includes('-100')) {
                    bgColorClass = activity.color;
                  } else {
                    // 尝试从颜色名推断
                    const colorName = activity.color.replace('bg-', '').split('-')[0];
                    bgColorClass = `bg-${colorName}-50`;
                  }
                  
                  // 确定显示的主要数值
                  let mainValue, mainUnit, mainLabel, isDurationString = false;
                  if (activity.type === 'duration') {
                    mainValue = formatDurationChinese(stats.totalDuration || 0);
                    mainUnit = '';
                    mainLabel = '总时长';
                    isDurationString = true;
                  } else if (activity.type === 'value') {
                    mainValue = Math.round(stats.totalValue || 0);
                    mainUnit = activity.unit;
                    mainLabel = '总量';
                  } else {
                    mainValue = stats.count || 0;
                    mainUnit = '次';
                    mainLabel = '次数';
                  }
                  
                  return (
                    <div
                      key={activity.id}
                      className={`${bgColorClass} rounded-2xl p-4 min-w-[160px] shadow-sm border border-white/50 flex-shrink-0`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${activity.color} shadow-sm`}>
                          {activity.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-gray-800 truncate">{activity.name}</div>
                        </div>
                      </div>
                      <div className="flex items-end justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {isDurationString ? (
                            <div className="text-xl font-bold text-gray-900 leading-tight break-words">
                              {mainValue}
                            </div>
                          ) : (
                            <div className="text-2xl font-bold text-gray-900 leading-tight">
                              {mainValue}
                              {mainUnit && <span className="text-base font-medium text-gray-600 ml-1">{mainUnit}</span>}
                            </div>
                          )}
                          <div className="text-xs text-gray-500 mt-1">{mainLabel}</div>
                        </div>
                        {comparison && (
                          <div className="flex flex-col items-end">
                            <div className={`text-xs font-bold ${
                              comparison === 'new' 
                                ? 'text-green-600' 
                                : comparison.diff > 0 
                                  ? 'text-blue-600' 
                                  : comparison.diff < 0 
                                    ? 'text-gray-500' 
                                    : 'text-gray-400'
                            }`}>
                              {comparison === 'new' 
                                ? '新增' 
                                : comparison.diff > 0 
                                  ? `+${comparison.percent}%` 
                                  : comparison.diff < 0 
                                    ? `${comparison.percent}%` 
                                    : '持平'}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5">较昨日</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* 按日期分组的记录列表 */}
      <div className="flex-1 relative overflow-y-auto no-scrollbar pr-2">
        <div className="absolute left-[54px] top-2 bottom-0 w-[2px] bg-gray-100 h-full -z-10"></div>

        <div className="space-y-8 pb-20">
          {groupedRecords.length === 0 ? (
            <div className="text-center text-gray-300 mt-20">暂无记录，快去首页添加吧</div>
          ) : (
            groupedRecords.map((group) => (
              <div key={group.dateKey} className="space-y-4">
                {/* 日期标题 */}
                <div className="sticky top-0 bg-[#F7F8FA] z-20 py-2 -mx-5 px-5">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-bold text-gray-700">{group.dateDisplay}</div>
                    <div className="text-xs text-gray-400">({group.records.length} 条)</div>
                  </div>
                </div>
                
                {/* 该日期的记录列表 */}
                {group.records.map((record) => (
                  <div
                    key={record.id}
                    className="relative"
                    onTouchStart={(e) => handleTouchStart(e, record.id)}
                    onTouchMove={(e) => handleTouchMove(e, record.id)}
                    onTouchEnd={handleTouchEnd}
                  >
                    {/* 删除按钮 */}
                    {swipingRecordId === record.id && (
                      <div className="absolute right-0 top-0 bottom-0 flex items-center z-30">
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="bg-red-500 text-white px-6 h-full rounded-r-2xl flex items-center justify-center active:bg-red-600 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                    
                    <div 
                      onClick={() => setEditingRecord(record)}
                      className={`flex gap-4 group cursor-pointer active:opacity-70 transition-all ${
                        swipingRecordId === record.id ? 'transform -translate-x-20' : ''
                      }`}
                    >
                      <div className="w-10 text-xs text-gray-400 text-right pt-2 font-mono shrink-0">
                        {formatTime(record.startTime)}
                      </div>
                      <div className="relative z-10 mt-1 shrink-0">
                        <div className={`w-8 h-8 rounded-full border-4 border-white shadow-sm flex items-center justify-center text-sm ${record.activity.color.replace('bg-', 'bg-')}`}>
                          {record.activity.icon}
                        </div>
                      </div>
                      <div className="flex-1 pt-1 pb-4 border-b border-gray-50">
                        <div className="flex justify-between">
                          <div className="font-bold text-gray-800">
                            {record.activity.name}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {record.activity.type === 'duration' && <span>时长: {formatDuration(record.duration)}</span>}
                          {record.activity.type === 'value' && <span>数值: {record.value} {record.activity.unit}</span>}
                          {record.activity.type === 'count' && <span>{record.activity.unit}: {record.value}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingRecord && (
        <Modal isOpen={!!editingRecord} onClose={() => setEditingRecord(null)} title={`编辑 ${editingRecord.activity.name}`}>
            <div className="flex-1 overflow-y-auto pr-2 mb-4 space-y-6">
              {/* 时间编辑 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">时间</label>
                <input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Conditional Number Selector for Editable Types */}
              {(editingRecord.activity.type === 'value' || editingRecord.activity.type === 'duration') ? (
                  <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {editingRecord.activity.type === 'duration' ? '时长' : '数值'}
                      </label>
                      <NumberSelector 
                          value={editValue}
                          setValue={setEditValue}
                          unit={editingRecord.activity.type === 'duration' ? '分钟' : editingRecord.activity.unit}
                          step={editingRecord.activity.unit === 'ml' ? 10 : 1}
                          min={1}
                          max={editingRecord.activity.type === 'duration' ? 360 : 300}
                      />
                  </div>
              ) : (
                  <div className="text-center p-6 bg-gray-50 rounded-xl text-gray-600">
                     <div className="text-xl font-bold">事件记录</div>
                     <p className="text-sm mt-2">次数型记录（如"臭臭"）通常是单次事件，数值固定为 1，不可编辑数值。</p>
                  </div>
              )}
              
              <button 
                onClick={handleSaveEdit}
                className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                 <Check size={18} /> 保存修改
              </button>
            </div>
            
            <div className="flex-shrink-0 mt-4 border-t border-gray-100 pt-4">
                <button 
                   onClick={() => {
                       if(window.confirm("确定删除这条记录吗？")) {
                        onDeleteRecord(editingRecord.id);
                        setEditingRecord(null);
                      }
                   }}
                   className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-500 rounded-2xl font-bold hover:bg-red-100 transition-colors"
                 >
                   <Trash2 size={18}/> 删除记录
                 </button>
            </div>
        </Modal>
      )}
    </div>
  );
};

export default RecordsScreen;

