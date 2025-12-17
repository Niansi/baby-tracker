import React, { useState } from 'react';
import { User, Plus, Edit3, Trash2, ChevronRight, BookOpen, Activity } from 'lucide-react';
import { calculateDaysOld } from '../../utils/dateUtils';
import BabyActivityConfigScreen from './BabyActivityConfigScreen';
import GlobalActivityManagerScreen from './GlobalActivityManagerScreen';
import BabyEditScreen from './BabyEditScreen';

const SettingsScreen = ({
  babies,
  activities,
  activeBabyId,
  setActiveBabyId,
  onAddBaby,
  onUpdateBaby,
  onDeleteBaby,
  onUpdateBabyActivityConfigs,
  onAddActivity,
  onUpdateActivity,
  onDeleteActivity,
  getBabyActivities
}) => {
  const [view, setView] = useState('main'); // 'main', 'baby-config', 'activity-manager', 'baby-edit'
  const [selectedBabyId, setSelectedBabyId] = useState(null);

  // Account Management (Placeholder)
  const handleAccountClick = () => {
    // Simple toast-like notification
    alert('暂不支持');
  };

  // Baby Management
  const handleBabyClick = (babyId) => {
    setSelectedBabyId(babyId);
    setView('baby-config');
  };

  const handleAddBaby = () => {
    const newBaby = {
      name: '新本子',
      startDate: new Date().toISOString().split('T')[0],
      icon: '📒',
      color: 'bg-orange-100'
    };
    onAddBaby(newBaby);
  };

  const handleEditBaby = (e, babyId) => {
    e.stopPropagation();
    setSelectedBabyId(babyId);
    setView('baby-edit');
  };

  const handleDeleteBaby = (e, babyId) => {
    e.stopPropagation();
    if (window.confirm('警告：删除本子将永久删除所有相关记录。确定删除吗？')) {
      onDeleteBaby(babyId);
    }
  };

  // Activity Management
  const handleActivityManager = () => {
    setView('activity-manager');
  };

  // Navigation back
  const handleBack = () => {
    setView('main');
    setSelectedBabyId(null);
  };

  // Main Settings View
  if (view === 'main') {
    return (
      <div className="pt-14 pb-24 px-5 space-y-6 animate-fade-in h-full overflow-y-auto no-scrollbar">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">设置</h1>

        {/* Account Management (Placeholder) */}
        <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-50">
          <div 
            onClick={handleAccountClick}
            className="flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <User size={24} className="text-gray-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-800">账号管理</h2>
                <p className="text-xs text-gray-500">暂未实现</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </div>
        </div>

        {/* Baby Management */}
        <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <BookOpen size={18} />
              本子管理
            </h2>
            <button
              onClick={handleAddBaby}
              className="p-2 bg-blue-50 rounded-full text-blue-500 hover:bg-blue-100 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
          
          <div className="space-y-3">
            {babies.map((baby) => (
              <div
                key={baby.id}
                onClick={() => handleBabyClick(baby.id)}
                className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer active:scale-[0.99] ${
                  baby.id === activeBabyId 
                    ? 'bg-blue-50 border-2 border-blue-300' 
                    : 'bg-gray-50 border border-gray-100 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm text-2xl">
                    {baby.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-800">{baby.name}</span>
                    <span className="text-xs text-gray-500">
                      {calculateDaysOld(baby.startDate)} 天
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleEditBaby(e, baby.id)}
                    className="p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-100 transition-colors"
                  >
                    <Edit3 size={16} />
                  </button>
                  
                  <button
                    onClick={(e) => handleDeleteBaby(e, baby.id)}
                    className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  
                  {baby.id === activeBabyId && (
                    <span className="text-blue-500 text-xs font-semibold px-2">使用中</span>
                  )}
                  
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Management */}
        <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-50">
          <div
            onClick={handleActivityManager}
            className="flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
                <Activity size={24} className="text-purple-500" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-800">活动管理</h2>
                <p className="text-xs text-gray-500">{activities.length} 个活动</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </div>
        </div>
      </div>
    );
  }

  // Baby Activity Config View
  if (view === 'baby-config' && selectedBabyId) {
    const selectedBaby = babies.find(b => b.id === selectedBabyId);
    if (!selectedBaby) {
      handleBack();
      return null;
    }
    
    return (
      <BabyActivityConfigScreen
        baby={selectedBaby}
        activities={activities}
        onBack={handleBack}
        onUpdateActivityConfigs={(configs) => onUpdateBabyActivityConfigs(selectedBabyId, configs)}
        getBabyActivities={getBabyActivities}
      />
    );
  }

  // Baby Edit View
  if (view === 'baby-edit' && selectedBabyId) {
    const editingBaby = babies.find(b => b.id === selectedBabyId);
    if (!editingBaby) {
      handleBack();
      return null;
    }
    
    return (
      <BabyEditScreen
        baby={editingBaby}
        onBack={handleBack}
        onUpdateBaby={onUpdateBaby}
      />
    );
  }

  // Global Activity Manager View
  if (view === 'activity-manager') {
    return (
      <GlobalActivityManagerScreen
        activities={activities}
        babies={babies}
        onBack={handleBack}
        onAddActivity={onAddActivity}
        onUpdateActivity={onUpdateActivity}
        onDeleteActivity={onDeleteActivity}
      />
    );
  }

  return null;
};

export default SettingsScreen;

