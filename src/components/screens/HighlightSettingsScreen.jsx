import React from 'react';
import { ChevronLeft } from 'lucide-react';

const HighlightSettingsScreen = ({ onBack, showSeconds, onToggleShowSeconds }) => {
  return (
    <div className="pt-14 pb-24 px-5 space-y-6 animate-fade-in h-full overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">Highlight 设置</h1>
      </div>

      {/* Settings Card */}
      <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-base font-semibold text-gray-800 mb-1">显示秒</h2>
            <p className="text-xs text-gray-500">开启后，Highlight页面的计时器将显示到秒，否则只显示到分钟</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
              type="checkbox"
              checked={showSeconds}
              onChange={onToggleShowSeconds}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </div>
  );
};

export default HighlightSettingsScreen;

