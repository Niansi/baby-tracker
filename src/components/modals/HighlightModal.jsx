import React, { useState, useEffect, useMemo } from 'react';
import { formatDurationChinese, formatElapsedChineseHMS } from '../../utils/formatUtils';
import { getLastRecord } from '../../utils/recordUtils';

// New Highlight Modal Component - Full Screen Poster Design
const HighlightModal = ({ isOpen, onClose, activeBaby, records, timerStates }) => {
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
                    // Return object with hasNoRecord flag, but still include it in reminders
                    return { 
                        activity, 
                        elapsedMs: 0, // Use 0 instead of null to ensure it's included
                        lastRecordDescription: '暂无记录', 
                        isTiming: false,
                        hasNoRecord: true,
                        formattedTime: '暂无记录'
                    };
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
                hasNoRecord: false,
                // Use H/M/S for running timers, H/M for elapsed time since last record
                formattedTime: isTiming ? formatElapsedChineseHMS(displayTimeMs) : formatDurationChinese(displayTimeMs)
            };
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [highlightedActivities, records, activeBaby.id, timerStates, tick]); 

    // Handle click to close - close on any click
    const handleClick = () => {
        onClose();
    };

    if (!isOpen || highlightedActivities.length === 0) {
        return null;
    }
    
    // Ensure all highlighted activities are shown, even if they have no records
    // The reminders array should already contain all activities (with hasNoRecord flag for those without records)

    // Get high contrast color based on activity color
    const getHighContrastColor = (colorClass) => {
        const colorMap = {
            'blue': '#2563EB',      // blue-600
            'indigo': '#4F46E5',    // indigo-600
            'purple': '#7C3AED',    // purple-600
            'orange': '#D97706',    // orange-600
            'green': '#059669',     // green-600
            'red': '#DC2626',       // red-600
            'yellow': '#CA8A04',    // yellow-600
            'pink': '#EC4899',      // pink-600
            'amber': '#D97706',     // amber-600
        };
        const colorName = colorClass.replace('text-', '').replace('-600', '');
        return colorMap[colorName] || '#000000';
    };

    // Parse time string into structured format
    const parseTimeDisplay = (formattedTime) => {
        if (formattedTime === '暂无记录') {
            return [{ value: '暂无记录', unit: '' }];
        }
        const parts = [];
        const hourMatch = formattedTime.match(/(\d+)小时/);
        const minuteMatch = formattedTime.match(/(\d+)分钟/);
        const secondMatch = formattedTime.match(/(\d+)秒/);
        
        if (hourMatch) parts.push({ value: hourMatch[1], unit: '小时' });
        if (minuteMatch) parts.push({ value: minuteMatch[1], unit: '分钟' });
        if (secondMatch) parts.push({ value: secondMatch[1], unit: '秒' });
        
        return parts.length > 0 ? parts : [{ value: formattedTime, unit: '' }];
    };

    // Use white background for all cases
    const bgColor = 'bg-white';
    const textColor = 'text-black';

    return (
        <div 
            className="fixed inset-0 z-[200] bg-white flex items-center justify-center p-0 animate-fade-in cursor-pointer"
            onClick={handleClick}
            style={{ backgroundColor: '#FFFFFF' }}
        >
            <div className="w-full h-full flex flex-col">
                {reminders.map((reminder, index) => {
                    const timeParts = parseTimeDisplay(reminder.formattedTime);
                    const activityColor = getHighContrastColor(reminder.activity.color.replace('bg-', 'text-'));
                    const isNoRecord = reminder.hasNoRecord;
                    const isLast = index === reminders.length - 1;
                    
                    return (
                        <div 
                            key={reminder.activity.id}
                            className="w-full flex-1 flex flex-col items-center justify-center"
                            style={{
                                minHeight: `${100 / reminders.length}vh`,
                                paddingTop: index === 0 ? '6vh' : '1vh',
                                paddingBottom: isLast ? '6vh' : '1vh'
                            }}
                        >
                            {/* Icon and Activity Name in same line */}
                            <div className="flex items-center justify-center gap-4 sm:gap-6 mb-4 sm:mb-6">
                                <div 
                                    className="text-5xl sm:text-6xl"
                                    style={{ color: activityColor }}
                                >
                                    {reminder.activity.icon}
                                </div>
                                <div 
                                    className="text-3xl sm:text-5xl font-bold tracking-tight text-black"
                                >
                                    {reminder.isTiming ? `正在 ${reminder.activity.name}` : reminder.activity.name}
                                </div>
                            </div>

                            {/* Time Display */}
                            <div className="text-center">
                                {isNoRecord ? (
                                    <div 
                                        className="text-8xl sm:text-[10rem] font-black leading-none tracking-tighter"
                                        style={{ 
                                            color: activityColor,
                                            fontFamily: 'system-ui, -apple-system, sans-serif',
                                            fontWeight: 900
                                        }}
                                    >
                                        暂无记录
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap items-baseline justify-center gap-3 sm:gap-5">
                                        {timeParts.map((part, i) => (
                                            <div key={i} className="flex items-baseline gap-2 sm:gap-3">
                                                <span 
                                                    className="text-8xl sm:text-[10rem] font-black leading-none tracking-tighter"
                                                    style={{ 
                                                        color: activityColor,
                                                        fontFamily: 'system-ui, -apple-system, sans-serif',
                                                        fontWeight: 900,
                                                        letterSpacing: '-0.05em'
                                                    }}
                                                >
                                                    {part.value}
                                                </span>
                                                {part.unit && (
                                                    <span 
                                                        className="text-4xl sm:text-6xl font-bold"
                                                        style={{ 
                                                            color: activityColor,
                                                            letterSpacing: '0.05em'
                                                        }}
                                                    >
                                                        {part.unit}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            {!isNoRecord && (
                                <div 
                                    className="text-xl sm:text-2xl font-medium mt-4 sm:mt-6 opacity-50 text-black"
                                >
                                    {reminder.isTiming 
                                        ? '实时计时中' 
                                        : `上次：${reminder.lastRecordDescription}`
                                    }
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default HighlightModal;

