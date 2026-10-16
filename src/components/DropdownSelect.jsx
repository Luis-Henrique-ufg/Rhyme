/**
 * @file DropdownSelect.jsx
 * @module components/DropdownSelect
 * @description Componente de seleção customizada com suporte a fechamento ao clicar fora e estilos do design system.
 * Em conformidade com a ISO/IEC/IEEE 12207:2017 (6.4.7 - Software Construction / SRP).
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function DropdownSelect({ value, onChange, options = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value) || { label: value, value };
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-surface border border-subtle text-heading rounded-2xl p-3.5 flex items-center justify-between text-sm font-semibold focus:outline-none focus:border-primary transition-all shadow-sm cursor-pointer"
      >
        <span className="truncate">{selectedOption.label}</span>
        <ChevronDown
          size={16}
          className={`text-caption transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-card border border-subtle rounded-2xl shadow-xl overflow-hidden animate-[fadeIn_0.15s_ease-out] py-1 max-h-60 overflow-y-auto custom-scrollbar">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left text-sm font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-body hover:bg-subtle hover:text-heading'
                }`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check size={16} className="text-primary shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
