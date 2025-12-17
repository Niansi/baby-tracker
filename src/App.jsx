import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import HomeScreen from './components/screens/HomeScreen';
import RecordsScreen from './components/screens/RecordsScreen';
import AnalysisScreen from './components/screens/AnalysisScreen';
import SettingsScreen from './components/screens/SettingsScreen';
import HighlightModal from './components/modals/HighlightModal';
import BottomNav from './components/common/BottomNav';
import { DEFAULT_ACTIVITY_TYPES, generateId } from './constants/activityTypes';
import { formatDateKey } from './utils/dateUtils';
import { getLastRecord } from './utils/recordUtils';

// Main App Component
const App = () => {
  const initialBabyId = 'default-anne';
  const INACTIVITY_TIME = 10000; // 10 seconds for inactivity trigger
  
  // Data Migration Helper: Migrate from old structure (activityTypes) to new structure (global activities + activityConfigs)
  const migrateDataStructure = (savedBabies, savedActivities) => {
    // Check if migration is needed (old structure has activityTypes, new structure has activityConfigs)
    const needsMigration = savedBabies.some(baby => baby.activityTypes && !baby.activityConfigs);
    
    if (!needsMigration) {
      return { babies: savedBabies, activities: savedActivities || DEFAULT_ACTIVITY_TYPES };
    }
    
    // Extract all unique activities from all babies to create global activities
    const allActivitiesMap = new Map();
    
    savedBabies.forEach(baby => {
      const activities = baby.activityTypes || [];
      activities.forEach(activity => {
        if (!allActivitiesMap.has(activity.id)) {
          // Extract fixed properties only
          allActivitiesMap.set(activity.id, {
            id: activity.id,
            name: activity.name,
            type: activity.type,
            unit: activity.unit,
            icon: activity.icon,
            color: activity.color,
            isTimer: activity.isTimer || false
          });
        }
      });
    });
    
    // If no activities found, use defaults
    const globalActivities = allActivitiesMap.size > 0 
      ? Array.from(allActivitiesMap.values())
      : DEFAULT_ACTIVITY_TYPES;
    
    // Convert each baby's activityTypes to activityConfigs
    const migratedBabies = savedBabies.map(baby => {
      const activities = baby.activityTypes || [];
      const activityConfigs = activities.map((activity, index) => ({
        activityId: activity.id,
        isActive: activity.isActive !== undefined ? activity.isActive : true,
        isHighlight: activity.isHighlight !== undefined ? activity.isHighlight : false,
        order: activity.order !== undefined ? activity.order : index
      }));
      
      // Sort by order
      activityConfigs.sort((a, b) => (a.order || 0) - (b.order || 0));
      
      // Remove activityTypes and add activityConfigs
      const { activityTypes, ...babyWithoutActivities } = baby;
      return { ...babyWithoutActivities, activityConfigs };
    });
    
    return { babies: migratedBabies, activities: globalActivities };
  };
  
  // Initialize babies with migration
  const { initialBabies, initialGlobalActivities } = useMemo(() => {
    const savedBabies = localStorage.getItem('baby_babies');
    const savedActivities = localStorage.getItem('baby_activities');
    
    let parsedBabies = [];
    if (savedBabies) {
      try {
        parsedBabies = JSON.parse(savedBabies);
      } catch (e) {
        parsedBabies = [];
      }
    }
    
    let parsedActivities = null;
    if (savedActivities) {
      try {
        parsedActivities = JSON.parse(savedActivities);
      } catch (e) {
        parsedActivities = null;
      }
    }
    
    const defaultBaby = [{ 
      id: initialBabyId, 
      name: '点点', 
      startDate: formatDateKey(new Date(Date.now() - 108 * 24 * 60 * 60 * 1000)),
      icon: '👶',
      color: 'bg-orange-100',
      activityConfigs: DEFAULT_ACTIVITY_TYPES.map((activity, index) => ({
        activityId: activity.id,
        isActive: true,
        isHighlight: activity.id === 'a-sleep', // Default highlight for sleep
        order: index
      }))
    }];
    
    if (parsedBabies.length === 0) {
      return { initialBabies: defaultBaby, initialGlobalActivities: DEFAULT_ACTIVITY_TYPES };
    }
    
    const { babies, activities } = migrateDataStructure(parsedBabies, parsedActivities);
    return { initialBabies: babies, initialGlobalActivities: activities };
  }, [initialBabyId]);

  // States
  const [activeTab, setActiveTab] = useState('home');
  const [babies, setBabies] = useState(initialBabies);
  const [activities, setActivities] = useState(initialGlobalActivities); // Global activities library
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
  
  // Highlight Settings State
  const [highlightShowSeconds, setHighlightShowSeconds] = useState(() => {
    const saved = localStorage.getItem('baby_highlight_show_seconds');
    return saved === 'true';
  });

  // Get active baby object
  const activeBaby = useMemo(() => babies.find(b => b.id === activeBabyId) || babies[0], [babies, activeBabyId]);
  
  // Helper function: Merge global activities with baby's activity configs
  const getBabyActivities = useCallback((baby) => {
    if (!baby || !baby.activityConfigs) return [];
    
    const activityMap = new Map(activities.map(a => [a.id, a]));
    
    return baby.activityConfigs
      .map(config => {
        const activity = activityMap.get(config.activityId);
        if (!activity) return null;
        
        return {
          ...activity, // Fixed properties from global activities
          ...config,   // Baby-specific properties (isActive, isHighlight, order)
          id: activity.id // Ensure id is from activity
        };
      })
      .filter(Boolean)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [activities]);
  
  // Get active baby's merged activities
  const activeBabyActivities = useMemo(() => getBabyActivities(activeBaby), [activeBaby, getBabyActivities]);

  // --- Persistence Effects ---
  useEffect(() => { localStorage.setItem('baby_babies', JSON.stringify(babies)); }, [babies]);
  useEffect(() => { localStorage.setItem('baby_activities', JSON.stringify(activities)); }, [activities]);
  useEffect(() => { localStorage.setItem('baby_active_baby_id', activeBabyId); }, [activeBabyId]);
  useEffect(() => { localStorage.setItem('baby_records', JSON.stringify(records)); }, [records]);
  useEffect(() => { localStorage.setItem('baby_timer_states', JSON.stringify(timerStates)); }, [timerStates]);
  useEffect(() => { localStorage.setItem('baby_highlight_show_seconds', highlightShowSeconds.toString()); }, [highlightShowSeconds]);
  
  // --- Inactivity Timer Logic ---
  // Helper to check if there are any records for highlighted activities
  const hasHighlightRecords = useCallback(() => {
      const highlightedActivities = activeBabyActivities.filter(a => a.isHighlight);
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
  }, [activeBabyActivities, activeBaby.id, records, timerStates]);

  const resetInactivityTimer = useCallback(() => {
      // Clear existing timer
      if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
      }
      
      // If on 'home' tab and highlight modal is not already visible
      if (activeTab === 'home' && !showHighlightModal) {
          const hasHighlights = activeBabyActivities.some(a => a.isHighlight);
          // Only trigger timer if there are records (not just highlights)
          if (hasHighlights && hasHighlightRecords()) {
              inactivityTimerRef.current = setTimeout(() => {
                  setShowHighlightModal(true);
              }, INACTIVITY_TIME);
          }
      }
  }, [activeTab, showHighlightModal, activeBabyActivities, hasHighlightRecords]);


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
    // New babies get all global activities as configs
    const activityConfigs = activities.map((activity, index) => ({
      activityId: activity.id,
      isActive: true,
      isHighlight: false,
      order: index
    }));
    
    const babyWithId = { 
        ...newBaby, 
        id: generateId(), 
        activityConfigs
    };
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
  
  // Update baby's activity configs
  const updateBabyActivityConfigs = (babyId, newConfigs) => {
      setBabies(prev => prev.map(b => 
          b.id === babyId ? { ...b, activityConfigs: newConfigs } : b
      ));
  };
  
  // Global activities management
  const addActivity = (newActivity) => {
    const activityWithId = {
      ...newActivity,
      id: generateId()
    };
    setActivities(prev => [...prev, activityWithId]);
    
    // Add to all babies' configs by default
    setBabies(prev => prev.map(baby => {
      const maxOrder = baby.activityConfigs.length > 0
        ? Math.max(...baby.activityConfigs.map(c => c.order || 0))
        : -1;
      return {
        ...baby,
        activityConfigs: [
          ...baby.activityConfigs,
          {
            activityId: activityWithId.id,
            isActive: true,
            isHighlight: false,
            order: maxOrder + 1
          }
        ]
      };
    }));
  };
  
  const updateActivity = (id, updates) => {
    setActivities(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };
  
  const deleteActivity = (id) => {
    // Check if any baby is using this activity
    const isUsed = babies.some(baby => 
      baby.activityConfigs?.some(config => config.activityId === id)
    );
    
    if (isUsed) {
      alert('无法删除：有本子正在使用此活动。请先从所有本子中移除该活动。');
      return;
    }
    
    setActivities(prev => prev.filter(a => a.id !== id));
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
      const activity = activeBabyActivities.find(a => a.id === activityId);
      
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
    <div className="bg-gray-100 min-h-screen flex justify-center items-start font-sans selection:bg-blue-100">
      <div className="w-full h-[100vh] bg-[#F7F8FA] relative overflow-hidden flex flex-col md:max-w-[800px] lg:max-w-[1200px]">

        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'home' && (
            <HomeScreen 
                activeBaby={activeBaby}
                activeBabyActivities={activeBabyActivities}
                timerStates={timerStates}
                setTimerStates={setTimerStates}
                onAddRecord={addRecord}
                onStopTimer={stopTimer}
                setShowHighlightModal={setShowHighlightModal}
                onUpdateBabyActivityConfigs={updateBabyActivityConfigs}
            />
          )}
          {activeTab === 'records' && (
            <RecordsScreen 
                records={records} 
                onUpdateRecord={updateRecord} 
                onDeleteRecord={deleteRecord} 
                activeBaby={activeBaby}
                activeBabyActivities={activeBabyActivities}
            />
          )}
          {activeTab === 'analysis' && (
            <AnalysisScreen 
                activeBaby={activeBaby}
                activeBabyActivities={activeBabyActivities}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsScreen
                babies={babies}
                activities={activities}
                activeBabyId={activeBabyId}
                setActiveBabyId={setActiveBabyId}
                onAddBaby={addBaby}
                onUpdateBaby={updateBaby}
                onDeleteBaby={deleteBaby}
                onUpdateBabyActivityConfigs={updateBabyActivityConfigs}
                onAddActivity={addActivity}
                onUpdateActivity={updateActivity}
                onDeleteActivity={deleteActivity}
                getBabyActivities={getBabyActivities}
                highlightShowSeconds={highlightShowSeconds}
                onToggleHighlightShowSeconds={() => setHighlightShowSeconds(prev => !prev)}
            />
          )}
        </div>

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Highlight Modal (Placed at root level) */}
      <HighlightModal
        isOpen={showHighlightModal}
        onClose={() => setShowHighlightModal(false)}
        activeBaby={activeBaby}
        activeBabyActivities={activeBabyActivities}
        records={records}
        timerStates={timerStates}
        showSeconds={highlightShowSeconds}
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

        /* Icon Bounce Animation */
        @keyframes icon-bounce {
            0% { transform: translateY(0) scale(1); }
            30% { transform: translateY(-12px) scale(1.1); }
            50% { transform: translateY(-8px) scale(1.05); }
            70% { transform: translateY(-4px) scale(1.02); }
            100% { transform: translateY(0) scale(1); }
        }
        .animate-icon-bounce {
            animation: icon-bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
        }

        /* Flyout Appear Animation - shows the +xx text */
        @keyframes flyout-appear {
            0% { 
                opacity: 0; 
                transform: translate(-50%, 10px) scale(0.8); 
            }
            50% { 
                transform: translate(-50%, -5px) scale(1.1); 
            }
            100% { 
                opacity: 1; 
                transform: translate(-50%, 0) scale(1); 
            }
        }
        .animate-flyout-appear {
            animation: flyout-appear 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        /* Flyout Up Animation - flies up and fades */
        @keyframes flyout-up {
            0% { 
                opacity: 1; 
                transform: translate(-50%, 0) scale(1); 
            }
            100% { 
                opacity: 0; 
                transform: translate(-50%, -30px) scale(0.8); 
            }
        }
        .animate-flyout-up {
            animation: flyout-up 0.3s ease-out forwards;
        }

        /* Smooth grid item transition for drag and drop */
        .grid > * {
            transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), 
                       opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Optimize grid layout for smooth transitions */
        .grid {
            contain: layout;
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
        
        .bg-blue-100 { background-color: #DBEAFE; }
        .bg-indigo-100 { background-color: #E0E7FF; }
        .bg-purple-100 { background-color: #EDE9FE; }
        .bg-amber-100 { background-color: #FEF3C7; }
        .bg-yellow-100 { background-color: #FEF9C3; }
        .bg-gray-100 { background-color: #F3F4F6; }
        .bg-red-100 { background-color: #FEE2E2; }
        .bg-green-100 { background-color: #D1FAE5; }
        
        .bg-blue-200 { background-color: #BFDBFE; }
        .bg-indigo-200 { background-color: #C7D2FE; }
        .bg-purple-200 { background-color: #DDD6FE; }
        .bg-amber-200 { background-color: #FDE68A; }
        .bg-yellow-200 { background-color: #FEF08A; }
        .bg-gray-200 { background-color: #E5E7EB; }
        .bg-red-200 { background-color: #FECACA; }
        .bg-green-200 { background-color: #A7F3D0; }
        .bg-pink-200 { background-color: #FBCFE8; }
        .bg-orange-200 { background-color: #FED7AA; }


      `}</style>
    </div>
  );
};

export default App;
