import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { getDateRange, formatDateKey } from '../../utils/dateUtils';
import {
  getRecordsByDateRange,
  getDailyRecordCounts,
  getDurationTrends,
  getValueTrends,
  getHourlyActivityHeatmap
} from '../../utils/recordUtils';
import { formatDurationChinese, getColorFromClass } from '../../utils/formatUtils';

const AnalysisScreen = ({ activeBaby, activeBabyActivities, records }) => {
  const [dateRange, setDateRange] = useState('7'); // '7', '30', 'all'
  const [selectedActivities, setSelectedActivities] = useState(new Set()); // 选中的活动ID集合
  const [hoveredHour, setHoveredHour] = useState(null); // 悬停的小时
  const [clickedHour, setClickedHour] = useState(null); // 点击的小时
  
  // 过滤当前宝宝的记录
  const activeBabyRecords = useMemo(() => {
    return records.filter(r => r.babyId === activeBaby.id);
  }, [records, activeBaby.id]);
  
  // 活动映射
  const activityMap = useMemo(() => {
    return activeBabyActivities.reduce((acc, curr) => {
      acc[curr.id] = curr;
      return acc;
    }, {});
  }, [activeBabyActivities]);
  
  // 按order排序的活动列表，并标记highlight
  const sortedActivities = useMemo(() => {
    return [...activeBabyActivities]
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(activity => ({
        ...activity,
        isHighlight: activity.isHighlight || false
      }));
  }, [activeBabyActivities]);
  
  // 初始化选中活动（默认全选）
  useEffect(() => {
    if (selectedActivities.size === 0 && sortedActivities.length > 0) {
      setSelectedActivities(new Set(sortedActivities.map(a => a.id)));
    }
  }, [sortedActivities, selectedActivities.size]);
  
  // 根据选择的时间范围获取日期范围
  const { startDate, endDate } = useMemo(() => {
    if (dateRange === 'all') {
      if (activeBabyRecords.length === 0) {
        const today = formatDateKey(new Date());
        return { startDate: today, endDate: today };
      }
      const dates = activeBabyRecords.map(r => formatDateKey(r.startTime));
      const minDate = dates.sort()[0];
      const maxDate = dates.sort().reverse()[0];
      return { startDate: minDate, endDate: maxDate };
    }
    return getDateRange(parseInt(dateRange));
  }, [dateRange, activeBabyRecords]);
  
  // 过滤后的活动（根据选中状态）
  const filteredActivities = useMemo(() => {
    return sortedActivities.filter(activity => selectedActivities.has(activity.id));
  }, [sortedActivities, selectedActivities]);
  
  // 切换活动选中状态
  const toggleActivity = (activityId) => {
    setSelectedActivities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };
  
  // 全选/全不选
  const toggleAllActivities = () => {
    if (selectedActivities.size === sortedActivities.length) {
      setSelectedActivities(new Set());
    } else {
      setSelectedActivities(new Set(sortedActivities.map(a => a.id)));
    }
  };
  
  // 每日记录数量趋势
  const dailyRecordCounts = useMemo(() => {
    const filteredRecords = getRecordsByDateRange(activeBabyRecords, startDate, endDate);
    return getDailyRecordCounts(filteredRecords);
  }, [activeBabyRecords, startDate, endDate]);
  
  // 时长类活动累计趋势（只包含选中的活动）
  const durationTrends = useMemo(() => {
    const filteredRecords = getRecordsByDateRange(activeBabyRecords, startDate, endDate);
    const filteredDurationActivities = filteredActivities.filter(a => a.type === 'duration');
    if (filteredDurationActivities.length === 0) return [];
    
    // 临时修改 activityMap 只包含选中的活动
    const filteredActivityMap = {};
    filteredDurationActivities.forEach(activity => {
      filteredActivityMap[activity.id] = activity;
    });
    
    return getDurationTrends(filteredRecords, filteredActivityMap, startDate, endDate);
  }, [activeBabyRecords, filteredActivities, startDate, endDate]);
  
  // 数值类活动累计趋势（只包含选中的活动）
  const valueTrends = useMemo(() => {
    const filteredRecords = getRecordsByDateRange(activeBabyRecords, startDate, endDate);
    const filteredValueActivities = filteredActivities.filter(a => a.type === 'value');
    if (filteredValueActivities.length === 0) return [];
    
    // 临时修改 activityMap 只包含选中的活动
    const filteredActivityMap = {};
    filteredValueActivities.forEach(activity => {
      filteredActivityMap[activity.id] = activity;
    });
    
    return getValueTrends(filteredRecords, filteredActivityMap, startDate, endDate);
  }, [activeBabyRecords, filteredActivities, startDate, endDate]);
  
  // 获取时长类活动（只包含选中的）
  const durationActivities = useMemo(() => {
    return filteredActivities.filter(a => a.type === 'duration');
  }, [filteredActivities]);
  
  // 获取数值类活动（只包含选中的）
  const valueActivities = useMemo(() => {
    return filteredActivities.filter(a => a.type === 'value');
  }, [filteredActivities]);
  
  // 时间热力图数据
  const hourlyHeatmap = useMemo(() => {
    const filteredRecords = getRecordsByDateRange(activeBabyRecords, startDate, endDate);
    return getHourlyActivityHeatmap(filteredRecords, activityMap);
  }, [activeBabyRecords, activityMap, startDate, endDate]);
  
  // 格式化日期显示（仅显示月-日）
  const formatChartDate = (dateStr) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  };
  
  // 从活动颜色类名获取颜色值
  const getActivityColor = (activity) => {
    return getColorFromClass(activity.color);
  };
  
  // 处理热力图小方格点击
  const handleHeatmapCellClick = (hour, activityId, count) => {
    if (count > 0) {
      setClickedHour(clickedHour === hour ? null : hour);
      // 可以在这里添加更多逻辑，比如显示该小时的详细记录
    }
  };
  
  return (
    <div className="pt-14 pb-24 px-5 animate-fade-in h-full overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-4">数据分析</h1>
        
        {/* 时间范围选择器 */}
        <div className="flex gap-2 mb-4">
          {[
            { value: '7', label: '最近7天' },
            { value: '30', label: '最近30天' },
            { value: 'all', label: '全部' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setDateRange(option.value)}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                dateRange === option.value
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        
        {/* 活动筛选器 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">活动筛选</h3>
            <button
              onClick={toggleAllActivities}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              {selectedActivities.size === sortedActivities.length ? '全不选' : '全选'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {sortedActivities.map(activity => {
              const isSelected = selectedActivities.has(activity.id);
              const activityColor = getActivityColor(activity);
              
              return (
                <button
                  key={activity.id}
                  onClick={() => toggleActivity(activity.id)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-50'
                  } ${isSelected && activity.isHighlight ? 'ring-2 ring-yellow-400 ring-offset-1' : ''}`}
                  style={isSelected ? { backgroundColor: activityColor } : {}}
                >
                  <span>{activity.icon}</span>
                  <span>{activity.name}</span>
                  {activity.isHighlight && (
                    <span className="text-xs">✨</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* 时间热力图 */}
        {hourlyHeatmap.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">24小时活动分布热力图</h2>
            <div className="space-y-4">
              {sortedActivities
                .filter(activity => selectedActivities.has(activity.id))
                .map(activity => {
                  const activityColor = getColorFromClass(activity.color);
                  const maxCount = Math.max(...hourlyHeatmap.map(h => h[activity.id] || 0));
                  
                  return (
                    <div key={activity.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${activity.color}`}>
                          {activity.icon}
                        </div>
                        <span className="text-sm font-semibold text-gray-700">{activity.name}</span>
                        {activity.isHighlight && (
                          <span className="text-xs">✨</span>
                        )}
                      </div>
                      <div className="grid grid-cols-24 gap-1">
                        {hourlyHeatmap.map((hourData, index) => {
                          const count = hourData[activity.id] || 0;
                          const intensity = maxCount > 0 ? count / maxCount : 0;
                          const opacity = Math.max(0.2, intensity);
                          const isHovered = hoveredHour === hourData.hour;
                          const isClicked = clickedHour === hourData.hour;
                          
                          return (
                            <button
                              key={index}
                              onClick={() => handleHeatmapCellClick(hourData.hour, activity.id, count)}
                              onMouseEnter={() => setHoveredHour(hourData.hour)}
                              onMouseLeave={() => setHoveredHour(null)}
                              className={`aspect-square rounded flex items-center justify-center text-[10px] font-medium transition-all ${
                                isHovered || isClicked ? 'scale-110 z-10 ring-2 ring-gray-400' : 'hover:scale-105'
                              }`}
                              style={{
                                backgroundColor: activityColor,
                                opacity: opacity,
                                color: intensity > 0.5 ? 'white' : 'transparent',
                                cursor: count > 0 ? 'pointer' : 'default'
                              }}
                              title={`${hourData.hour}:00 - ${count}次`}
                            >
                              {count > 0 && count}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                        <span>0:00</span>
                        <span>12:00</span>
                        <span>23:00</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
        
        {/* 每日记录数量趋势图 */}
        {dailyRecordCounts.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">每日记录数量趋势</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyRecordCounts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatChartDate}
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip 
                  labelFormatter={(value) => `日期: ${value}`}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke={getColorFromClass('bg-blue-600')}
                  strokeWidth={2}
                  dot={{ fill: getColorFromClass('bg-blue-600'), r: 4 }}
                  name="记录数量"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        
        {/* 时长类活动累计趋势 */}
        {durationTrends.length > 0 && durationActivities.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">时长类活动累计趋势</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={durationTrends}>
                <defs>
                  {durationActivities.map((activity) => {
                    const activityColor = getActivityColor(activity);
                    return (
                      <linearGradient key={activity.id} id={`color${activity.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={activityColor} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={activityColor} stopOpacity={0.1}/>
                      </linearGradient>
                    );
                  })}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatChartDate}
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  fontSize={12}
                  tickFormatter={(value) => {
                    const hours = Math.floor(value / 3600000);
                    const minutes = Math.floor((value % 3600000) / 60000);
                    if (hours > 0) return `${hours}h`;
                    return `${minutes}m`;
                  }}
                />
                <Tooltip 
                  labelFormatter={(value) => `日期: ${value}`}
                  formatter={(value) => formatDurationChinese(value)}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend 
                  formatter={(value) => {
                    const activity = durationActivities.find(a => a.id === value);
                    return activity ? activity.name : value;
                  }}
                />
                {durationActivities.map((activity) => {
                  const activityColor = getActivityColor(activity);
                  return (
                    <Area
                      key={activity.id}
                      type="monotone"
                      dataKey={activity.id}
                      stroke={activityColor}
                      fill={`url(#color${activity.id})`}
                      strokeWidth={2}
                      name={activity.id}
                    />
                  );
                })}
              </AreaChart>
            </ResponsiveContainer>
            
            {/* 统计信息 */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              {durationActivities.map((activity) => {
                const activityData = durationTrends.map(d => d[activity.id] || 0);
                const total = activityData[activityData.length - 1] || 0;
                const avg = activityData.length > 0 
                  ? activityData.reduce((sum, val, idx) => {
                      const prev = idx > 0 ? activityData[idx - 1] : 0;
                      return sum + (val - prev);
                    }, 0) / activityData.length 
                  : 0;
                
                return (
                  <div key={activity.id} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${activity.color}`}>
                        {activity.icon}
                      </div>
                      <div className="text-sm font-semibold text-gray-700">{activity.name}</div>
                      {activity.isHighlight && (
                        <span className="text-xs">✨</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      <div>累计: {formatDurationChinese(total)}</div>
                      <div>日均: {formatDurationChinese(avg)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* 数值类活动累计趋势 */}
        {valueTrends.length > 0 && valueActivities.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">数值类活动累计趋势</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={valueTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatChartDate}
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip 
                  labelFormatter={(value) => `日期: ${value}`}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend 
                  formatter={(value) => {
                    const activity = valueActivities.find(a => a.id === value);
                    return activity ? activity.name : value;
                  }}
                />
                {valueActivities.map((activity) => {
                  const activityColor = getActivityColor(activity);
                  return (
                    <Line
                      key={activity.id}
                      type="monotone"
                      dataKey={activity.id}
                      stroke={activityColor}
                      strokeWidth={2}
                      dot={{ fill: activityColor, r: 4 }}
                      name={activity.id}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
            
            {/* 统计信息 */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              {valueActivities.map((activity) => {
                const activityData = valueTrends.map(d => d[activity.id] || 0);
                const total = activityData[activityData.length - 1] || 0;
                const avg = activityData.length > 0 
                  ? activityData.reduce((sum, val, idx) => {
                      const prev = idx > 0 ? activityData[idx - 1] : 0;
                      return sum + (val - prev);
                    }, 0) / activityData.length 
                  : 0;
                
                return (
                  <div key={activity.id} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${activity.color}`}>
                        {activity.icon}
                      </div>
                      <div className="text-sm font-semibold text-gray-700">{activity.name}</div>
                      {activity.isHighlight && (
                        <span className="text-xs">✨</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      <div>累计: {total.toFixed(1)} {activity.unit}</div>
                      <div>日均: {avg.toFixed(1)} {activity.unit}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* 空数据提示 */}
        {dailyRecordCounts.length === 0 && durationTrends.length === 0 && valueTrends.length === 0 && hourlyHeatmap.length === 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">暂无数据</h3>
            <p className="text-sm text-gray-500">
              在选定时间范围内没有记录数据，快去首页添加一些记录吧！
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisScreen;
