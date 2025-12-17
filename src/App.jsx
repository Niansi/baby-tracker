import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import HomeScreen from './components/screens/HomeScreen';
import RecordsScreen from './components/screens/RecordsScreen';
import AnalysisScreen from './components/screens/AnalysisScreen';
import HighlightModal from './components/modals/HighlightModal';
import BottomNav from './components/common/BottomNav';
import { DEFAULT_ACTIVITY_TYPES, generateId } from './constants/activityTypes';
import { formatDateKey } from './utils/dateUtils';
import { getLastRecord } from './utils/recordUtils';

// Main App Component
const App = () => {
  const initialBabyId = 'default-anne';
  const INACTIVITY_TIME = 10000; // 10 seconds for inactivity trigger
  
  // Data Migration Helper: Ensures baby objects have activityTypes and that each activity has 'isActive', 'isHighlight', and 'order'
  const initializeBabies = (savedBabies) => {
    return savedBabies.map(baby => {
        let activities = baby.activityTypes || [];
        if (activities.length === 0) {
            activities = DEFAULT_ACTIVITY_TYPES;
        } else {
            // Migration check: Ensure all activities have the new isActive/isHighlight/order property
            activities = activities.map((a, index) => ({
                ...a,
                isActive: a.isActive !== undefined ? a.isActive : true,
                isHighlight: a.isHighlight !== undefined ? a.isHighlight : false,
                order: a.order !== undefined ? a.order : index
            }));
            // Sort by order to ensure correct display
            activities.sort((a, b) => (a.order || 0) - (b.order || 0));
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
  // Helper to check if there are any records for highlighted activities
  const hasHighlightRecords = useCallback(() => {
      const highlightedActivities = (activeBaby.activityTypes || []).filter(a => a.isHighlight);
      if (highlightedActivities.length === 0) return false;
      
      const activeTimers = timerStates[activeBaby.id] || {};
      
      // Check if any highlighted activity has records or is currently timing
      return highlightedActivities.some(activity => {
          // If currently timing, consider it as having data
          const timer = activeTimers[activity.id];
          if (activity.type === 'duration' && activity.isTimer && timer && timer.isTiming) {
              return true;
          }
          // Check if there's a record
          const lastRecord = getLastRecord(records, activeBaby.id, activity.id);
          return !!lastRecord;
      });
  }, [activeBaby, records, timerStates]);

  const resetInactivityTimer = useCallback(() => {
      // Clear existing timer
      if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
      }
      
      // If on 'home' tab and highlight modal is not already visible
      if (activeTab === 'home' && !showHighlightModal) {
          const hasHighlights = activeBaby.activityTypes?.some(a => a.isHighlight);
          // Only trigger timer if there are records (not just highlights)
          if (hasHighlights && hasHighlightRecords()) {
              inactivityTimerRef.current = setTimeout(() => {
                  setShowHighlightModal(true);
              }, INACTIVITY_TIME);
          }
      }
  }, [activeTab, showHighlightModal, activeBaby, hasHighlightRecords]);


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

export default App;
