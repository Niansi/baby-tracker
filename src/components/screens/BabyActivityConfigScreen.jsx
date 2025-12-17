import React, { useState, useMemo } from 'react';
import { ArrowLeft, Plus, X, Sparkles, Eye, EyeOff } from 'lucide-react';
import { CUSTOM_ICONS, CUSTOM_COLORS } from '../../constants/activityTypes';

const BabyActivityConfigScreen = ({
  baby,
  activities,
  onBack,
  onUpdateActivityConfigs,
  getBabyActivities
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  
  const currentConfigs = baby.activityConfigs || [];
  const currentActivities = getBabyActivities(baby);
  
  // Get available activities (not yet added to this baby)
  const availableActivities = useMemo(() => {
    const currentActivityIds = new Set(currentConfigs.map(c => c.activityId));
    return activities.filter(a => !currentActivityIds.has(a.id));
  }, [activities, currentConfigs]);

  const handleAddActivity = (activityId) => {
    const maxOrder = currentConfigs.length > 0
      ? Math.max(...currentConfigs.map(c => c.order || 0))
      : -1;
    
    const newConfig = {
      activityId,
      isActive: true,
      isHighlight: false,
      order: maxOrder + 1
    };
    
    onUpdateActivityConfigs([...currentConfigs, newConfig]);
    setShowAddModal(false);
  };

  const handleRemoveActivity = (activityId) => {
    if (window.confirm('确定要从本子中移除此活动吗？')) {
      onUpdateActivityConfigs(currentConfigs.filter(c => c.activityId !== activityId));
    }
  };

  const handleToggleActive = (activityId) => {
    const newConfigs = currentConfigs.map(config =>
      config.activityId === activityId
        ? { ...config, isActive: !config.isActive }
        : config
    );
    onUpdateActivityConfigs(newConfigs);
  };

  const handleToggleHighlight = (activityId) => {
    const currentHighlightCount = currentConfigs.filter(c => c.isHighlight).length;
    const currentConfig = currentConfigs.find(c => c.activityId === activityId);
    const willHighlight = !currentConfig?.isHighlight;
    
    if (willHighlight && currentHighlightCount >= 3) {
      alert('最多只能设置 3 个活动作为首页提醒 (Highlight)！');
      return;
    }
    
    const newConfigs = currentConfigs.map(config =>
      config.activityId === activityId
        ? { ...config, isHighlight: !config.isHighlight }
        : config
    );
    onUpdateActivityConfigs(newConfigs);
  };

  const handleReorder = (fromIndex, toIndex) => {
    const newConfigs = [...currentConfigs];
    const [removed] = newConfigs.splice(fromIndex, 1);
    newConfigs.splice(toIndex, 0, removed);
    
    // Update order values
    const reorderedConfigs = newConfigs.map((config, index) => ({
      ...config,
      order: index
    }));
    
    onUpdateActivityConfigs(reorderedConfigs);
  };

  return (
    <div className="pt-14 pb-24 px-5 space-y-6 animate-fade-in h-full overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-700" />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">{baby.name}</h1>
          <p className="text-sm text-gray-500">活动配置</p>
        </div>
      </div>

      {/* Add Activity Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="w-full flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-600 rounded-2xl font-bold hover:bg-blue-100 transition-colors"
      >
        <Plus size={18} /> 添加活动
      </button>

      {/* Activity List */}
      <div className="space-y-3">
        {currentActivities.map((activity, index) => {
          const config = currentConfigs.find(c => c.activityId === activity.id);
          return (
            <div
              key={activity.id}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                activity.isActive 
                  ? 'bg-white border-blue-200' 
                  : 'bg-gray-50 border-gray-100 opacity-80'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-10 h-10 ${activity.color} rounded-full flex items-center justify-center text-xl shrink-0`}>
                  {activity.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800">{activity.name}</span>
                    {activity.isHighlight && (
                      <Sparkles size={16} className="text-yellow-500" />
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {activity.type === 'duration' ? '持续时间' : activity.type === 'count' ? '次数' : '数值'} ({activity.unit})
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Toggle Active */}
                <button
                  onClick={() => handleToggleActive(activity.id)}
                  className={`p-2 rounded-full transition-colors ${
                    activity.isActive 
                      ? 'text-green-500 hover:bg-green-50' 
                      : 'text-gray-400 hover:bg-gray-100'
                  }`}
                  title={activity.isActive ? '首页显示' : '首页隐藏'}
                >
                  {activity.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
                
                {/* Toggle Highlight */}
                <button
                  onClick={() => handleToggleHighlight(activity.id)}
                  className={`p-2 rounded-full transition-colors ${
                    activity.isHighlight 
                      ? 'text-yellow-500 hover:bg-yellow-50' 
                      : 'text-gray-400 hover:bg-gray-100'
                  }`}
                  title={activity.isHighlight ? '首页提醒' : '设为首页提醒'}
                >
                  <Sparkles size={18} />
                </button>
                
                {/* Remove */}
                <button
                  onClick={() => handleRemoveActivity(activity.id)}
                  className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-100 transition-colors"
                  title="移除活动"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          );
        })}
        
        {currentActivities.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p>暂无活动，点击上方按钮添加</p>
          </div>
        )}
      </div>

      {/* Add Activity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">选择活动</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-2">
              {availableActivities.length === 0 ? (
                <p className="text-center text-gray-400 py-8">所有活动已添加</p>
              ) : (
                availableActivities.map(activity => (
                  <button
                    key={activity.id}
                    onClick={() => handleAddActivity(activity.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className={`w-10 h-10 ${activity.color} rounded-full flex items-center justify-center text-xl`}>
                      {activity.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{activity.name}</div>
                      <div className="text-xs text-gray-400">
                        {activity.type === 'duration' ? '持续时间' : activity.type === 'count' ? '次数' : '数值'} ({activity.unit})
                      </div>
                    </div>
                    <Plus size={20} className="text-gray-400" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BabyActivityConfigScreen;

