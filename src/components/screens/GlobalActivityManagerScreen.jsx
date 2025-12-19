import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Plus, Edit3, Trash2, Check, Layers, Maximize2, Clock3, X } from 'lucide-react';
import { CUSTOM_ICONS, CUSTOM_COLORS, generateId } from '../../constants/activityTypes';

const GlobalActivityManagerScreen = ({
  activities,
  babies,
  onBack,
  onAddActivity,
  onUpdateActivity,
  onDeleteActivity
}) => {
  const [view, setView] = useState('list'); // 'list', 'add', 'edit'
  const [editingActivityId, setEditingActivityId] = useState(null);
  
  const [activityName, setActivityName] = useState('');
  const [activityType, setActivityType] = useState('count');
  const [activityUnit, setActivityUnit] = useState('次');
  const [activityIcon, setActivityIcon] = useState(CUSTOM_ICONS[0]);
  const [activityColor, setActivityColor] = useState(CUSTOM_COLORS[0]);
  const [activityIsTimer, setActivityIsTimer] = useState(false);

  const editingActivity = useMemo(() => 
    activities.find(a => a.id === editingActivityId), 
    [activities, editingActivityId]
  );

  const typeOptions = [
    { id: 'count', name: '次数型', unit: '次', icon: <Layers size={16} /> },
    { id: 'value', name: '数值型', unit: '单位', icon: <Maximize2 size={16} /> },
    { id: 'duration', name: '持续时间型', unit: '分钟', icon: <Clock3 size={16} /> },
  ];

  useEffect(() => {
    if (view === 'edit' && editingActivity) {
      setActivityName(editingActivity.name);
      setActivityType(editingActivity.type);
      setActivityUnit(editingActivity.unit);
      setActivityIcon(editingActivity.icon);
      setActivityColor(editingActivity.color);
      setActivityIsTimer(editingActivity.isTimer || false);
    } else if (view === 'add') {
      setActivityName('');
      setActivityType('count');
      setActivityUnit('次');
      setActivityIcon(CUSTOM_ICONS[0]);
      setActivityColor(CUSTOM_COLORS[0]);
      setActivityIsTimer(false);
    }
  }, [view, editingActivity]);

  const handleSave = () => {
    if (!activityName.trim()) {
      alert('活动名称不能为空！');
      return;
    }

    const activityData = {
      name: activityName.trim(),
      type: activityType,
      unit: activityType === 'count' ? '次' : activityUnit,
      icon: activityIcon,
      color: activityColor,
      isTimer: activityType === 'duration' ? activityIsTimer : false,
    };

    if (view === 'add') {
      onAddActivity(activityData);
    } else if (view === 'edit' && editingActivityId) {
      onUpdateActivity(editingActivityId, activityData);
    }

    setView('list');
    setEditingActivityId(null);
  };

  const handleDelete = (id) => {
    // Check if any baby is using this activity
    const isUsed = babies.some(baby => 
      baby.activityConfigs?.some(config => config.activityId === id)
    );
    
    if (isUsed) {
      alert('无法删除：有本子正在使用此活动。请先从所有本子中移除该活动。');
      return;
    }
    
    if (window.confirm('确定要删除此活动吗？此操作不可逆。')) {
      onDeleteActivity(id);
    }
  };

  const handleEdit = (id) => {
    setEditingActivityId(id);
    setView('edit');
  };

  if (view === 'add' || view === 'edit') {
    return (
      <div className="pt-14 pb-24 px-5 space-y-6 animate-fade-in h-full overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setView('list');
              setEditingActivityId(null);
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            {view === 'add' ? '新增活动' : '编辑活动'}
          </h1>
        </div>

        {/* Form */}
        <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-50 space-y-5">
          {/* Name and Icon Preview */}
          <div className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl">
            <div className={`w-12 h-12 ${activityColor} rounded-full flex items-center justify-center text-2xl shrink-0`}>
              {activityIcon}
            </div>
            <input
              type="text"
              placeholder="活动名称"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              className="flex-1 text-base font-bold p-1 border-b-2 border-gray-100 focus:border-blue-300 outline-none transition-colors"
            />
          </div>

          {/* Activity Type */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500 block">核心类型:</label>
            <div className="grid grid-cols-3 gap-2">
              {typeOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { 
                    setActivityType(opt.id); 
                    setActivityUnit(opt.unit); 
                  }}
                  className={`py-3 px-2 rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                    activityType === opt.id 
                      ? 'bg-blue-500 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {opt.icon}
                  <span className="mt-1">{opt.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Unit Input */}
          {(activityType === 'value' || (activityType === 'duration' && !activityIsTimer)) && (
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
              <label className="text-gray-600 font-medium">单位:</label>
              <input
                type="text"
                placeholder="单位 (ml, 次, 分钟)"
                value={activityUnit}
                onChange={(e) => setActivityUnit(e.target.value)}
                className="w-24 text-right bg-white p-1 rounded-lg border border-gray-200 text-sm"
              />
            </div>
          )}

          {/* Timer Toggle */}
          {activityType === 'duration' && (
            <div 
              onClick={() => setActivityIsTimer(v => !v)}
              className="flex items-center justify-between bg-gray-50 p-3 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <label className="text-gray-600 font-medium">是否启用计时器:</label>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${activityIsTimer ? 'bg-green-500' : 'bg-gray-300'}`}>
                {activityIsTimer && <Check size={16} className="text-white"/>}
              </div>
            </div>
          )}

          {/* Icon Selector */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-500 block">图标:</label>
            <div className="grid grid-cols-6 gap-2">
              {CUSTOM_ICONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => setActivityIcon(icon)}
                  className={`p-3 text-2xl rounded-xl transition-all ${activityIcon === icon ? 'ring-4 ring-blue-300 shadow-md bg-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selector */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-500 block">颜色主题:</label>
            <div className="grid grid-cols-4 gap-2">
              {CUSTOM_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setActivityColor(color)}
                  className={`p-5 rounded-xl transition-all ${color} ${activityColor === color ? 'ring-4 ring-blue-300 shadow-md' : 'opacity-70 hover:opacity-100'}`}
                >
                  {activityColor === color && <Check size={20} className="text-white"/>}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="w-full bg-gray-900 text-white py-3.5 rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-transform"
          >
            {view === 'add' ? '添加活动' : '保存修改'}
          </button>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="pt-14 pb-24 px-5 space-y-6 animate-fade-in h-full overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">活动管理</h1>
            <p className="text-sm text-gray-500">全局活动库</p>
          </div>
        </div>
        <button
          onClick={() => setView('add')}
          className="p-2 bg-blue-50 rounded-full text-blue-500 hover:bg-blue-100 transition-colors"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        {activities.map((activity) => {
          const usageCount = babies.reduce((count, baby) => {
            const hasActivity = baby.activityConfigs?.some(c => c.activityId === activity.id);
            return count + (hasActivity ? 1 : 0);
          }, 0);

          return (
            <div
              key={activity.id}
              className="flex items-center justify-between p-4 rounded-xl bg-white border border-gray-100"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-10 h-10 ${activity.color} rounded-full flex items-center justify-center text-xl shrink-0`}>
                  {activity.icon}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{activity.name}</div>
                  <div className="text-xs text-gray-400">
                    {activity.type === 'duration' ? '持续时间' : activity.type === 'count' ? '次数' : '数值'} ({activity.unit})
                    {activity.type === 'duration' && activity.isTimer && ' · 计时器'}
                    {usageCount > 0 && ` · ${usageCount} 个本子使用`}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(activity.id)}
                  className="p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-100 transition-colors"
                >
                  <Edit3 size={16} />
                </button>
                
                <button
                  onClick={() => handleDelete(activity.id)}
                  className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
        
        {activities.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p>暂无活动，点击右上角按钮添加</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalActivityManagerScreen;

