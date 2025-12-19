import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { formatDateKey } from '../../utils/dateUtils';

const BabyEditScreen = ({
  baby,
  onBack,
  onUpdateBaby
}) => {
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('📒');
  const [editStartDate, setEditStartDate] = useState('');
  
  // 常用图标列表
  const commonIcons = ['👶', '👧', '👦', '📒', '📔', '📕', '📗', '📘', '📙', '📚', '🍼', '🐣', '🧸', '🌙', '⭐', '💫', '✨', '🎈', '🎀', '🎁'];

  useEffect(() => {
    if (baby) {
      setEditName(baby.name || '');
      setEditIcon(baby.icon || '📒');
      setEditStartDate(baby.startDate || formatDateKey(new Date()));
    }
  }, [baby]);

  const handleSave = () => {
    if (!baby) return;
    if (!editName.trim()) {
      alert('请输入本子名称');
      return;
    }
    
    onUpdateBaby(baby.id, {
      name: editName.trim(),
      icon: editIcon,
      startDate: editStartDate
    });
    
    onBack();
  };

  if (!baby) {
    onBack();
    return null;
  }

  return (
    <div className="pt-14 pb-24 px-5 space-y-6 animate-fade-in h-full overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-700" />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">编辑本子信息</h1>
          <p className="text-sm text-gray-500">{baby.name}</p>
        </div>
      </div>

      {/* 编辑表单 */}
      <div className="bg-white rounded-[2rem] p-5 md:p-6 shadow-sm border border-gray-50 space-y-6">
        {/* 名称输入 */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">本子名称</label>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="请输入本子名称"
            className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-blue-300 outline-none transition-colors text-base"
          />
        </div>
        
        {/* 图标选择 */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">本子图标</label>
          <div className="grid grid-cols-10 gap-2 p-3 bg-gray-50 rounded-xl">
            {commonIcons.map((icon) => (
              <button
                key={icon}
                onClick={() => setEditIcon(icon)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-2xl transition-all ${
                  editIcon === icon
                    ? 'bg-blue-500 scale-110 ring-2 ring-blue-300'
                    : 'bg-white hover:bg-gray-100'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
          <div className="mt-2">
            <input
              type="text"
              value={editIcon}
              onChange={(e) => setEditIcon(e.target.value)}
              placeholder="或直接输入emoji"
              className="w-full p-2 border border-gray-200 rounded-lg text-center text-xl"
              maxLength={2}
            />
          </div>
        </div>
        
        {/* 开始日期 */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">开始日期</label>
          <input
            type="date"
            value={editStartDate}
            onChange={(e) => setEditStartDate(e.target.value)}
            max={formatDateKey(new Date())}
            className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-blue-300 outline-none transition-colors text-base"
          />
        </div>
      </div>
      
      {/* 保存按钮 */}
      <button
        onClick={handleSave}
        className="w-full bg-gray-900 text-white py-3.5 rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
      >
        <Check size={18} /> 保存修改
      </button>
    </div>
  );
};

export default BabyEditScreen;

