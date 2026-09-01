import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  badge?: string;
  description?: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (SelectOption | string)[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  align?: 'left' | 'right';
  size?: 'sm' | 'md';
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  className = '',
  buttonClassName = '',
  menuClassName = '',
  align = 'left',
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options to SelectOption objects
  const normalizedOptions: SelectOption[] = options.map((opt) => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const heightClasses = size === 'sm' ? 'h-8 px-2.5 text-[11px]' : 'h-9 px-3 text-xs';

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-900 dark:text-white rounded-md font-subheading font-medium inline-flex items-center justify-between gap-2.5 cursor-pointer shadow-xs focus:outline-none focus:border-blue-500 transition-all select-none ${heightClasses} ${buttonClassName} ${
          isOpen ? 'ring-1 ring-blue-500/40 border-blue-500' : ''
        }`}
      >
        <span className="truncate flex items-center gap-1.5 font-medium">
          {selectedOption?.icon}
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute z-50 mt-1 min-w-[200px] w-full max-h-64 overflow-y-auto rounded-md bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] shadow-lg p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${menuClassName}`}
        >
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt.value)}
                className={`group flex items-center justify-between gap-2 px-2.5 py-1.5 rounded text-xs cursor-pointer select-none transition-colors ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold'
                    : 'text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#18181b] hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <div className="flex flex-col truncate">
                  <div className="flex items-center gap-1.5 truncate font-subheading">
                    {opt.icon}
                    <span className="truncate">{opt.label}</span>
                    {opt.badge && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-zinc-100 dark:bg-[#27272a] text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  {opt.description && (
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-body font-normal truncate mt-0.5">
                      {opt.description}
                    </span>
                  )}
                </div>

                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
