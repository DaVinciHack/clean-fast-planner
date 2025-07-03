/**
 * SimpleFuelInput.jsx
 * 
 * Ultra-simple fuel input that works immediately without complex state management.
 * No subscriptions, no complex managers - just direct state updates.
 */

import React, { useState } from 'react';

const SimpleFuelInput = ({
  label,
  value = 0,
  onChange,
  placeholder = '0',
  weatherValue = 0,
  isWeatherSuggested = false,
  width = '80px'
}) => {
  
  const [localValue, setLocalValue] = useState(value || '');
  const [isFocused, setIsFocused] = useState(false);
  
  // Determine what to display
  const displayValue = isFocused ? localValue : (value || '');
  
  // Determine placeholder
  const effectivePlaceholder = weatherValue > 0 ? `${weatherValue}` : placeholder;
  
  // Determine border color
  const borderColor = value > 0 ? '#4CAF50' : 
                     weatherValue > 0 ? '#2196F3' : '#666';
  
  // Handle input change
  const handleChange = (e) => {
    setLocalValue(e.target.value);
  };
  
  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
    setLocalValue(value ? value.toString() : '');
  };
  
  // Handle blur
  const handleBlur = () => {
    setIsFocused(false);
    const numericValue = parseFloat(localValue) || 0;
    
    console.log(`🚀 SIMPLE INPUT: ${label} = ${numericValue}`);
    
    if (onChange) {
      onChange(numericValue);
    }
    
    setLocalValue('');
  };
  
  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };
  
  return (
    <input
      type="number"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyPress={handleKeyPress}
      placeholder={effectivePlaceholder}
      style={{
        width: width,
        padding: '6px 8px',
        border: '1px solid',
        borderColor: borderColor,
        borderRadius: '4px',
        backgroundColor: 'rgba(30, 30, 30, 0.8)',
        color: '#fff',
        fontSize: '12px',
        textAlign: 'center',
        outline: 'none',
        transition: 'border-color 0.2s ease'
      }}
    />
  );
};

export default SimpleFuelInput;