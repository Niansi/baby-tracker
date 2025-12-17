import React, { useState, useEffect, useMemo } from 'react';
import { Check, Trash2 } from 'lucide-react';
import Modal from '../common/Modal';
import NumberSelector from '../ui/NumberSelector';
import { formatTime } from '../../utils/dateUtils';
import { formatDuration } from '../../utils/formatUtils';

// 4. Records Screen (Simplified logic to use generic activity data)
const RecordsScreen = ({ records, onUpdateRecord, onDeleteRecord, activeBaby, activeBabyActivities }) => {
  const [editingRecord, setEditingRecord] = useState(null);
  const [editValue, setEditValue] = useState(0); 
  
  // Filter and enrich records
  const activityMap = useMemo(() => activeBabyActivities.reduce((acc, curr) => {
      acc[curr.id] = curr;
      return acc;
  }, {}), [activeBabyActivities]);
  
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
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">{activeBaby.name} 的记录</h1>
        <div className="text-xs md:text-sm text-gray-500 font-medium">{sortedRecords.length} 条记录</div>
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
                     <p className="text-sm mt-2">次数型记录（如"臭臭"）通常是单次事件，数值固定为 1，不可编辑数值。</p>
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

export default RecordsScreen;

