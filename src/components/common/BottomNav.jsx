import React from 'react';
import { Home, AlignLeft, PieChart } from 'lucide-react';

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

export default BottomNav;

