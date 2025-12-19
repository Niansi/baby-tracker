import React from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl transform transition-all duration-300 animate-magic-move max-h-[95vh] flex flex-col"> 
        <div className="flex justify-between items-center mb-6 flex-shrink-0">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        {/* 优化：为了避免被底部tab遮挡，将安全距离增加到 pb-16 (64px) */}
        <div className="flex-1 overflow-y-auto pr-1 pb-16"> 
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;

