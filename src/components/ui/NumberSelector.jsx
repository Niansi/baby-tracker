import React, { useState, useEffect, useRef } from 'react';

/**
 * 通用数字选择器组件
 */
const NumberSelector = ({ value, setValue, unit, step = 1, min = 1, max = 300 }) => {
    const inputRef = useRef(null);
    const [isInputActive, setIsInputActive] = useState(false);
    const [inputValue, setInputValue] = useState(String(value));

    useEffect(() => {
        setInputValue(String(value));
    }, [value]);
    
    const handleActivateInput = () => {
        setIsInputActive(true);
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
                inputRef.current.select();
            }
        }, 50);
    };
    
    const handleBlurInput = () => {
        const num = Math.round(Number(inputValue));
        if (!isNaN(num) && num >= min && num <= max) {
            setValue(num);
        } else {
            setInputValue(String(value));
        }
        setIsInputActive(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') inputRef.current.blur();
    };

    return (
        <div className="flex flex-col items-center justify-center w-full space-y-4">
          <div className="flex items-center justify-center gap-6">
            <button 
              onClick={() => setValue(v => Math.max(min, v - step))} 
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-600 transition-colors shrink-0 disabled:opacity-50"
              disabled={value <= min}
            >
              -
            </button>
            <div 
              onClick={handleActivateInput} 
              className="text-center w-28 cursor-pointer relative h-14 flex flex-col justify-end items-center"
            >
              {isInputActive ? (
                <input
                  ref={inputRef}
                  type="number"
                  inputMode="numeric"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onBlur={handleBlurInput}
                  onKeyDown={handleKeyDown}
                  className="absolute inset-0 bg-blue-50/70 text-gray-900 text-4xl font-extrabold text-center rounded-xl z-20 focus:outline-none ring-2 ring-blue-500"
                  style={{ lineHeight: '3rem', height: '3rem', top: '0' }}
                />
              ) : (
                <>
                  <span className="text-4xl font-extrabold text-gray-900 leading-none">{value}</span>
                  <div className="text-sm text-gray-500 mt-1">{unit}</div>
                </>
              )}
            </div>
            <button 
              onClick={() => setValue(v => Math.min(max, v + step))} 
              className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold transition-colors shrink-0 disabled:opacity-50"
              disabled={value >= max}
            >
              +
            </button>
          </div>
        </div>
    );
};

export default NumberSelector;

