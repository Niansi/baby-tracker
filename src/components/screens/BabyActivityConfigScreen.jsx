import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowLeft, Plus, X, Sparkles, Eye, EyeOff, GripVertical } from 'lucide-react';

const BabyActivityConfigScreen = ({
  baby,
  activities,
  onBack,
  onUpdateActivityConfigs,
  getBabyActivities
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const longPressTimerRef = useRef(null);
  const touchStartPosRef = useRef(null);
  const draggedElementRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const autoScrollIntervalRef = useRef(null);
  
  const currentConfigs = baby.activityConfigs || [];
  const currentActivities = getBabyActivities(baby);
  
  // Get available activities (not yet added to this baby)
  const availableActivities = useMemo(() => {
    const currentActivityIds = new Set(currentConfigs.map(c => c.activityId));
    return activities.filter(a => !currentActivityIds.has(a.id));
  }, [activities, currentConfigs]);

  // 拖拽时阻止 body 和页面滚动（针对 iOS Safari）
  useEffect(() => {
    if (isDragging) {
      // 保存原始样式和滚动位置
      const scrollY = window.scrollY;
      const originalBodyOverflow = document.body.style.overflow;
      const originalBodyPosition = document.body.style.position;
      const originalBodyTop = document.body.style.top;
      const originalBodyWidth = document.body.style.width;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      
      // 阻止 body 和 html 滚动
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.documentElement.style.overflow = 'hidden';
      
      // iOS Safari 特殊处理：在 document 级别阻止 touchmove
      const preventScroll = (e) => {
        // 只阻止垂直滚动，允许水平滚动（如果需要）
        if (e.touches && e.touches.length === 1) {
          e.preventDefault();
        }
      };
      
      // 使用 passive: false 确保 preventDefault 生效
      document.addEventListener('touchmove', preventScroll, { passive: false });
      document.addEventListener('scroll', preventScroll, { passive: false });
      
      return () => {
        // 移除事件监听器
        document.removeEventListener('touchmove', preventScroll);
        document.removeEventListener('scroll', preventScroll);
        
        // 恢复原始样式
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.position = originalBodyPosition;
        document.body.style.top = originalBodyTop;
        document.body.style.width = originalBodyWidth;
        document.documentElement.style.overflow = originalHtmlOverflow;
        // 恢复滚动位置
        window.scrollTo(0, scrollY);
      };
    }
  }, [isDragging]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }
    };
  }, []);

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

  const handleDragStart = (index, touch = null) => {
    setDraggedIndex(index);
    setIsDragging(true);
    
    // 如果是触摸事件，记录初始偏移
    if (touch) {
      // 立即设置位置，然后计算偏移
      setDragPosition({ x: touch.clientX, y: touch.clientY });
      
      // 使用 requestAnimationFrame 确保 DOM 已更新
      requestAnimationFrame(() => {
        if (draggedElementRef.current) {
          const rect = draggedElementRef.current.getBoundingClientRect();
          setDragOffset({
            x: touch.clientX - (rect.left + rect.width / 2),
            y: touch.clientY - (rect.top + rect.height / 2)
          });
        } else {
          // 如果 ref 未设置，使用默认偏移（卡片中心）
          setDragOffset({ x: 0, y: 0 });
        }
      });
    }
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    // 停止自动滚动
    stopAutoScroll();
    
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      // Reorder based on currentActivities (which is already sorted by order)
      const reorderedActivities = [...currentActivities];
      const [removed] = reorderedActivities.splice(draggedIndex, 1);
      reorderedActivities.splice(dragOverIndex, 0, removed);
      
      // Create a map of activityId to config for quick lookup
      const configMap = new Map(currentConfigs.map(config => [config.activityId, config]));
      
      // Get set of reordered activity IDs
      const reorderedActivityIds = new Set(reorderedActivities.map(a => a.id));
      
      // Update order for reordered activities
      const reorderedConfigs = reorderedActivities.map((activity, index) => {
        const config = configMap.get(activity.id);
        if (config) {
          return { ...config, order: index };
        }
        return null;
      }).filter(Boolean);
      
      // Add inactive activities (not in reordered list) at the end, keeping their relative order
      const inactiveConfigs = currentConfigs
        .filter(config => !reorderedActivityIds.has(config.activityId))
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      
      inactiveConfigs.forEach((config, index) => {
        config.order = reorderedConfigs.length + index;
      });
      
      // Combine reordered and inactive configs
      const finalConfigs = [...reorderedConfigs, ...inactiveConfigs];
      
      onUpdateActivityConfigs(finalConfigs);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsDragging(false);
    setDragPosition({ x: 0, y: 0 });
    setDragOffset({ x: 0, y: 0 });
  };

  // Handle long press for mobile drag
  const handleTouchStart = (e, index) => {
    // 如果点击的是按钮，不触发拖拽
    const target = e.target;
    if (target.closest('button') || target.closest('svg')) {
      return;
    }
    
    const touch = e.touches[0];
    touchStartPosRef.current = { 
      x: touch.clientX, 
      y: touch.clientY,
      index 
    };
    
    // 缩短长按时间到 300ms，提升响应速度
    longPressTimerRef.current = setTimeout(() => {
      handleDragStart(index, touch);
      // Add haptic feedback if available
      try {
        if (navigator.vibrate && typeof navigator.vibrate === 'function') {
          navigator.vibrate(50);
        }
      } catch (err) {
        // Ignore vibration errors
      }
    }, 300); // 300ms long press
  };

  const handleTouchEnd = (e) => {
    touchStartPosRef.current = null;
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    // 停止自动滚动
    stopAutoScroll();
    if (isDragging) {
      e.preventDefault();
      handleDragEnd();
      // 重置拖拽位置
      setDragPosition({ x: 0, y: 0 });
      setDragOffset({ x: 0, y: 0 });
    }
  };

  // 自动滚动函数 - 根据距离边缘的远近动态调整速度
  const startAutoScroll = (direction, distanceFromEdge) => {
    // 如果已经在滚动，先停止
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
    
    // 根据距离边缘的远近计算滚动速度（越靠近边缘速度越快）
    const maxDistance = 80; // 最大触发距离
    const minSpeed = 5; // 最小滚动速度
    const maxSpeed = 20; // 最大滚动速度
    const normalizedDistance = Math.min(distanceFromEdge / maxDistance, 1);
    const scrollSpeed = minSpeed + (maxSpeed - minSpeed) * (1 - normalizedDistance);
    
    const scrollInterval = 16; // 约 60fps
    
    autoScrollIntervalRef.current = setInterval(() => {
      if (scrollContainerRef.current) {
        const currentScroll = scrollContainerRef.current.scrollTop;
        const maxScroll = scrollContainerRef.current.scrollHeight - scrollContainerRef.current.clientHeight;
        
        if (direction === 'up' && currentScroll > 0) {
          scrollContainerRef.current.scrollTop = Math.max(0, currentScroll - scrollSpeed);
        } else if (direction === 'down' && currentScroll < maxScroll) {
          scrollContainerRef.current.scrollTop = Math.min(maxScroll, currentScroll + scrollSpeed);
        } else {
          // 到达边界，停止滚动
          stopAutoScroll();
        }
      }
    }, scrollInterval);
  };

  const stopAutoScroll = () => {
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    
    // If not yet dragging, check if movement exceeds threshold to cancel long press
    if (!isDragging && longPressTimerRef.current && touchStartPosRef.current) {
      const dx = touch.clientX - touchStartPosRef.current.x;
      const dy = touch.clientY - touchStartPosRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // 增加移动阈值到 15px，避免正常滚动时误触发
      if (distance > 15) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
        touchStartPosRef.current = null;
        return;
      }
    }
    
    if (isDragging && draggedIndex !== null) {
      // iOS Safari: 必须调用 preventDefault 来阻止滚动
      e.preventDefault();
      e.stopPropagation();
      
      // 更新拖拽位置，让卡片跟随手指移动
      setDragPosition({ x: touch.clientX, y: touch.clientY });
      
      // 边缘检测和自动滚动
      if (scrollContainerRef.current) {
        const containerRect = scrollContainerRef.current.getBoundingClientRect();
        const touchY = touch.clientY;
        const edgeThreshold = 80; // 距离边缘 80px 时开始自动滚动
        const topEdge = containerRect.top + edgeThreshold;
        const bottomEdge = containerRect.bottom - edgeThreshold;
        
        // 检查是否接近顶部或底部边缘
        if (touchY < topEdge) {
          // 接近顶部，向上滚动，距离边缘越近速度越快
          const distanceFromTop = touchY - containerRect.top;
          startAutoScroll('up', distanceFromTop);
        } else if (touchY > bottomEdge) {
          // 接近底部，向下滚动，距离边缘越近速度越快
          const distanceFromBottom = containerRect.bottom - touchY;
          startAutoScroll('down', distanceFromBottom);
        } else {
          // 不在边缘区域，停止自动滚动
          stopAutoScroll();
        }
      }
      
      // 查找目标位置
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

  const handleTouchCancel = () => {
    touchStartPosRef.current = null;
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    // 停止自动滚动
    stopAutoScroll();
    if (isDragging) {
      handleDragEnd();
      // 重置拖拽位置
      setDragPosition({ x: 0, y: 0 });
      setDragOffset({ x: 0, y: 0 });
    }
  };

  return (
    <div 
      ref={scrollContainerRef}
      className="pt-14 pb-24 px-5 space-y-6 animate-fade-in h-full overflow-y-auto no-scrollbar"
      style={{
        // iOS Safari: 拖拽时完全阻止触摸滚动
        touchAction: isDragging ? 'none' : 'pan-y',
        overscrollBehavior: 'contain', // 防止滚动链
        WebkitOverflowScrolling: 'touch' // iOS 平滑滚动
      }}
      onTouchMove={(e) => {
        // iOS Safari: 在容器级别也阻止滚动
        if (isDragging) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
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

      {/* Drag Preview - 跟随手指移动的拖拽预览 */}
      {isDragging && draggedIndex !== null && dragPosition.x > 0 && dragPosition.y > 0 && (
        <div
          className="fixed z-[100] pointer-events-none"
          style={{
            left: `${dragPosition.x + dragOffset.x}px`,
            top: `${dragPosition.y + dragOffset.y}px`,
            transform: 'translate(-50%, -50%)',
            width: 'calc(100% - 2.5rem)',
            maxWidth: 'calc(100vw - 2.5rem)'
          }}
        >
          <div className="flex items-center justify-between p-4 rounded-xl border bg-white border-blue-300 shadow-2xl scale-105">
            {(() => {
              const activity = currentActivities[draggedIndex];
              const config = currentConfigs.find(c => c.activityId === activity?.id);
              if (!activity) return null;
              
              return (
                <>
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-gray-400 shrink-0">
                      <GripVertical size={20} />
                    </div>
                    <div className={`w-10 h-10 ${activity.color} rounded-full flex items-center justify-center text-xl shrink-0`}>
                      {activity.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{activity.name}</span>
                        {config?.isHighlight && (
                          <Sparkles size={16} className="text-yellow-500" />
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {activity.type === 'duration' ? '持续时间' : activity.type === 'count' ? '次数' : '数值'} ({activity.unit})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {config?.isActive && <Eye size={18} className="text-green-500" />}
                    {config?.isHighlight && <Sparkles size={18} className="text-yellow-500" />}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Activity List */}
      <div className="space-y-3">
        {currentActivities.map((activity, index) => {
          const config = currentConfigs.find(c => c.activityId === activity.id);
          const isDragged = draggedIndex === index;
          const isDragOver = dragOverIndex === index;
          
          return (
            <div
              key={activity.id}
              ref={isDragged ? draggedElementRef : null}
              data-activity-index={index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleTouchStart(e, index)}
              onTouchEnd={handleTouchEnd}
              onTouchMove={handleTouchMove}
              onTouchCancel={handleTouchCancel}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                activity.isActive 
                  ? 'bg-white border-blue-200' 
                  : 'bg-gray-50 border-gray-100 opacity-80'
              } ${
                isDragged ? 'opacity-30' : ''
              } ${
                isDragOver && !isDragged ? 'transform translate-y-2 border-blue-400 bg-blue-50' : ''
              }`}
              style={{
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
                touchAction: isDragging ? 'none' : 'auto',
                cursor: isDragging ? 'grabbing' : 'grab',
                // 拖拽时显示占位符效果
                ...(isDragged ? {
                  borderStyle: 'dashed',
                  borderColor: '#93c5fd'
                } : {})
              }}
            >
              <div className="flex items-center gap-3 flex-1">
                {/* Drag Handle */}
                <div 
                  className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing shrink-0 touch-none"
                  style={{ touchAction: 'none' }}
                >
                  <GripVertical size={20} />
                </div>
                
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
                  onClick={(e) => {
                    if (isDragging) {
                      e.preventDefault();
                      e.stopPropagation();
                      return;
                    }
                    handleToggleActive(activity.id);
                  }}
                  onTouchStart={(e) => {
                    if (isDragging) {
                      e.stopPropagation();
                    }
                  }}
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
                  onClick={(e) => {
                    if (isDragging) {
                      e.preventDefault();
                      e.stopPropagation();
                      return;
                    }
                    handleToggleHighlight(activity.id);
                  }}
                  onTouchStart={(e) => {
                    if (isDragging) {
                      e.stopPropagation();
                    }
                  }}
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
                  onClick={(e) => {
                    if (isDragging) {
                      e.preventDefault();
                      e.stopPropagation();
                      return;
                    }
                    handleRemoveActivity(activity.id);
                  }}
                  onTouchStart={(e) => {
                    if (isDragging) {
                      e.stopPropagation();
                    }
                  }}
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

