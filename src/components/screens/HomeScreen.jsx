import React, { useState, useEffect, useRef } from 'react';
import { Plus, Check, Settings, Baby } from 'lucide-react';
import Modal from '../common/Modal';
import NumberSelector from '../ui/NumberSelector';
import BabyManagerModal from '../modals/BabyManagerModal';
import ActivityManagerModal from '../modals/ActivityManagerModal';
import { useTimer } from '../../hooks/useTimer';
import { calculateDaysOld } from '../../utils/dateUtils';
import { formatDuration } from '../../utils/formatUtils';

// 3. Home Screen
const HomeScreen = ({ 
    activeBaby, timerStates, setTimerStates, 
    onAddRecord, onStopTimer, 
    onUpdateBabyActivities,
    onAddBaby, onUpdateBaby, onDeleteBaby, setActiveBabyId, babies,
    setShowHighlightModal // <-- New prop
}) => {
  const [showValueModal, setShowValueModal] = useState(false);
  const [showBabyManager, setShowBabyManager] = useState(false);
  const [showActivityManager, setShowActivityManager] = useState(false);
  
  const [activeActivity, setActiveActivity] = useState(null); // The activity being recorded (value type)
  const [recordValue, setRecordValue] = useState(60); 
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const longPressTimerRef = useRef(null);

  // Cleanup long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const daysOld = calculateDaysOld(activeBaby.startDate);
  const activityTypes = activeBaby.activityTypes || [];
  
  // Filter activities based on the new isActive flag and sort by order
  const activeActivityTypes = activityTypes
    .filter(a => a.isActive)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Handle drag and drop for activity reordering
  const handleDragStart = (index) => {
    setDraggedIndex(index);
    setIsDragging(true);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newActivities = [...activeActivityTypes];
      const [removed] = newActivities.splice(draggedIndex, 1);
      newActivities.splice(dragOverIndex, 0, removed);
      
      // Update order for all activities
      const updatedActivities = newActivities.map((activity, index) => ({
        ...activity,
        order: index
      }));
      
      // Update all activities in the baby's activityTypes, preserving inactive ones
      const allActivities = activityTypes.map(activity => {
        const updated = updatedActivities.find(a => a.id === activity.id);
        if (updated) {
          return updated;
        }
        // Keep inactive activities with their original order
        return activity;
      });
      
      onUpdateBabyActivities(allActivities);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsDragging(false);
  };

  // Handle long press for mobile drag
  const handleTouchStart = (e, index) => {
    longPressTimerRef.current = setTimeout(() => {
      handleDragStart(index);
      setIsDragging(true);
      // Add haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      // Prevent default to avoid scrolling
      e.preventDefault();
    }, 500); // 500ms long press
  };

  const handleTouchEnd = (e) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (isDragging) {
      e.preventDefault();
      handleDragEnd();
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && draggedIndex !== null) {
      e.preventDefault(); // Prevent scrolling while dragging
      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      if (element) {
        const activityElement = element.closest('[data-activity-index]');
        if (activityElement) {
          const targetIndex = parseInt(activityElement.getAttribute('data-activity-index'));
          if (!isNaN(targetIndex) && targetIndex !== draggedIndex) {
            setDragOverIndex(targetIndex);
          }
        }
      }
    }
  };

  // Timer Hook for dynamic activities
  const TimerDisplay = ({ activity, index }) => {
    const { isTiming, elapsedMs } = useTimer(timerStates, setTimerStates, activity.id, activeBaby.id);
    
    // Determine button state and color
    const baseColorClass = activity.color.replace('-600', '-50');
    const ringColorClass = activity.color.replace('bg-', 'ring-');
    const textColorClass = activity.color.replace('bg-', 'text-');
    const isDurationTimer = activity.type === 'duration' && activity.isTimer;

    const handleAction = (e) => {
      // Don't trigger action if we're dragging
      if (isDragging) {
        e.preventDefault();
        return;
      }
      
      if (activity.type === 'count') {
          // Quick count action
          onAddRecord({ 
              type: 'count', 
              activityTypeId: activity.id,
              value: 1,
              unit: activity.unit,
              name: activity.name,
              startTime: new Date().toISOString() 
          });
      } else if (activity.type === 'value') {
          // Open modal for value input
          setActiveActivity(activity);
          setRecordValue(activity.unit === 'ml' ? 120 : 60); // Reset default
          setShowValueModal(true);
      } else if (isDurationTimer) {
          // Start/Stop Timer logic
          if (isTiming) {
              // Stop timer and record
              onStopTimer(activity.id, elapsedMs);
          } else {
              // Start timer
              setTimerStates(prev => ({
                  ...prev,
                  [activeBaby.id]: {
                      ...(prev[activeBaby.id] || {}),
                      [activity.id]: { isTiming: true, startTime: new Date().toISOString() }
                  }
              }));
          }
      } else if (activity.type === 'duration' && !activity.isTimer) {
          // Open modal for duration input (like recording a past run/activity without a live timer)
          setActiveActivity(activity);
          setRecordValue(30); // Default 30 minutes
          setShowValueModal(true);
      }
    };
    
    const IconComponent = () => (
      <div className="text-4xl">{activity.icon}</div>
    );

    const isDragged = draggedIndex === index;
    const isDragOver = dragOverIndex === index;

    return (
        <div
          data-activity-index={index}
          draggable={!isTiming}
          onDragStart={() => !isTiming && handleDragStart(index)}
          onDragOver={(e) => !isTiming && handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
          onTouchStart={(e) => !isTiming && handleTouchStart(e, index)}
          onTouchEnd={(e) => handleTouchEnd(e)}
          onTouchMove={(e) => !isTiming && handleTouchMove(e)}
          onTouchCancel={(e) => {
            if (longPressTimerRef.current) {
              clearTimeout(longPressTimerRef.current);
              longPressTimerRef.current = null;
            }
            if (isDragging) {
              handleDragEnd();
            }
          }}
          className={`transition-all duration-200 ${
            isDragged ? 'opacity-50 scale-95 z-50' : ''
          } ${isDragOver ? 'transform translate-y-2' : ''}`}
        >
          <button 
            onClick={handleAction}
            className={`rounded-[2rem] p-5 flex flex-col items-center justify-center gap-3 aspect-square active:scale-95 duration-200 transition-all relative overflow-hidden w-full ${
              isTiming 
                  ? `${activity.color} text-white shadow-lg ${ringColorClass.replace('text-', 'ring-')} ring-4`
                  : `${baseColorClass} hover:${baseColorClass.replace('-50', '-100')} text-gray-700`
            } ${isDragging && !isDragged ? 'cursor-move' : ''}`}
          >
            <div className="relative z-10 flex flex-col items-center gap-2">
              <IconComponent />
              <span className="font-semibold text-base leading-tight mt-1">{activity.name}</span>
              
              {isTiming && (
                <div className="bg-white/20 px-3 py-1 mt-1 rounded-full text-xs font-mono font-medium backdrop-blur-sm">
                  {formatDuration(elapsedMs)}
                </div>
              )}
              
              {(activity.type === 'count') && (
                  <span className="text-xs text-gray-500 font-medium mt-1">点击记录 {activity.unit}</span>
              )}
              
              {isDragging && !isTiming && (
                <span className="text-xs text-gray-400 mt-1">长按拖拽排序</span>
              )}
            </div>
          </button>
        </div>
    );
  };
  
  // Logic: Save Value/Duration record from Modal
  const saveValueRecord = () => {
    if (!activeActivity) return;

    const record = {
      type: activeActivity.type,
      activityTypeId: activeActivity.id,
      value: recordValue,
      unit: activeActivity.unit,
      name: activeActivity.name,
      startTime: new Date().toISOString(),
    };
    
    // For non-timer duration types, calculate duration from value (minutes)
    if (activeActivity.type === 'duration' && !activeActivity.isTimer) {
        record.duration = recordValue * 60000;
    }

    onAddRecord(record);
    setShowValueModal(false);
    setActiveActivity(null);
  };
  
  return (
    <div className="pt-14 pb-24 px-5 space-y-6 animate-fade-in h-full overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="flex justify-between items-center">
        {/* 标题更新为"今日记录" */}
        <h1 className="text-xl font-bold text-gray-800">今日记录</h1>
        <button 
           onClick={() => setShowBabyManager(true)}
           className="p-2 bg-blue-50 rounded-full text-blue-500 hover:bg-blue-100 transition-colors"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Baby/Book Card (Active Notebook) */}
      <div 
        onClick={() => setShowHighlightModal(true)} // <-- New click handler for Highlight Modal
        className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-50 flex items-center justify-between relative overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
      >
        <div className="flex items-center gap-4 z-10">
          <div className={`w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm text-2xl`}>
            {activeBaby.icon || <Baby size={30} className="text-gray-500" />}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-700">{activeBaby.name}</h2>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-900">{daysOld}</span>
              <span className="text-sm text-gray-500 font-medium">天 / 开始</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <button 
               onClick={(e) => { e.stopPropagation(); setShowActivityManager(true); }} // Stop propagation to prevent modal trigger
               className="p-2 bg-gray-50 rounded-full text-gray-500 hover:bg-gray-100 z-10 transition-colors"
            >
              <Settings size={20} />
            </button>
        </div>
      </div>

      {/* Action Grid - All Activities (No Grouping) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">活动 ({activeActivityTypes.length})</h2>
          {activeActivityTypes.length > 0 && (
            <span className="text-xs text-gray-400">长按拖拽排序</span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4">
            {activeActivityTypes.map((activity, index) => (
                <TimerDisplay key={activity.id} activity={activity} index={index} />
            ))}
            {activeActivityTypes.length === 0 && (
                 <p className="text-xs text-gray-400 col-span-3 pt-2">暂无活动，请在设置中添加/显示。</p>
            )}
        </div>
      </div>

      {/* Value Input Modal */}
      <Modal 
        isOpen={showValueModal} 
        onClose={() => setShowValueModal(false)} 
        title={`记录: ${activeActivity?.name || '活动'}`}
      >
        {/* 内容区域 */}
        <div className="flex flex-col space-y-4">
            <div className="flex-1 overflow-y-auto pr-2 mb-4">
                 <p className="text-center text-gray-500 mb-6 text-sm">
                    {activeActivity?.type === 'duration' ? 
                      '输入时长（分钟）。' : 
                      '输入数值。'
                    }
                 </p>
                <div className="flex flex-col items-center justify-center pb-4">
                    <NumberSelector 
                        value={recordValue}
                        setValue={setRecordValue}
                        unit={activeActivity?.type === 'duration' ? '分钟' : activeActivity?.unit || '单位'}
                        step={activeActivity?.unit === 'ml' ? 10 : 1}
                        min={1}
                        max={activeActivity?.type === 'duration' ? 360 : 300}
                    />
                </div>
            </div>
            
            <button 
              onClick={saveValueRecord} 
              className="w-full bg-gray-900 text-white py-3.5 rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2 flex-shrink-0"
            >
              <Check size={18} /> 确认记录
            </button>
        </div>
      </Modal>
      
      {/* Baby Manager Modal */}
      <BabyManagerModal 
        isOpen={showBabyManager}
        onClose={() => setShowBabyManager(false)}
        babies={babies}
        activeBabyId={activeBaby.id}
        setActiveBabyId={setActiveBabyId}
        onAddBaby={onAddBaby}
        onUpdateBaby={onUpdateBaby}
        onDeleteBaby={onDeleteBaby}
      />
      
      {/* Activity Manager Modal */}
      <ActivityManagerModal 
        isOpen={showActivityManager}
        onClose={() => setShowActivityManager(false)}
        activeBaby={activeBaby}
        onUpdateBabyActivities={onUpdateBabyActivities}
      />
    </div>
  );
};

export default HomeScreen;

