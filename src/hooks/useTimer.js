import { useState, useEffect, useMemo } from 'react';

/**
 * Hook 用于管理持续时间型活动的独立计时器
 */
export const useTimer = (timerState, setTimerState, activityId, babyId) => {
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
    
    // 如果组件挂载时计时器处于活动状态，重新计算 elapsedMs
    useEffect(() => {
        if (currentTimer.isTiming && currentTimer.startTime) {
            setElapsedMs(new Date().getTime() - new Date(currentTimer.startTime).getTime());
        }
    }, [currentTimer.isTiming, currentTimer.startTime]);

    return { isTiming: currentTimer.isTiming, elapsedMs, startMs: new Date(currentTimer.startTime).getTime() };
};

