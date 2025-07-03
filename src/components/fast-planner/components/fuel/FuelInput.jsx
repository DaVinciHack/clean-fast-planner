/**
 * FuelInput.jsx
 * 
 * Clean, simple fuel input component that replaces the complex TinyInput.
 * Works directly with FuelInputManager to eliminate state synchronization issues.
 * 
 * Features:
 * - Simple local state for editing
 * - Direct integration with FuelInputManager
 * - Color-coded borders (green for user override, blue for weather values)
 * - No competing state systems
 * - Handles both global settings and location-specific fuel
 */

import React, { useState, useEffect } from 'react';

const FuelInput = ({
  // Required props
  fuelManager,
  inputType = 'setting', // 'setting' or 'location'
  
  // For global settings (extraFuel, taxiFuel, etc.)
  settingKey = null,
  
  // For location-specific fuel (ARA, approach)
  stopName = null,
  fuelType = null, // 'araFuel' or 'approachFuel'
  stopIndex = null,
  
  // Display props
  placeholder = '0',
  weatherValue = 0, // Weather-suggested value to show as placeholder
  width = '60px',
  className = '',
  
  // Optional props
  disabled = false,
  min = 0,
  max = 99999
}) => {
  
  // Local editing state
  const [localValue, setLocalValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // Get current saved value from FuelInputManager
  const getSavedValue = () => {
    if (inputType === 'setting' && settingKey) {
      return fuelManager.getSetting(settingKey);
    } else if (inputType === 'location' && stopName && fuelType) {
      return fuelManager.getLocationFuel(stopName, fuelType);
    }
    return 0;
  };
  
  const savedValue = getSavedValue();
  
  // Determine what to display
  const getDisplayValue = () => {
    if (isEditing) {
      return localValue;
    }
    
    if (savedValue > 0) {
      return savedValue.toString();
    }
    
    return '';
  };
  
  // Determine placeholder text
  const getPlaceholder = () => {
    if (weatherValue > 0) {
      return weatherValue.toString();
    }
    return placeholder;
  };
  
  // Determine border color
  const getBorderColor = () => {
    if (savedValue > 0) {
      return '#4CAF50'; // Green for user override
    } else if (weatherValue > 0) {
      return '#2196F3'; // Blue for weather suggested
    } else {
      return '#666'; // Gray for empty
    }
  };
  
  // Determine text color
  const getTextColor = () => {
    if (savedValue > 0) {
      return '#fff'; // White for user override
    } else if (weatherValue > 0 && !isEditing) {
      return '#fff'; // White for weather suggested
    } else {
      return '#ccc'; // Light gray for empty
    }
  };
  
  // Handle input change
  const handleChange = (e) => {
    setLocalValue(e.target.value);
  };
  
  // Handle focus (start editing)
  const handleFocus = () => {
    setIsEditing(true);
    setLocalValue(savedValue > 0 ? savedValue.toString() : '');
  };
  
  // Handle blur (finish editing)
  const handleBlur = () => {
    setIsEditing(false);
    
    // Parse and validate the input
    const numericValue = parseFloat(localValue) || 0;
    
    console.log(`🔧 FUEL INPUT: ${stopName || settingKey} - Input: "${localValue}" → Parsed: ${numericValue} (was: ${savedValue})`);
    
    // Only update if value is valid and different
    if (numericValue >= min && numericValue <= max) {
      if (inputType === 'setting' && settingKey) {
        console.log(`🔧 SETTING: Updating ${settingKey} = ${numericValue}`);
        fuelManager.updateSetting(settingKey, numericValue);
      } else if (inputType === 'location' && stopName && fuelType) {
        console.log(`🔧 LOCATION: Updating ${stopName}.${fuelType} = ${numericValue}`);
        fuelManager.updateLocationFuel(stopName, fuelType, numericValue, stopIndex);
      }
    }
    
    // Clear local value
    setLocalValue('');
  };
  
  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };
  
  // Listen for external changes to update display
  useEffect(() => {
    // If not editing, local value should be empty
    if (!isEditing) {
      setLocalValue('');
    }
    console.log(`🔧 DISPLAY UPDATE: ${stopName || settingKey} - savedValue: ${savedValue}, isEditing: ${isEditing}`);
  }, [savedValue, isEditing, stopName, settingKey]);
  
  return (
    <input
      type="number"
      value={getDisplayValue()}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyPress={handleKeyPress}
      placeholder={getPlaceholder()}
      disabled={disabled}
      min={min}
      max={max}
      style={{
        width: width,
        padding: '4px 8px',
        border: '1px solid',
        borderColor: getBorderColor(),
        borderRadius: '4px',
        backgroundColor: 'rgba(30, 30, 30, 0.8)',
        color: getTextColor(),
        fontSize: '12px',
        textAlign: 'center',
        outline: 'none',
        transition: 'all 0.2s ease',
        ...styles
      }}
      className={`fuel-input ${className} ${isEditing ? 'editing' : ''}`}
    />
  );
};

// Base styles
const styles = {
  '&:focus': {
    borderColor: '#FFA726',
    boxShadow: '0 0 0 2px rgba(255, 167, 38, 0.2)'
  },
  '&:hover': {
    backgroundColor: 'rgba(40, 40, 40, 0.9)'
  }
};

export default FuelInput;