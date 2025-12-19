import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { Check, Baby } from 'lucide-react';
import Modal from '../common/Modal';
import NumberSelector from '../ui/NumberSelector';
import { useTimer } from '../../hooks/useTimer';
import { formatAge } from '../../utils/dateUtils';
import { formatDuration } from '../../utils/formatUtils';

// Color mapping for inline styles
const colorMap = {
  'blue': { 100: '#DBEAFE', 400: '#60A5FA', 600: '#2563EB' },
  'indigo': { 100: '#E0E7FF', 400: '#818CF8', 600: '#4F46E5' },
  'purple': { 100: '#EDE9FE', 400: '#A78BFA', 600: '#7C3AED' },
  'amber': { 100: '#FEF3C7', 400: '#FBBF24', 600: '#D97706' },
  'yellow': { 100: '#FEF9C3', 400: '#FACC15', 600: '#CA8A04' },
  'gray': { 100: '#F3F4F6', 400: '#9CA3AF', 600: '#4B5563', 700: '#374151' },
  'orange': { 100: '#FFEDD5', 400: '#FB923C', 600: '#D97706' },
  'green': { 100: '#D1FAE5', 400: '#4ADE80', 600: '#059669' },
  'red': { 100: '#FEE2E2', 400: '#F87171', 600: '#DC2626' },
  'pink': { 100: '#FCE7F3', 400: '#F472B6', 600: '#EC4899' },
};

// Format duration for flyout display (converts ms to readable format)
const formatDurationFlyout = (ms) => {
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 0) {
    return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
  }
  return `${minutes}分钟`;
};

const getColorValue = (colorClass, shade) => {
  const colorName = colorClass.replace('bg-', '').replace('-600', '').replace('-700', '');
  return colorMap[colorName]?.[shade] || '#F3F4F6';
};

// TimerDisplay component - defined outside HomeScreen to prevent recreation on every render
const TimerDisplay = memo(({ 
  activity, 
  index, 
  originalIndex,  // Original index in base array for drag state detection
  timerStates, 
  setTimerStates, 
  activeBabyId,
  isDragging,
  draggedIndex,
  dragOverIndex,
  shouldShowPreview,  // Whether to show preview animation after delay
  onDragStart,
  onDragOver,
  onDragEnd,
  onTouchStart,
  onTouchEnd,
  onTouchMove,
  onTouchCancel,
  onAddRecord,
  onStopTimer,
  onOpenValueModal,
  flyoutData,
  onClearFlyout
}) => {
  const { isTiming, elapsedMs } = useTimer(timerStates, setTimerStates, activity.id, activeBabyId);
  const [isClicked, setIsClicked] = useState(false);
  const [flyoutText, setFlyoutText] = useState(null);
  const [flyoutPhase, setFlyoutPhase] = useState('hidden'); // 'hidden' | 'show' | 'flyout'
  const clickTimeoutRef = useRef(null);
  const flyoutTimeoutRef = useRef(null);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      if (flyoutTimeoutRef.current) {
        clearTimeout(flyoutTimeoutRef.current);
      }
    };
  }, []);

  // Handle external flyout trigger (for value/duration types after modal confirm)
  useEffect(() => {
    if (flyoutData && flyoutData.activityId === activity.id && flyoutData.text) {
      triggerFlyout(flyoutData.text);
      onClearFlyout?.();
    }
  }, [flyoutData, activity.id, onClearFlyout]);

  // Trigger flyout animation
  const triggerFlyout = (text) => {
    // Clear any existing flyout
    if (flyoutTimeoutRef.current) {
      clearTimeout(flyoutTimeoutRef.current);
    }
    
    setFlyoutText(text);
    setFlyoutPhase('show');
    
    // After 1s, start fly out animation
    flyoutTimeoutRef.current = setTimeout(() => {
      setFlyoutPhase('flyout');
      
      // After flyout animation (300ms), hide completely
      flyoutTimeoutRef.current = setTimeout(() => {
        setFlyoutPhase('hidden');
        setFlyoutText(null);
      }, 300);
    }, 1000);
  };
  
  // Determine button state and color
  // Handle both -600 and -700 color variants
  let baseColorClass = activity.color;
  let hoverColorClass = activity.color;
  let activeColorClass = activity.color;
  let baseColorValue = getColorValue(activity.color, 100);
  let activeColorValue = getColorValue(activity.color, 600);
  
  if (activity.color.includes('-600')) {
    baseColorClass = activity.color.replace('-600', '-100');
    hoverColorClass = activity.color.replace('-600', '-400');
    activeColorClass = activity.color; // Keep original -600 color for click state
    baseColorValue = getColorValue(activity.color, 100);
    activeColorValue = getColorValue(activity.color, 600);
  } else if (activity.color.includes('-700')) {
    baseColorClass = activity.color.replace('-700', '-100');
    hoverColorClass = activity.color.replace('-700', '-400');
    activeColorClass = activity.color.replace('-700', '-600');
    baseColorValue = getColorValue(activity.color, 100);
    activeColorValue = getColorValue(activity.color, 600);
  }
  
  const ringColorClass = activity.color.replace('bg-', 'ring-');
  const isDurationTimer = activity.type === 'duration' && activity.isTimer;

  const handleAction = (e) => {
    // Don't trigger action if we're dragging
    if (isDragging) {
      e.preventDefault();
      return;
    }
    
    // Trigger click animation immediately for all non-timing activities
    if (!isTiming) {
      // Clear any existing timeout
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      
      setIsClicked(true);
      
      // Reset after animation
      clickTimeoutRef.current = setTimeout(() => {
        setIsClicked(false);
        clickTimeoutRef.current = null;
      }, 300);
    }
    
    // Execute action after a small delay to ensure visual feedback shows
    const executeAction = () => {
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
        // Trigger flyout for count
        triggerFlyout(`+1 ${activity.unit}`);
      } else if (activity.type === 'value') {
        // Open modal for value input
        onOpenValueModal(activity, activity.unit === 'ml' ? 120 : 60);
      } else if (isDurationTimer) {
        // Start/Stop Timer logic
        if (isTiming) {
          // Stop timer and record - trigger flyout with formatted duration
          const flyoutText = `+${formatDurationFlyout(elapsedMs)}`;
          onStopTimer(activity.id, elapsedMs);
          triggerFlyout(flyoutText);
        } else {
          // Start timer
          setTimerStates(prev => ({
            ...prev,
            [activeBabyId]: {
              ...(prev[activeBabyId] || {}),
              [activity.id]: { isTiming: true, startTime: new Date().toISOString() }
            }
          }));
        }
      } else if (activity.type === 'duration' && !activity.isTimer) {
        // Open modal for duration input
        onOpenValueModal(activity, 30);
      }
    };

    // For non-timer activities, use setTimeout to ensure state update renders first
    if (!isTiming && !isDurationTimer) {
      setTimeout(executeAction, 50);
    } else {
      executeAction();
    }
  };
  
  const IconComponent = () => (
    <div className="text-4xl">
      {activity.icon}
    </div>
  );

  // Use the originalIndex prop passed from parent
  const isDragged = draggedIndex === originalIndex;
  const isDragOver = dragOverIndex === originalIndex;

  return (
    <div
      data-activity-index={originalIndex}
      draggable={!isTiming}
      onDragStart={() => !isTiming && onDragStart(originalIndex)}
      onDragOver={(e) => !isTiming && onDragOver(e, originalIndex)}
      onDragEnd={onDragEnd}
      onTouchStart={(e) => !isTiming && onTouchStart(e, originalIndex)}
      onTouchEnd={onTouchEnd}
      onTouchMove={(e) => !isTiming && onTouchMove(e)}
      onTouchCancel={onTouchCancel}
      className={`min-w-[120px] md:min-w-[180px] lg:min-w-[200px] select-none ${
        isDragged ? 'opacity-50 scale-95 z-50' : ''
      } ${isDragOver ? 'transform translate-y-2' : ''}`}
      style={{ 
        userSelect: 'none', 
        WebkitUserSelect: 'none',
        transition: isDragging && !isDragged && shouldShowPreview
          ? 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)' 
          : 'transform 0.2s ease, opacity 0.2s ease',
        willChange: isDragging && !isDragged && shouldShowPreview ? 'transform' : 'auto'
      }}
    >
      <button 
        onClick={handleAction}
        className={`rounded-[2rem] p-5 flex flex-col items-center justify-center gap-3 aspect-[4/3] transition-all duration-300 relative overflow-visible w-full select-none ${
          isTiming 
            ? `${activity.color} text-white shadow-lg ${ringColorClass.replace('text-', 'ring-')} ring-4`
            : `${baseColorClass} text-gray-700 hover:${hoverColorClass} hover:shadow-sm hover:ring-2 ${ringColorClass.replace('text-', 'ring-')}`
        } ${isDragging && !isDragged ? 'cursor-move' : ''}`}
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          ...(isClicked && !isTiming ? {
            backgroundColor: activeColorValue,
            color: 'white',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: `2px solid ${activeColorValue}`,
            // transform: 'scale(0.99)'
          } : {})
        }}
      >
        <div className="relative z-10 flex flex-col items-center gap-2">
          {/* Flyout text display */}
          {flyoutText && flyoutPhase !== 'hidden' && (
            <div 
              className={`absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 rounded-full text-base font-bold whitespace-nowrap z-20 pointer-events-none
                ${flyoutPhase === 'show' ? 'animate-flyout-appear' : 'animate-flyout-up'}`}
              style={{ color: activeColorValue }}
            >
              {flyoutText}
            </div>
          )}
          <IconComponent />
          <span className="font-semibold text-base leading-tight mt-1">{activity.name}</span>
          
          {isTiming && (
            <div className="bg-white/20 px-3 py-1 mt-1 rounded-full text-xs font-mono font-medium backdrop-blur-sm">
              {formatDuration(elapsedMs)}
            </div>
          )}
        </div>
      </button>
    </div>
  );
});

TimerDisplay.displayName = 'TimerDisplay';

// 3. Home Screen
const HomeScreen = ({ 
    activeBaby, activeBabyActivities, timerStates, setTimerStates, 
    onAddRecord, onStopTimer, 
    setShowHighlightModal,
    onUpdateBabyActivityConfigs
}) => {
  const [showValueModal, setShowValueModal] = useState(false);
  
  const [activeActivity, setActiveActivity] = useState(null); // The activity being recorded (value type)
  const [recordValue, setRecordValue] = useState(60); 
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [shouldShowPreview, setShouldShowPreview] = useState(false); // Whether to show preview animation after delay
  const [flyoutData, setFlyoutData] = useState(null); // { activityId, text }
  const longPressTimerRef = useRef(null);
  const dragOverTimerRef = useRef(null);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
      if (dragOverTimerRef.current) {
        clearTimeout(dragOverTimerRef.current);
      }
    };
  }, []);

  const ageText = formatAge(activeBaby.startDate);
  
  // Filter activities based on the isActive flag and sort by order
  const baseActiveActivityTypes = useMemo(() => {
    return activeBabyActivities
      .filter(a => a.isActive)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [activeBabyActivities]);
  
  // Calculate preview order during drag (only after 0.8s delay)
  const activeActivityTypes = useMemo(() => {
    if (!isDragging || draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex || !shouldShowPreview) {
      return baseActiveActivityTypes;
    }
    
    // Create a preview array with the dragged item moved to the new position
    const preview = [...baseActiveActivityTypes];
    const [removed] = preview.splice(draggedIndex, 1);
    preview.splice(dragOverIndex, 0, removed);
    return preview;
  }, [baseActiveActivityTypes, isDragging, draggedIndex, dragOverIndex, shouldShowPreview]);

  // Handle drag and drop for activity reordering
  const handleDragStart = (index) => {
    setDraggedIndex(index);
    setIsDragging(true);
    setShouldShowPreview(false); // Reset preview state when starting drag
    // Clear any existing drag over timer
    if (dragOverTimerRef.current) {
      clearTimeout(dragOverTimerRef.current);
      dragOverTimerRef.current = null;
    }
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      // Only update if targetIndex actually changed
      if (index !== dragOverIndex) {
        // Clear previous timer if dragOverIndex changes
        if (dragOverTimerRef.current) {
          clearTimeout(dragOverTimerRef.current);
          dragOverTimerRef.current = null;
        }
        
        // Reset preview state when hovering over a new position
        setShouldShowPreview(false);
        setDragOverIndex(index);
        
        // Start 0.8s delay timer before showing preview
        dragOverTimerRef.current = setTimeout(() => {
          setShouldShowPreview(true);
          dragOverTimerRef.current = null;
        }, 800);
      }
    }
  };

  const handleDragEnd = () => {
    // Clear drag over timer
    if (dragOverTimerRef.current) {
      clearTimeout(dragOverTimerRef.current);
      dragOverTimerRef.current = null;
    }
    
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      // Calculate new order regardless of shouldShowPreview state
      // This ensures the order is saved even if user didn't wait for preview
      const newActivities = [...baseActiveActivityTypes];
      const [removed] = newActivities.splice(draggedIndex, 1);
      newActivities.splice(dragOverIndex, 0, removed);
      
      // Get all activity configs (including inactive ones)
      const allConfigs = [...(activeBaby.activityConfigs || [])];
      
      // Create a map of activityId to config for quick lookup
      const configMap = new Map(allConfigs.map(config => [config.activityId, config]));
      
      // Get set of active activity IDs for quick lookup
      const activeActivityIds = new Set(newActivities.map(a => a.id));
      
      // Update order for active activities based on new order
      newActivities.forEach((activity, newIndex) => {
        const config = configMap.get(activity.id);
        if (config) {
          config.order = newIndex;
        }
      });
      
      // Update order for inactive activities (place them after active ones)
      // Keep their relative order by sorting by current order first
      const inactiveConfigs = allConfigs
        .filter(config => !activeActivityIds.has(config.activityId))
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      
      inactiveConfigs.forEach((config, index) => {
        config.order = newActivities.length + index;
      });
      
      // Create final array with all configs in correct order
      const reorderedConfigs = [
        ...newActivities.map(activity => configMap.get(activity.id)).filter(Boolean),
        ...inactiveConfigs
      ];
      
      // Update the baby's activity configs
      if (onUpdateBabyActivityConfigs) {
        onUpdateBabyActivityConfigs(activeBaby.id, reorderedConfigs);
      }
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsDragging(false);
    setShouldShowPreview(false); // Reset preview state
  };

  // Handle long press for mobile drag
  const handleTouchStart = (e, index) => {
    // Store the event for later use
    const touchEvent = e;
    longPressTimerRef.current = setTimeout(() => {
      handleDragStart(index);
      setIsDragging(true);
      // Prevent text selection when long press is triggered
      // Only prevent default if the event is still valid
      if (touchEvent && touchEvent.cancelable) {
        try {
          touchEvent.preventDefault();
        } catch (err) {
          // Ignore if preventDefault fails (e.g., event already handled)
        }
      }
      // Add haptic feedback if available and user has interacted
      try {
        if (navigator.vibrate && typeof navigator.vibrate === 'function') {
          navigator.vibrate(50);
        }
      } catch (err) {
        // Ignore vibration errors
      }
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
            // Only update if targetIndex actually changed
            if (targetIndex !== dragOverIndex) {
              // Clear previous timer if dragOverIndex changes
              if (dragOverTimerRef.current) {
                clearTimeout(dragOverTimerRef.current);
                dragOverTimerRef.current = null;
              }
              
              // Reset preview state when hovering over a new position
              setShouldShowPreview(false);
              setDragOverIndex(targetIndex);
              
              // Start 0.8s delay timer before showing preview
              dragOverTimerRef.current = setTimeout(() => {
                setShouldShowPreview(true);
                dragOverTimerRef.current = null;
              }, 800);
            }
          }
        }
      }
    }
  };

  const handleTouchCancel = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (dragOverTimerRef.current) {
      clearTimeout(dragOverTimerRef.current);
      dragOverTimerRef.current = null;
    }
    if (isDragging) {
      handleDragEnd();
    }
  }, [isDragging]);

  // Callback for opening value modal from TimerDisplay
  const handleOpenValueModal = useCallback((activity, defaultValue) => {
    setActiveActivity(activity);
    setRecordValue(defaultValue);
    setShowValueModal(true);
  }, []);
  
  // Clear flyout data callback
  const handleClearFlyout = useCallback(() => {
    setFlyoutData(null);
  }, []);

  // Logic: Save Value/Duration record from Modal
  const saveValueRecord = () => {
    if (!activeActivity) return;

    const startTime = new Date();
    const record = {
      type: activeActivity.type,
      activityTypeId: activeActivity.id,
      value: recordValue,
      unit: activeActivity.unit,
      name: activeActivity.name,
      startTime: startTime.toISOString(),
    };
    
    // For non-timer duration types, calculate duration from value (minutes) and set endTime
    if (activeActivity.type === 'duration' && !activeActivity.isTimer) {
        record.duration = recordValue * 60000;
        // Calculate endTime based on startTime + duration
        const endTime = new Date(startTime.getTime() + record.duration);
        record.endTime = endTime.toISOString();
    }

    onAddRecord(record);
    
    // Trigger flyout for value/duration types
    let flyoutText;
    if (activeActivity.type === 'duration') {
      // For duration, convert minutes to readable format
      flyoutText = `+${formatDurationFlyout(recordValue * 60000)}`;
    } else {
      // For value type
      flyoutText = `+${recordValue} ${activeActivity.unit}`;
    }
    setFlyoutData({ activityId: activeActivity.id, text: flyoutText });
    
    setShowValueModal(false);
    setActiveActivity(null);
  };
  
  return (
    <div className="pt-14 pb-24 px-5 space-y-6 animate-fade-in h-full overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">今日记录</h1>
      </div>

      {/* Baby/Book Card (Active Notebook) */}
      <div 
        onClick={() => setShowHighlightModal(true)}
        className="bg-white rounded-[2rem] p-5 md:p-6 lg:p-8 shadow-sm border border-gray-50 flex items-center justify-between relative overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
      >
        <div className="flex items-center gap-4 z-10">
          <div className={`w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm text-2xl`}>
            {activeBaby.icon || <Baby size={30} className="text-gray-500" />}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-700">{activeBaby.name}</h2>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-900">{ageText}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Grid - All Activities (No Grouping) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8">
            {activeActivityTypes.map((activity, index) => {
              // Find original index in base array
              const originalIndex = baseActiveActivityTypes.findIndex(a => a.id === activity.id);
              return (
                <TimerDisplay 
                  key={activity.id} 
                  activity={activity} 
                  index={index}
                  originalIndex={originalIndex}
                  timerStates={timerStates}
                  setTimerStates={setTimerStates}
                  activeBabyId={activeBaby.id}
                  isDragging={isDragging}
                  draggedIndex={draggedIndex}
                  dragOverIndex={dragOverIndex}
                  shouldShowPreview={shouldShowPreview}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchMove}
                  onTouchCancel={handleTouchCancel}
                  onAddRecord={onAddRecord}
                  onStopTimer={onStopTimer}
                  onOpenValueModal={handleOpenValueModal}
                  flyoutData={flyoutData}
                  onClearFlyout={handleClearFlyout}
                />
              );
            })}
            {activeActivityTypes.length === 0 && (
                 <p className="text-xs text-gray-400 col-span-2 md:col-span-3 lg:col-span-4 xl:col-span-5 pt-2">暂无活动，请在设置中添加/显示。</p>
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
      
    </div>
  );
};

export default HomeScreen;

