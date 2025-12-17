import React, { useState, useEffect, useMemo } from 'react';
import { Edit3, Plus } from 'lucide-react';
import Modal from '../common/Modal';
import { formatDateKey } from '../../utils/dateUtils';
import { calculateDaysOld } from '../../utils/dateUtils';

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

export default BabyManagerModal;

