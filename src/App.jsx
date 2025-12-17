import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Home, AlignLeft, PieChart, Plus, Check, X, Trash2, Edit3, ChevronRight, Layers, 
  Droplet, Moon, Sun, Wind, Clock, Calendar, MoreHorizontal, Baby, Settings,
  Activity, Star, Zap, Utensils, BookOpen, Clock3, SunMedium, Cloud,
  Maximize2, Minimize2, Heart, Smile, Sparkles
} from 'lucide-react';

// --- Constants and Definitions ---

const generateId = () => Math.random().toString(36).substr(2, 9);
const formatTime = (date) => new Date(date).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
const formatDateKey = (date) => new Date(date).toISOString().split('T')[0];

const calculateDaysOld = (startDateStr) => {
    if (!startDateStr) return 'N/A';
    const start = new Date(startDateStr);
    const today = new Date();
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = Math.abs(today.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays > 0 ? diffDays : 0; 
};

// Available icons and colors for customization
const CUSTOM_ICONS = ['👶', '👧', '👦', '🍼', '🐣', '🧸', '🌙', '☕', '🚬', '💩', '💧', '🍎', '🏃', '📚', '💊', '🧘', '💸', '🐶', '🐱', '🧷', '🤱', '🛁'];
const CUSTOM_COLORS = [
    'bg-blue-600', 'bg-purple-600', 'bg-orange-600', 'bg-green-600', 
    'bg-red-600', 'bg-yellow-600', 'bg-pink-600', 'bg-gray-700'
]; // Use darker colors for buttons

const DEFAULT_ACTIVITY_TYPES = [
    { id: 'a-feeding-bottle', name: '奶瓶喂养', type: 'value', unit: 'ml', icon: '🍼', color: 'bg-blue-600', isTimer: false, isActive: true, isHighlight: false },
    { id: 'a-feeding-breast', name: '母乳亲喂', type: 'duration', unit: '分钟', icon: '🤱', color: 'bg-indigo-600', isTimer: true, isActive: true, isHighlight: false },
    { id: 'a-sleep', name: '睡觉', type: 'duration', unit: '分钟', icon: '🌙', color: 'bg-purple-600', isTimer: true, isActive: true, isHighlight: true }, // Default HL
    { id: 'a-poop', name: '臭臭', type: 'count', unit: '次', icon: '💩', color: 'bg-amber-600', isTimer: false, isActive: true, isHighlight: false },
    { id: 'a-diaper', name: '换尿片', type: 'count', unit: '次', icon: '🧷', color: 'bg-yellow-600', isTimer: false, isActive: true, isHighlight: false },
    { id: 'a-smoke', name: '抽烟', type: 'count', unit: '次', icon: '🚬', color: 'bg-gray-600', isTimer: false, isActive: true, isHighlight: false },
];

// Helper to format duration in MS to H:MM:SS
const formatDuration = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const parts = [
      hours > 0 ? `${hours}:` : '',
      minutes.toString().padStart(hours > 0 ? 2 : 1, '0'),
      seconds.toString().padStart(2, '0')
  ];
  return parts.join(':');
};

/**
 * Utility to format milliseconds into Chinese duration (e.g., 1小时25分钟) - H/M only for description/elapsed time since last record.
 */
const formatDurationChinese = (ms) => {
    if (ms === null || ms === undefined || ms < 0) return '未开始';
    
    // Less than 1 minute - display in seconds
    if (ms < 60000) return `${Math.max(1, Math.round(ms / 1000))}秒`; 

    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    let result = '';
    if (hours > 0) {
        result += `${hours}小时`;
    }
    if (minutes > 0) {
        result += `${minutes}分钟`;
    }
    return result || '不足1分钟'; 
};

/**
 * New utility to format milliseconds into Chinese elapsed time (H/M/S) for real-time display (e.g., 1小时3分钟5秒).
 */
const formatElapsedChineseHMS = (ms) => {
    if (ms === null || ms === undefined || ms < 0) return '未知时间';
    
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let result = '';
    if (hours > 0) {
        result += `${hours}小时`;
    }
    // Always show minutes if hours > 0, or if minutes > 0
    if (minutes > 0 || hours > 0) { 
        result += `${minutes}分钟`;
    }
    // Always show seconds for the real-time effect
    result += `${seconds}秒`;
    
    return result;
}


/**
 * Function to find the last record for a given activity
 * @param {Array} records - All records
 * @param {string} babyId - The current baby ID
 * @param {string} activityId - The activity type ID
 * @returns {Object|undefined} The latest record object
 */
const getLastRecord = (records, babyId, activityId) => {
    return records
        .filter(r => r.babyId === babyId && r.activityTypeId === activityId)
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))[0];
};


// --- Custom Hooks ---

/**
 * Hook to manage independent timers for duration-based activities.
 */
const useTimer = (timerState, setTimerState, activityId, babyId) => {
    const [elapsedMs, setElapsedMs] = useState(0);

    const currentTimer = useMemo(() => timerState[babyId]?.[activityId] || { isTiming: false, startTime: null }, [timerState, babyId, activityId]);

    useEffect(() => {
        let interval;
        if (currentTimer.isTiming && currentTimer.startTime) {
            const startTimestamp = new Date(currentTimer.startTime).getTime();
            
            interval = setInterval(() => {
                setElapsedMs(new Date().getTime() - startTimestamp);
            }, 1000);
        } else {
            setElapsedMs(0);
        }
        return () => clearInterval(interval);
    }, [currentTimer.isTiming, currentTimer.startTime, activityId, babyId]);
    
    // Recalculate elapsedMs when component mounts if timing is active
    useEffect(() => {
        if (currentTimer.isTiming && currentTimer.startTime) {
            setElapsedMs(new Date().getTime() - new Date(currentTimer.startTime).getTime());
        }
    }, [currentTimer.isTiming, currentTimer.startTime]);

    return { isTiming: currentTimer.isTiming, elapsedMs, startMs: new Date(currentTimer.startTime).getTime() };
};


// --- Components ---

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl transform transition-all duration-300 animate-magic-move max-h-[95vh] flex flex-col"> 
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        {/* 优化：为了避免被底部tab遮挡，将安全距离增加到 pb-16 (64px) */}
        <div className="flex-1 overflow-y-auto pr-1 pb-16"> 
          {children}
        </div>
      </div>
    </div>
  );
};

// New Highlight Modal Component
const HighlightModal = ({ isOpen, onClose, activeBaby, records, timerStates }) => { // ADDED timerStates
    // 1. Filter highlighted activities (max 3)
    const highlightedActivities = useMemo(() => 
        (activeBaby.activityTypes || []).filter(a => a.isHighlight).slice(0, 3), 
        [activeBaby.activityTypes]
    );

    // 2. State for re-rendering elapsed time
    const [tick, setTick] = useState(0); 
    
    // 3. Auto-update elapsed time every second
    useEffect(() => {
        if (!isOpen || highlightedActivities.length === 0) return;
        const interval = setInterval(() => {
            setTick(t => t + 1);
        }, 1000); // Update every second for accuracy
        return () => clearInterval(interval);
    }, [isOpen, highlightedActivities.length]);

    // 4. Calculate reminders (Rely on 'tick' for real-time recalculation)
    const reminders = useMemo(() => {
        tick; // Depend on tick to force refresh every second
        
        const activeTimers = timerStates[activeBaby.id] || {};
        
        return highlightedActivities.map(activity => {
            const timer = activeTimers[activity.id];
            // Check if it's a duration timer and it's currently active
            const isTiming = activity.type === 'duration' && activity.isTimer && timer && timer.isTiming;
            
            let elapsedMs = null;
            let lastRecordDescription = '';
            let displayTimeMs = 0;

            if (isTiming) {
                // Case A: Activity is currently running (e.g., "正在睡眠")
                const startTimestamp = new Date(timer.startTime).getTime();
                displayTimeMs = Date.now() - startTimestamp;
                elapsedMs = 1; // Mark as having data
            } else {
                // Case B: Calculate time since last completed record (e.g., "距离上次...")
                const lastRecord = getLastRecord(records, activeBaby.id, activity.id);
            
                if (!lastRecord) {
                    return { activity, elapsedMs: null, lastRecordDescription: '暂无记录', isTiming: false };
                }
                
                displayTimeMs = Date.now() - new Date(lastRecord.startTime).getTime();
                
                // Format the description based on activity type
                if (activity.type === 'duration') {
                    // Use the recorded duration for the description (H/M)
                    const durationMs = lastRecord.duration || (new Date(lastRecord.endTime).getTime() - new Date(lastRecord.startTime).getTime());
                    lastRecordDescription = `持续 ${formatDurationChinese(durationMs)}`;
                } else if (activity.type === 'value') {
                    lastRecordDescription = `${lastRecord.value} ${activity.unit}`;
                } else if (activity.type === 'count') {
                    lastRecordDescription = `${lastRecord.value} ${activity.unit}`;
                }
                elapsedMs = 1; // Mark as having data
            }

            return {
                activity,
                elapsedMs: displayTimeMs,
                lastRecordDescription,
                isTiming,
                // Use H/M/S for running timers, H/M for elapsed time since last record
                formattedTime: isTiming ? formatElapsedChineseHMS(displayTimeMs) : formatDurationChinese(displayTimeMs) 
            };
        }).filter(r => r.elapsedMs !== null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [highlightedActivities, records, activeBaby.id, timerStates, tick]); 


    if (!isOpen || reminders.length === 0) {
        return (
             <Modal isOpen={isOpen} onClose={onClose} title="关键提醒 (Highlight)">
                <div className="text-center text-gray-500 py-10">
                    <p className="font-bold">✨ 暂无高亮活动 ✨</p>
                    <p className="text-sm mt-2">请到 **活动类型管理** 中开启 **首页提醒**。</p>
                </div>
            </Modal>
        );
    }

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="关键提醒 (Highlight)"
        >
            <div className="flex flex-col space-y-8 min-h-[300px] justify-center items-center">
                {reminders.map((reminder) => (
                    <div key={reminder.activity.id} className="w-full text-center p-4 bg-gray-50 rounded-2xl shadow-inner border border-gray-100">
                        {reminder.isTiming ? (
                            // 状态: 正在XX，XX时间
                            <>
                                <p className="text-xl text-gray-700 font-semibold mb-2">
                                    正在 <span className={`font-extrabold text-2xl ${reminder.activity.color.replace('bg-', 'text-')}`}>{reminder.activity.name}</span>
                                </p>
                                <div className={`text-5xl font-extrabold ${reminder.activity.color.replace('bg-', 'text-')} mb-3 transition-all duration-500`}>
                                    {reminder.formattedTime}
                                </div>
                                <p className="text-sm text-gray-500">
                                    （实时计时中，请在首页结束）
                                </p>
                            </>
                        ) : (
                            // 状态: 距离上次XX（小字描述）已经过去XX时间（大字）
                            <>
                                <p className="text-lg text-gray-700 font-semibold mb-1">
                                    距离上次 <span className={`font-extrabold text-xl ${reminder.activity.color.replace('bg-', 'text-')}`}>{reminder.activity.name}</span>
                                </p>
                                <div className={`text-4xl sm:text-5xl font-extrabold ${reminder.activity.color.replace('bg-', 'text-')} mb-2 transition-all duration-500`}>
                                    {reminder.formattedTime}
                                </div>
                                <p className="text-sm text-gray-500">
                                    （{reminder.lastRecordDescription}）已经过去
                                </p>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </Modal>
    );
};


/**
 * 通用数字选择器组件
 */
const NumberSelector = ({ value, setValue, unit, step = 1, min = 1, max = 300 }) => {
    const inputRef = useRef(null);
    const [isInputActive, setIsInputActive] = useState(false);
    const [inputValue, setInputValue] = useState(String(value));

    useEffect(() => {
        setInputValue(String(value));
    }, [value]);
    
    const handleActivateInput = () => {
        setIsInputActive(true);
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.select();
            }
        }, 50);
    };
    
    const handleBlurInput = () => {
        const num = Math.round(Number(inputValue));
        if (!isNaN(num) && num >= min && num <= max) {
            setValue(num);
        } else {
            setInputValue(String(value));
        }
        setIsInputActive(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') inputRef.current.blur();
    };

    return (
        <div className="flex flex-col items-center justify-center w-full space-y-4">
          <div className="flex items-center justify-center gap-6">
            <button 
              onClick={() => setValue(v => Math.max(min, v - step))} 
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-600 transition-colors shrink-0 disabled:opacity-50"
              disabled={value <= min}
            >
              -
            </button>
            <div 
              onClick={handleActivateInput} 
              className="text-center w-28 cursor-pointer relative h-14 flex flex-col justify-end items-center"
            >
              {isInputActive ? (
                <input
                  ref={inputRef}
                  type="number"
                  inputMode="numeric"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onBlur={handleBlurInput}
                  onKeyDown={handleKeyDown}
                  className="absolute inset-0 bg-blue-50/70 text-gray-900 text-4xl font-extrabold text-center rounded-xl z-20 focus:outline-none ring-2 ring-blue-500"
                  style={{ lineHeight: '3rem', height: '3rem', top: '0' }}
                />
              ) : (
                <>
                  <span className="text-4xl font-extrabold text-gray-900 leading-none">{value}</span>
                  <div className="text-sm text-gray-500 mt-1">{unit}</div>
                </>
              )}
            </div>
            <button 
              onClick={() => setValue(v => Math.min(max, v + step))} 
              className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold transition-colors shrink-0 disabled:opacity-50"
              disabled={value >= max}
            >
              +
            </button>
          </div>
        </div>
    );
};


/**
 * 活动类型管理组件
 */
const ActivityManagerModal = ({ isOpen, onClose, activeBaby, onUpdateBabyActivities }) => {
    const [view, setView] = useState('list'); // 'list', 'add', 'edit'
    const [editingActivityId, setEditingActivityId] = useState(null);
    
    const [activityName, setActivityName] = useState('');
    const [activityType, setActivityType] = useState('count');
    const [activityUnit, setActivityUnit] = useState('次');
    const [activityIcon, setActivityIcon] = useState(CUSTOM_ICONS[0]);
    const [activityColor, setActivityColor] = useState(CUSTOM_COLORS[0]);
    const [activityIsTimer, setActivityIsTimer] = useState(false);
    const [activityIsActive, setActivityIsActive] = useState(true);
    // New state for Highlight feature
    const [activityIsHighlight, setActivityIsHighlight] = useState(false); 

    const activityTypes = activeBaby.activityTypes || [];
    const editingActivity = useMemo(() => activityTypes.find(a => a.id === editingActivityId), [activityTypes, editingActivityId]);

    const typeOptions = [
        { id: 'count', name: '次数型 (Quick Click)', unit: '次', icon: <Layers size={16} /> },
        { id: 'value', name: '数值型 (Scale Input)', unit: '单位', icon: <Maximize2 size={16} /> },
        { id: 'duration', name: '持续时间型 (Timer)', unit: '分钟', icon: <Clock3 size={16} /> },
    ];
    
    // Set state for editing
    useEffect(() => {
        if (view === 'edit' && editingActivity) {
            setActivityName(editingActivity.name);
            setActivityType(editingActivity.type);
            setActivityUnit(editingActivity.unit);
            setActivityIcon(editingActivity.icon);
            setActivityColor(editingActivity.color);
            setActivityIsTimer(editingActivity.isTimer || false);
            setActivityIsActive(editingActivity.isActive !== undefined ? editingActivity.isActive : true); 
            setActivityIsHighlight(editingActivity.isHighlight || false); // Load highlight state
        } else if (view === 'add') {
            // Reset for Add
            setActivityName('');
            setActivityType('count');
            setActivityUnit('次');
            setActivityIcon(CUSTOM_ICONS[0]);
            setActivityColor(CUSTOM_COLORS[0]);
            setActivityIsTimer(false);
            setActivityIsActive(true);
            setActivityIsHighlight(false); // Default false for new activity
        }
    }, [view, editingActivity]);

    const handleSaveActivity = () => {
        if (!activityName.trim()) {
            // Use simple modal for alerts as per new rules
            alert('活动名称不能为空！');
            return;
        }

        const newActivity = {
            name: activityName.trim(),
            type: activityType,
            unit: activityType === 'count' ? '次' : activityUnit,
            icon: activityIcon,
            color: activityColor,
            isTimer: activityType === 'duration' ? activityIsTimer : false,
            isActive: activityIsActive,
            isHighlight: activityIsHighlight, // Save highlight state
        };
        
        let proposedActivities;

        if (view === 'add') {
            proposedActivities = [...activityTypes, { ...newActivity, id: generateId() }];
        } else if (view === 'edit' && editingActivityId) {
            proposedActivities = activityTypes.map(a => a.id === editingActivityId ? { ...a, ...newActivity } : a);
        } else {
             return; // Should not happen
        }

        // --- Highlight Limit Check (Max 3) ---
        const highlightCount = proposedActivities.filter(a => a.isHighlight).length;
        if (highlightCount > 3) {
            alert('最多只能设置 3 个活动作为首页提醒 (Highlight)！请先取消其他活动的高亮设置。');
            return;
        }

        onUpdateBabyActivities(proposedActivities);
        setView('list');
        setEditingActivityId(null);
    };
    
    const handleDeleteActivity = (id) => {
        if (activityTypes.length <= 1) {
            alert('至少需要保留一个活动类型！');
            return;
        }
        
        // Note: Replacing window.confirm with a simple JS alert for now, as custom modals are complex
        if (window.confirm('确定要删除此活动类型吗？此操作不可逆。')) {
            const newActivities = activityTypes.filter(a => a.id !== id);
            onUpdateBabyActivities(newActivities);
            setView('list');
        }
    }
    
    // New function to toggle activity visibility directly from the list view
    const handleToggleActive = (id) => {
        const newActivities = activityTypes.map(a => 
            a.id === id ? { ...a, isActive: !a.isActive } : a
        );
        onUpdateBabyActivities(newActivities);
    };


    const renderContent = () => {
        if (view === 'add' || view === 'edit') {
            return (
                <div className="flex flex-col space-y-4">
                    {/* Name and Icon Preview */}
                    <div className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl">
                        <div className={`w-10 h-10 ${activityColor.replace('bg-', 'bg-')} rounded-full flex items-center justify-center text-xl shrink-0`}>
                            {activityIcon}
                        </div>
                        <input
                            type="text"
                            placeholder="活动名称 (如：喝水, 午睡)"
                            value={activityName}
                            onChange={(e) => setActivityName(e.target.value)}
                            className="flex-1 text-base font-bold p-1 border-b-2 border-gray-100 focus:border-blue-300 outline-none transition-colors"
                        />
                    </div>
                    
                    {/* 1. Activity Type Selector */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-500 block">核心类型:</label>
                        <div className="grid grid-cols-3 gap-2">
                            {typeOptions.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => { setActivityType(opt.id); setActivityUnit(opt.unit); }}
                                    className={`py-3 px-2 rounded-xl text-xs font-semibold flex flex-col items-center justify-center transition-all ${
                                        activityType === opt.id ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {opt.icon}
                                    <span className="mt-1">{opt.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* 2. Type-Specific Settings (Unit / Timer) */}
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
                    
                    {activityType === 'duration' && (
                        <div 
                           onClick={() => setActivityIsTimer(v => !v)}
                           className="flex items-center justify-between bg-gray-50 p-3 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                            <label className="text-gray-600 font-medium">是否启用计时器 (Start/Stop):</label>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${activityIsTimer ? 'bg-green-500' : 'bg-gray-300'}`}>
                                {activityIsTimer && <Check size={16} className="text-white"/>}
                            </div>
                        </div>
                    )}
                    
                    {/* 3. Icon Selector */}
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
                    
                    {/* 4. Color Selector */}
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

                    <h4 className="text-sm font-bold text-gray-500 pt-2 border-t border-gray-100">配置</h4>
                    {/* 5. Visibility Toggle */}
                    <div 
                       onClick={() => setActivityIsActive(v => !v)}
                       className="flex items-center justify-between bg-gray-50 p-3 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                        <label className="text-gray-600 font-medium">首页可见 (Quick Actions):</label>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${activityIsActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                            {activityIsActive && <Check size={16} className="text-white"/>}
                        </div>
                    </div>

                    {/* 6. Highlight Toggle (New Feature) */}
                    <div 
                       onClick={() => setActivityIsHighlight(v => !v)}
                       className="flex items-center justify-between bg-gray-50 p-3 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                        <label className="text-gray-600 font-medium flex items-center gap-2">
                            <Sparkles size={18} className="text-yellow-500" />
                            首页提醒 (Highlight)
                        </label>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">最多 3 个</span>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${activityIsHighlight ? 'bg-yellow-500' : 'bg-gray-300'}`}>
                                {activityIsHighlight && <Check size={16} className="text-white"/>}
                            </div>
                        </div>
                    </div>


                    <button
                        onClick={handleSaveActivity}
                        className="w-full bg-gray-900 text-white py-3.5 rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2 mt-6 flex-shrink-0"
                    >
                        {view === 'add' ? '添加活动类型' : '保存修改'}
                    </button>
                    
                    {view === 'edit' && (
                        <button
                            onClick={() => handleDeleteActivity(editingActivityId)}
                            className="w-full text-red-500 py-2 rounded-2xl bg-red-50 hover:bg-red-100 transition-colors text-sm"
                        >
                            删除此活动
                        </button>
                    )}

                    <button
                        onClick={() => setView('list')}
                        className="w-full text-gray-500 py-2 rounded-2xl hover:bg-gray-50 transition-colors text-sm"
                    >
                        取消
                    </button>
                </div>
            );
        }

        // Default 'list' view
        return (
            <div className="flex flex-col space-y-4">
                <p className="text-xs text-gray-500 mb-2">管理当前本子 ({activeBaby.name}) 的所有记录活动类型。右侧开关控制在首页的显示。</p>
                {activityTypes.map((activity) => (
                    <div
                        key={activity.id}
                        className={`flex items-center justify-between p-3 rounded-xl transition-all border ${activity.isActive ? 'border-blue-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-80'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 ${activity.color.replace('bg-', 'bg-')} rounded-full flex items-center justify-center text-lg shrink-0`}>
                                {activity.icon}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-semibold text-gray-800">{activity.name}</span>
                                <span className="text-xs text-gray-400 flex items-center gap-2">
                                    {activity.isHighlight && <Sparkles size={12} className="text-yellow-500" />}
                                    {activity.type === 'duration' ? '持续时间' : activity.type === 'count' ? '次数' : '数值'} ({activity.unit})
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                             {/* Toggle Switch for isActive */}
                            <div 
                                onClick={(e) => { e.stopPropagation(); handleToggleActive(activity.id); }}
                                className={`w-10 h-6 flex items-center p-1 rounded-full cursor-pointer transition-colors shrink-0 ${activity.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                            >
                                <div 
                                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${activity.isActive ? 'translate-x-3' : 'translate-x-0'}`}
                                ></div>
                            </div>

                            <button
                                onClick={() => {
                                    setEditingActivityId(activity.id);
                                    setView('edit');
                                }}
                                className="p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-100 transition-colors shrink-0"
                            >
                                <Edit3 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
                
                {/* Add New Activity Button */}
                <button 
                    onClick={() => setView('add')}
                    className="w-full flex items-center justify-center gap-2 py-3 mt-4 bg-blue-50 text-blue-600 rounded-2xl font-bold hover:bg-blue-100 transition-colors"
                >
                    <Plus size={18} /> 新增活动类型
                </button>
            </div>
        );
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={
                view === 'list' ? '活动类型管理 (首页配置)' : 
                view === 'add' ? '新增活动类型' : '编辑活动类型'
            }
        >
            {renderContent()}
        </Modal>
    );
};


/**
 * 宝贝/本子管理组件
 */
const BabyManagerModal = ({ isOpen, onClose, babies, activeBabyId, setActiveBabyId, onAddBaby, onUpdateBaby, onDeleteBaby }) => {
    const [view, setView] = useState('list'); // 'list', 'add', 'edit'
    const [newBabyName, setNewBabyName] = useState('');
    const [newBabyDate, setNewBabyDate] = useState(formatDateKey(new Date()));
    const [editingBabyId, setEditingBabyId] = useState(null);

    const activeBaby = useMemo(() => babies.find(b => b.id === activeBabyId), [babies, activeBabyId]);
    const editingBaby = useMemo(() => babies.find(b => b.id === editingBabyId), [babies, editingBabyId]);

    useEffect(() => {
        if (view === 'add') {
            setNewBabyName('');
            setNewBabyDate(formatDateKey(new Date()));
        } else if (view === 'edit' && editingBaby) {
            setNewBabyName(editingBaby.name);
            setNewBabyDate(editingBaby.startDate);
        }
    }, [view, editingBaby]);

    const handleSaveBaby = () => {
        if (!newBabyName.trim() || !newBabyDate) {
            alert('请输入本子名称和开始日期');
            return;
        }

        const babyData = {
            name: newBabyName.trim(),
            startDate: newBabyDate,
            // 默认图标改为 📒
            icon: editingBaby?.icon || '📒', 
            color: editingBaby?.color || 'bg-orange-100',
        };

        if (view === 'add') {
            onAddBaby(babyData);
        } else if (view === 'edit' && editingBabyId) {
            onUpdateBaby(editingBabyId, babyData);
        }

        setView('list'); 
        setEditingBabyId(null);
    };

    const handleSwitchBaby = (id) => {
        setActiveBabyId(id);
        onClose();
    };

    const renderContent = () => {
        if (view === 'add' || view === 'edit') {
            return (
                <div className="flex flex-col space-y-5">
                    <input
                        type="text"
                        placeholder="本子名称（宝贝昵称）"
                        value={newBabyName}
                        onChange={(e) => setNewBabyName(e.target.value)}
                        className="text-lg font-bold p-3 border-b-2 border-gray-100 focus:border-blue-300 outline-none transition-colors rounded-xl"
                    />
                    
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                        <label className="text-gray-500 font-medium">开始日期:</label>
                        <input
                            type="date"
                            value={newBabyDate}
                            onChange={(e) => setNewBabyDate(e.target.value)}
                            className="bg-white p-2 rounded-lg text-sm font-mono border border-gray-200"
                            max={formatDateKey(new Date())} 
                        />
                    </div>
                    
                    {view === 'edit' && editingBabyId && (
                         <button
                            onClick={() => onDeleteBaby(editingBabyId)}
                            className="w-full text-red-500 py-3 rounded-2xl bg-red-50 hover:bg-red-100 font-bold transition-colors text-sm"
                        >
                            删除本子 (包括所有记录)
                        </button>
                    )}

                    <button
                        onClick={handleSaveBaby}
                        className="w-full bg-gray-900 text-white py-3.5 rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2 mt-6 flex-shrink-0"
                    >
                        {view === 'add' ? '创建本子' : '保存修改'}
                    </button>

                    <button
                        onClick={() => setView('list')}
                        className="w-full text-gray-500 py-2 rounded-2xl hover:bg-gray-50 transition-colors text-sm"
                    >
                        取消
                    </button>
                </div>
            );
        }

        // Default 'list' view
        return (
            <div className="flex flex-col space-y-4">
                <div className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wide">
                    {babies.length} 个本子可用
                </div>
                {babies.map((baby) => (
                    <div
                        key={baby.id}
                        className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                            baby.id === activeBabyId ? 'bg-blue-50 border-2 border-blue-300' : 'bg-white border border-gray-100 hover:bg-gray-50'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm text-2xl`}>
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
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingBabyId(baby.id);
                                    setView('edit');
                                }}
                                className="p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-100 transition-colors"
                            >
                                <Edit3 size={16} />
                            </button>
                            
                            {baby.id !== activeBabyId && (
                                <button
                                    onClick={() => handleSwitchBaby(baby.id)}
                                    className="px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full hover:bg-blue-600 transition-colors"
                                >
                                    切换
                                </button>
                            )}
                            
                            {baby.id === activeBabyId && (
                                <span className="text-blue-500 text-sm font-semibold">使用中</span>
                            )}
                        </div>
                    </div>
                ))}
                
                <button 
                    onClick={() => setView('add')}
                    className="w-full flex items-center justify-center gap-2 py-3 mt-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                >
                    <Plus size={18} /> 新建本子
                </button>
            </div>
        );
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={
                view === 'list' ? '本子管理' : 
                view === 'add' ? '新建本子' : '编辑本子信息'
            }
        >
            {renderContent()}
        </Modal>
    );
};


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

  const daysOld = calculateDaysOld(activeBaby.startDate);
  const activityTypes = activeBaby.activityTypes || [];
  
  // Filter activities based on the new isActive flag
  const activeActivityTypes = activityTypes.filter(a => a.isActive);

  // Timer Hook for dynamic activities
  const TimerDisplay = ({ activity }) => {
    const { isTiming, elapsedMs } = useTimer(timerStates, setTimerStates, activity.id, activeBaby.id);
    
    // Determine button state and color
    const baseColorClass = activity.color.replace('-600', '-50');
    const ringColorClass = activity.color.replace('bg-', 'ring-');
    const textColorClass = activity.color.replace('bg-', 'text-');
    const isDurationTimer = activity.type === 'duration' && activity.isTimer;

    const handleAction = () => {
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

    return (
        <button 
          onClick={handleAction}
          className={`rounded-[2rem] p-5 flex flex-col items-center justify-center gap-3 aspect-square active:scale-95 duration-200 transition-all relative overflow-hidden ${
            isTiming 
                ? `${activity.color} text-white shadow-lg ${ringColorClass.replace('text-', 'ring-')} ring-4`
                : `${baseColorClass} hover:${baseColorClass.replace('-50', '-100')} text-gray-700`
          }`}
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
          </div>
        </button>
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
  
  // Filter active activities into categories for layout
  const timerActivities = activeActivityTypes.filter(a => a.type === 'duration' && a.isTimer);
  const quickCountActivities = activeActivityTypes.filter(a => a.type === 'count');
  const valueActivities = activeActivityTypes.filter(a => a.type === 'value' || (a.type === 'duration' && !a.isTimer));

  return (
    <div className="pt-14 pb-24 px-5 space-y-6 animate-fade-in h-full overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="flex justify-between items-center">
        {/* 标题更新为“今日记录” */}
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

      {/* Action Grid - Timer Activities */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">计时活动 ({timerActivities.length})</h2>
        <div className="grid grid-cols-3 gap-4">
            {timerActivities.map(activity => (
                <TimerDisplay key={activity.id} activity={activity} />
            ))}
            {timerActivities.length === 0 && (
                 <p className="text-xs text-gray-400 col-span-3 pt-2">暂无计时活动，请在设置中添加/显示。</p>
            )}
        </div>
      </div>

      {/* Action Grid - Count Activities */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">快速记录 ({quickCountActivities.length})</h2>
        <div className="grid grid-cols-3 gap-4">
            {quickCountActivities.map(activity => (
                <TimerDisplay key={activity.id} activity={activity} />
            ))}
            {quickCountActivities.length === 0 && (
                 <p className="text-xs text-gray-400 col-span-3 pt-2">暂无快速记录活动，请在设置中添加/显示。</p>
            )}
        </div>
      </div>
      
      {/* Action Grid - Value/Duration Activities */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">数值输入 ({valueActivities.length})</h2>
        <div className="grid grid-cols-3 gap-4">
            {valueActivities.map(activity => (
                <TimerDisplay key={activity.id} activity={activity} />
            ))}
            {valueActivities.length === 0 && (
                 <p className="text-xs text-gray-400 col-span-3 pt-2">暂无数值输入活动，请在设置中添加/显示。</p>
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


// 4. Records Screen (Simplified logic to use generic activity data)
const RecordsScreen = ({ records, onUpdateRecord, onDeleteRecord, activeBaby }) => {
  const [editingRecord, setEditingRecord] = useState(null);
  const [editValue, setEditValue] = useState(0); 
  
  // Filter and enrich records
  const activityMap = useMemo(() => activeBaby.activityTypes.reduce((acc, curr) => {
      acc[curr.id] = curr;
      return acc;
  }, {}), [activeBaby.activityTypes]);
  
  const activeBabyRecords = records
    .filter(r => r.babyId === activeBaby.id)
    .map(r => ({
        ...r,
        activity: activityMap[r.activityTypeId] || { name: '未知活动', icon: '❓', color: 'bg-gray-300', type: 'count', unit: '?' }
    }));


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
      
      onUpdateRecord(updated);
      setEditingRecord(null);
  };
  
  const sortedRecords = [...activeBabyRecords].sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

  return (
    <div className="pt-14 pb-24 px-5 h-full flex flex-col animate-fade-in overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h1 className="text-xl font-bold text-gray-900">{activeBaby.name} 的记录</h1>
        <div className="text-xs text-gray-500 font-medium">{sortedRecords.length} 条记录</div>
      </div>

      {/* Timeline List */}
      <div className="flex-1 relative overflow-y-auto no-scrollbar pr-2">
        <div className="absolute left-[54px] top-2 bottom-0 w-[2px] bg-gray-100 h-full -z-10"></div>

        <div className="space-y-6 pb-20">
          {sortedRecords.length === 0 ? (
            <div className="text-center text-gray-300 mt-20">暂无记录，快去首页添加吧</div>
          ) : (
            sortedRecords.map((record) => (
              <div 
                key={record.id} 
                onClick={() => setEditingRecord(record)}
                className="flex gap-4 group cursor-pointer active:opacity-70 transition-opacity"
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
            ))
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingRecord && (
        <Modal isOpen={!!editingRecord} onClose={() => setEditingRecord(null)} title={`编辑 ${editingRecord.activity.name}`}>
            
            <div className="flex-1 overflow-y-auto pr-2 mb-4">
              
              {/* Conditional Number Selector for Editable Types */}
              {(editingRecord.activity.type === 'value' || editingRecord.activity.type === 'duration') ? (
                  <div className="space-y-6">
                      <NumberSelector 
                          value={editValue}
                          setValue={setEditValue}
                          unit={editingRecord.activity.type === 'duration' ? '分钟' : editingRecord.activity.unit}
                          step={editingRecord.activity.unit === 'ml' ? 10 : 1}
                          min={1}
                          max={editingRecord.activity.type === 'duration' ? 360 : 300}
                      />
                      
                      <button 
                        onClick={handleSaveEdit}
                        className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2 mt-4"
                      >
                         <Check size={18} /> 保存修改
                      </button>
                  </div>
              ) : (
                  <div className="text-center p-6 bg-gray-50 rounded-xl text-gray-600">
                     <div className="text-xl font-bold">事件记录</div>
                     <p className="text-sm mt-2">次数型记录（如“臭臭”）通常是单次事件，数值固定为 1，不可编辑数值。</p>
                  </div>
              )}
            </div>
            
            <div className="flex-shrink-0 mt-4 border-t border-gray-100 pt-4">
                <button 
                   onClick={() => {
                       // Note: Using window.confirm() here as per existing pattern
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


// 5. Analysis Screen remains simple for now
const AnalysisScreen = ({ activeBaby }) => {
    // Note: Analysis needs significant refactoring to handle dynamic activity types
    return (
        <div className="pt-14 pb-24 px-5 animate-fade-in h-full overflow-y-auto no-scrollbar">
           <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">📊 数据分析</h1>
           </div>
           <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100">
              <h3 className="font-bold text-gray-700 mb-4">功能正在升级...</h3>
              <p className="text-sm text-gray-500">
                  当前本子: **{activeBaby.name}**
              </p>
              <p className="text-sm text-gray-500 mt-3">
                  由于记录项已抽象为自定义活动类型，分析模块正在升级，以支持您自定义的全部活动（如：睡眠、抽烟、喝水等）的数据可视化。
              </p>
              <div className="mt-4 p-3 bg-blue-50 rounded-xl text-blue-700 text-sm">
                  敬请期待强大的自定义报表功能！
              </div>
           </div>
        </div>
    );
};


// Main App Component
const App = () => {
  const initialBabyId = 'default-anne';
  const INACTIVITY_TIME = 10000; // 10 seconds for inactivity trigger
  
  // Data Migration Helper: Ensures baby objects have activityTypes and that each activity has 'isActive' and 'isHighlight'
  const initializeBabies = (savedBabies) => {
    return savedBabies.map(baby => {
        let activities = baby.activityTypes || [];
        if (activities.length === 0) {
            activities = DEFAULT_ACTIVITY_TYPES;
        } else {
            // Migration check: Ensure all activities have the new isActive/isHighlight property
            activities = activities.map(a => ({
                ...a,
                isActive: a.isActive !== undefined ? a.isActive : true,
                isHighlight: a.isHighlight !== undefined ? a.isHighlight : false
            }));
        }
        return { ...baby, activityTypes: activities };
    });
  };

  const initialBabies = useMemo(() => {
    const saved = localStorage.getItem('baby_babies');
    const defaultBaby = [{ 
      id: initialBabyId, 
      // 默认名称改为 "点点 (默认本)"
      name: '点点 (默认本)', 
      startDate: formatDateKey(new Date(Date.now() - 108 * 24 * 60 * 60 * 1000)),
      icon: '👶', // 默认宝贝仍使用宝宝图标
      color: 'bg-orange-100',
      activityTypes: DEFAULT_ACTIVITY_TYPES 
    }];
    
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            return parsed.length > 0 ? initializeBabies(parsed) : defaultBaby;
        } catch (e) {
            return defaultBaby;
        }
    }
    return defaultBaby;
  }, [initialBabyId]);

  // States
  const [activeTab, setActiveTab] = useState('home');
  const [babies, setBabies] = useState(initialBabies);
  const [activeBabyId, setActiveBabyId] = useState(() => {
    const saved = localStorage.getItem('baby_active_baby_id');
    const validId = saved && initialBabies.some(b => b.id === saved) ? saved : initialBabyId;
    return validId;
  });
  
  const [records, setRecords] = useState(() => {
    const saved = localStorage.getItem('baby_records');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Generalized Timer States: { babyId: { activityId: { isTiming, startTime } } }
  const [timerStates, setTimerStates] = useState(() => {
    const saved = localStorage.getItem('baby_timer_states');
    return saved ? JSON.parse(saved) : {};
  });
  
  // New State for Highlight Modal
  const [showHighlightModal, setShowHighlightModal] = useState(false);
  const inactivityTimerRef = useRef(null);

  // Get active baby object
  const activeBaby = useMemo(() => babies.find(b => b.id === activeBabyId) || babies[0], [babies, activeBabyId]);

  // --- Persistence Effects ---
  useEffect(() => { localStorage.setItem('baby_babies', JSON.stringify(babies)); }, [babies]);
  useEffect(() => { localStorage.setItem('baby_active_baby_id', activeBabyId); }, [activeBabyId]);
  useEffect(() => { localStorage.setItem('baby_records', JSON.stringify(records)); }, [records]);
  useEffect(() => { localStorage.setItem('baby_timer_states', JSON.stringify(timerStates)); }, [timerStates]);
  
  // --- Inactivity Timer Logic ---
  const resetInactivityTimer = useCallback(() => {
      // Clear existing timer
      if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
      }
      
      // If on 'home' tab and highlight modal is not already visible
      if (activeTab === 'home' && !showHighlightModal) {
          const hasHighlights = activeBaby.activityTypes?.some(a => a.isHighlight);
          if (hasHighlights) {
              inactivityTimerRef.current = setTimeout(() => {
                  setShowHighlightModal(true);
              }, INACTIVITY_TIME);
          }
      }
  }, [activeTab, showHighlightModal, activeBaby, INACTIVITY_TIME]);


  // Effect to manage global interaction listeners
  useEffect(() => {
      const events = ['mousemove', 'mousedown', 'touchstart', 'scroll'];
      
      // Initial setup or when activeTab/activeBaby changes
      resetInactivityTimer();

      // Only listen to interactions if on the home screen
      if (activeTab === 'home') {
          const handleInteraction = () => resetInactivityTimer();

          // Attach listeners to the main window/document
          events.forEach(event => document.addEventListener(event, handleInteraction));

          return () => {
              if (inactivityTimerRef.current) {
                  clearTimeout(inactivityTimerRef.current);
              }
              events.forEach(event => document.removeEventListener(event, handleInteraction));
          };
      }
      
      // Clear timer if navigating away from home screen
      return () => {
          if (inactivityTimerRef.current) {
              clearTimeout(inactivityTimerRef.current);
          }
      }
  }, [activeTab, resetInactivityTimer]);


  // --- Baby/Book Actions ---

  const addBaby = (newBaby) => {
    const babyWithId = { 
        ...newBaby, 
        id: generateId(), 
        activityTypes: DEFAULT_ACTIVITY_TYPES 
    }; // New babies get default activities
    setBabies(prev => [...prev, babyWithId]);
    setActiveBabyId(babyWithId.id); 
  };
  
  const updateBaby = (id, updates) => {
      setBabies(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };
  
  const deleteBaby = (id) => {
      if (babies.length <= 1) {
          alert("无法删除最后一个本子！");
          return;
      }
      // Note: Using window.confirm() here as per existing pattern
      if (!window.confirm("警告：删除本子将永久删除所有相关记录。确定删除吗？")) return;
      
      const remainingBabies = babies.filter(b => b.id !== id);
      setBabies(remainingBabies);
      setRecords(prev => prev.filter(r => r.babyId !== id)); // Delete associated records
      setTimerStates(prev => { 
          const newState = { ...prev };
          delete newState[id];
          return newState;
      });
      
      // Switch active baby if the deleted one was active
      if (activeBabyId === id) {
          setActiveBabyId(remainingBabies[0].id);
      }
  }
  
  const updateBabyActivities = (newActivities) => {
      setBabies(prev => prev.map(b => 
          b.id === activeBabyId ? { ...b, activityTypes: newActivities } : b
      ));
  };

  // --- Record Actions ---

  const addRecord = (record) => {
    const newRecord = { 
        ...record, 
        id: generateId(), 
        babyId: activeBabyId, 
        timestamp: Date.now() 
    };
    setRecords(prev => [newRecord, ...prev]);
  };

  const updateRecord = (updatedRecord) => {
    setRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
  };

  const deleteRecord = (id) => {
    setRecords(prev => prev.filter(r => r.id !== id));
  };
  
  // --- Timer Actions ---
  
  const stopTimer = (activityId, elapsedMs) => {
      const current = timerStates[activeBabyId]?.[activityId];
      if (!current || !current.isTiming) return;
      
      const endTime = new Date();
      const startTime = new Date(current.startTime);
      const activity = activeBaby.activityTypes.find(a => a.id === activityId);
      
      // 1. Record the event
      const record = {
        type: 'duration',
        activityTypeId: activityId,
        name: activity?.name || '计时活动',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: elapsedMs,
        value: Math.round(elapsedMs / 60000), // Value is duration in minutes
        unit: activity?.unit || '分钟',
      };
      addRecord(record);
      
      // 2. Clear timer state for THIS specific activity/baby
      setTimerStates(prev => ({ 
          ...prev, 
          [activeBabyId]: { 
              ...(prev[activeBabyId] || {}), 
              [activityId]: { isTiming: false, startTime: null } 
          } 
      }));
  };

  return (
    <div className="bg-gray-100 min-h-screen flex justify-center items-start pt-0 sm:pt-10 font-sans selection:bg-blue-100">
      <div className="w-full sm:w-[390px] h-[100vh] sm:h-[844px] bg-[#F7F8FA] sm:rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col border-4 border-gray-900/5 sm:border-gray-900 sm:ring-4 ring-gray-200">
        {/* Mock phone elements */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-[30px] w-[120px] bg-black rounded-b-[18px] z-50 hidden sm:block pointer-events-none"></div>
        <div className="absolute top-1 right-5 text-[10px] font-bold z-50 hidden sm:block pointer-events-none text-gray-800">
           <div className="flex gap-1"><span>5G</span><div className="w-4 h-2.5 bg-gray-800 border border-gray-600 rounded-sm"></div></div>
        </div>
        <div className="absolute top-1 left-6 text-[12px] font-bold z-50 hidden sm:block pointer-events-none text-gray-800">09:41</div>

        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'home' && (
            <HomeScreen 
                activeBaby={activeBaby}
                timerStates={timerStates}
                setTimerStates={setTimerStates}
                onAddRecord={addRecord}
                onStopTimer={stopTimer}
                onUpdateBabyActivities={updateBabyActivities}
                babies={babies}
                setActiveBabyId={setActiveBabyId}
                onAddBaby={addBaby}
                onUpdateBaby={updateBaby}
                onDeleteBaby={deleteBaby}
                setShowHighlightModal={setShowHighlightModal} // Pass setter down
            />
          )}
          {activeTab === 'records' && (
            <RecordsScreen 
                records={records} 
                onUpdateRecord={updateRecord} 
                onDeleteRecord={deleteRecord} 
                activeBaby={activeBaby}
            />
          )}
          {activeTab === 'analysis' && <AnalysisScreen activeBaby={activeBaby} />}
        </div>

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Highlight Modal (Placed at root level) */}
      <HighlightModal
        isOpen={showHighlightModal}
        onClose={() => setShowHighlightModal(false)}
        activeBaby={activeBaby}
        records={records}
        timerStates={timerStates} // <-- Pass timerStates for real-time check
      />
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }

        /* Magic Move Animation */
        @keyframes magic-move {
            0% { opacity: 0; transform: scale(0.95); }
            100% { opacity: 1; transform: scale(1); }
        }
        .animate-magic-move { 
            animation: magic-move 0.35s cubic-bezier(0.25, 0.8, 0.5, 1) forwards; 
        }

        /* Basic Tailwind Color Mappings for dynamic buttons */
        .bg-blue-600 { background-color: #2563EB; }
        .bg-indigo-600 { background-color: #4F46E5; }
        .bg-purple-600 { background-color: #7C3AED; }
        .bg-orange-600 { background-color: #D97706; }
        .bg-green-600 { background-color: #059669; }
        .bg-red-600 { background-color: #DC2626; }
        .bg-yellow-600 { background-color: #CA8A04; }
        .bg-pink-600 { background-color: #EC4899; }
        .bg-gray-700 { background-color: #374151; }

        .text-blue-600 { color: #2563EB; }
        .text-indigo-600 { color: #4F46E5; }
        .text-purple-600 { color: #7C3AED; }
        .text-amber-600 { color: #D97706; }
        .text-yellow-600 { color: #CA8A04; }
        .text-gray-600 { color: #4B5563; }
        .text-red-600 { color: #DC2626; }
        .text-green-600 { color: #059669; }
        
        .ring-blue-600 { --tw-ring-color: #2563EB; }
        .ring-indigo-600 { --tw-ring-color: #4F46E5; }
        .ring-purple-600 { --tw-ring-color: #7C3AED; }
        .ring-amber-600 { --tw-ring-color: #D97706; }
        .ring-yellow-600 { --tw-ring-color: #CA8A04; }
        .ring-gray-600 { --tw-ring-color: #4B5563; }
        .ring-red-600 { --tw-ring-color: #DC2626; }
        .ring-green-600 { --tw-ring-color: #059669; }
        
        .bg-blue-50 { background-color: #EFF6FF; }
        .bg-indigo-50 { background-color: #EEF2FF; }
        .bg-purple-50 { background-color: #F5F3FF; }
        .bg-amber-50 { background-color: #FFFBEB; }
        .bg-yellow-50 { background-color: #FFFDEE; }
        .bg-gray-50 { background-color: #F9FAFB; }
        .bg-red-50 { background-color: #FEF2F2; }
        .bg-green-50 { background-color: #F0FFF4; }


      `}</style>
    </div>
  );
};


const BottomNav = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'home', label: '首页', icon: Home },
    { id: 'records', label: '记录', icon: AlignLeft },
    { id: 'analysis', label: '分析', icon: PieChart },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe pt-2 px-6 flex justify-between items-end h-[85px] z-40 rounded-t-3xl shadow-[0_-5px_15px_rgba(0,0,0,0.02)] sm:absolute sm:w-full">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center w-16 mb-2 transition-all duration-200 ${
              isActive ? 'text-blue-500' : 'text-gray-400'
            }`}
          >
            <div className={`p-1.5 rounded-full mb-1 transition-all ${isActive ? 'bg-blue-50 transform -translate-y-1' : 'bg-transparent'}`}>
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default App;
