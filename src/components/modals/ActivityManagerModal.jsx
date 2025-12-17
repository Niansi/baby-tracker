import React, { useState, useEffect, useMemo } from 'react';
import { Check, Edit3, Plus, Layers, Maximize2, Clock3, Sparkles } from 'lucide-react';
import Modal from '../common/Modal';
import { CUSTOM_ICONS, CUSTOM_COLORS, generateId } from '../../constants/activityTypes';

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
            // Add new activity with order set to the end
            const maxOrder = activityTypes.length > 0 
                ? Math.max(...activityTypes.map(a => a.order || 0))
                : -1;
            proposedActivities = [...activityTypes, { ...newActivity, id: generateId(), order: maxOrder + 1 }];
        } else if (view === 'edit' && editingActivityId) {
            // Preserve order when editing
            proposedActivities = activityTypes.map(a => 
                a.id === editingActivityId 
                    ? { ...a, ...newActivity, order: a.order !== undefined ? a.order : activityTypes.length } 
                    : a
            );
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

export default ActivityManagerModal;

