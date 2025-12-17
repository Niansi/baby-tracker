import React from 'react';

// 5. Analysis Screen remains simple for now
const AnalysisScreen = ({ activeBaby }) => {
    // Note: Analysis needs significant refactoring to handle dynamic activity types
    return (
        <div className="pt-14 pb-24 px-5 animate-fade-in h-full overflow-y-auto no-scrollbar">
           <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">📊 数据分析</h1>
           </div>
           <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100">
              <h3 className="font-bold text-gray-700 mb-4">功能正在升级...</h3>
              <p className="text-sm text-gray-500">
                  当前本子: **{activeBaby.name}**
              </p>
              <p className="text-sm text-gray-500 mt-3">
                  由于记录项已抽象为自定义活动类型，分析模块正在升级，以支持您自定义的全部活动（如：睡眠、抽烟、喝水等）的数据可视化。
              </p>
              <div className="mt-4 p-3 bg-blue-50 rounded-xl text-blue-700 text-sm">
                  敬请期待强大的自定义报表功能！
              </div>
           </div>
        </div>
    );
};

export default AnalysisScreen;

