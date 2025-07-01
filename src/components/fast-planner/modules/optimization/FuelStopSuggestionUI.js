/**
 * FuelStopSuggestionUI.js
 * 
 * React component for displaying fuel stop optimization suggestions.
 * Shows 1-2 fuel stop options when passenger capacity is insufficient.
 */

import React, { useState } from 'react';

export const FuelStopSuggestionUI = ({
  suggestions = [],
  overloadAnalysis = null,
  onAcceptSuggestion = () => {},
  onDismiss = () => {},
  isVisible = false,
  className = ''
}) => {
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);

  if (!isVisible || !suggestions || suggestions.length === 0) {
    return null;
  }

  const primarySuggestion = suggestions[0];
  const hasAlternative = suggestions.length > 1;

  return (
    <div className={`fuel-stop-suggestion-modal ${className}`} style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'linear-gradient(to bottom, #1f2937, #111827)',
      border: '2px solid #f59e0b',
      borderRadius: '8px',
      padding: '20px',
      maxWidth: '500px',
      width: '90%',
      zIndex: 1000,
      color: 'white',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '15px',
        borderBottom: '1px solid #374151',
        paddingBottom: '10px'
      }}>
        <h3 style={{ 
          margin: 0, 
          color: '#f59e0b',
          fontSize: '1.1em',
          fontWeight: 'bold'
        }}>
          🛩️ Fuel Stop Optimization
        </h3>
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            fontSize: '1.2em',
            cursor: 'pointer',
            padding: '2px 8px'
          }}
        >
          ✕
        </button>
      </div>

      {/* Problem Description */}
      {overloadAnalysis && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid #ef4444',
          borderRadius: '4px',
          padding: '10px',
          marginBottom: '15px'
        }}>
          <div style={{ fontSize: '0.9em', color: '#fca5a5' }}>
            <strong>Passenger Overload Detected:</strong>
          </div>
          <div style={{ fontSize: '0.85em', color: '#fecaca', marginTop: '5px' }}>
            Need {overloadAnalysis.maxShortage} more passenger{overloadAnalysis.maxShortage > 1 ? 's' : ''} than current fuel load allows
          </div>
        </div>
      )}

      {/* Suggestion Options */}
      <div style={{ marginBottom: '20px' }}>
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            onClick={() => setSelectedSuggestionIndex(index)}
            style={{
              border: selectedSuggestionIndex === index ? '2px solid #10b981' : '1px solid #374151',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '10px',
              cursor: 'pointer',
              background: selectedSuggestionIndex === index ? 'rgba(16, 185, 129, 0.1)' : 'rgba(55, 65, 81, 0.3)',
              transition: 'all 0.2s ease'
            }}
          >
            {/* Platform Name */}
            <div style={{ 
              fontSize: '1em', 
              fontWeight: 'bold',
              color: selectedSuggestionIndex === index ? '#10b981' : '#f3f4f6',
              marginBottom: '8px'
            }}>
              {index === 0 ? '🥇 Primary' : '🥈 Alternative'}: {suggestion.platform.name || suggestion.platform.id}
            </div>

            {/* Benefits Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
              fontSize: '0.85em'
            }}>
              <div style={{ color: '#34d399' }}>
                <strong>+{suggestion.passengerGain}</strong> passengers
              </div>
              <div style={{ color: '#fbbf24' }}>
                <strong>{suggestion.routeDeviation.toFixed(1)}nm</strong> detour
              </div>
              <div style={{ color: '#60a5fa' }}>
                <strong>{suggestion.fuelSavings.toFixed(0)} lbs</strong> fuel saved
              </div>
              <div style={{ color: '#a78bfa' }}>
                Score: <strong>{suggestion.score.toFixed(1)}</strong>
              </div>
            </div>

            {/* Platform Type/Info */}
            {suggestion.platform.platformType && (
              <div style={{ 
                fontSize: '0.8em', 
                color: '#9ca3af', 
                marginTop: '5px',
                fontStyle: 'italic'
              }}>
                {suggestion.platform.platformType}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '10px',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={onDismiss}
          style={{
            padding: '8px 16px',
            background: 'rgba(107, 114, 128, 0.2)',
            border: '1px solid #6b7280',
            borderRadius: '4px',
            color: '#d1d5db',
            cursor: 'pointer',
            fontSize: '0.9em'
          }}
        >
          Maybe Later
        </button>
        <button
          onClick={() => onAcceptSuggestion(suggestions[selectedSuggestionIndex])}
          style={{
            padding: '8px 16px',
            background: 'linear-gradient(to bottom, #10b981, #059669)',
            border: '1px solid #10b981',
            borderRadius: '4px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.9em',
            fontWeight: 'bold'
          }}
        >
          Add to Route
        </button>
      </div>

      {/* Help Text */}
      <div style={{
        fontSize: '0.75em',
        color: '#9ca3af',
        marginTop: '10px',
        textAlign: 'center',
        fontStyle: 'italic'
      }}>
        This will insert the fuel stop into your route to maximize passenger capacity
      </div>
    </div>
  );
};

/**
 * Compact notification component for fuel stop suggestions
 */
export const FuelStopNotification = ({
  suggestion = null,
  onViewDetails = () => {},
  onDismiss = () => {},
  isVisible = false
}) => {
  if (!isVisible || !suggestion) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'linear-gradient(to bottom, #1f2937, #111827)',
      border: '1px solid #f59e0b',
      borderRadius: '6px',
      padding: '12px 16px',
      maxWidth: '350px',
      zIndex: 999,
      color: 'white',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
      animation: 'slideInRight 0.3s ease-out'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.9em', fontWeight: 'bold', color: '#f59e0b', marginBottom: '4px' }}>
            🛩️ Fuel Stop Suggestion
          </div>
          <div style={{ fontSize: '0.8em', color: '#d1d5db', marginBottom: '8px' }}>
            Add refuel at <strong>{suggestion.platform.name || suggestion.platform.id}</strong> 
            to carry <strong>+{suggestion.passengerGain}</strong> passengers
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={onViewDetails}
              style={{
                padding: '4px 8px',
                background: '#10b981',
                border: 'none',
                borderRadius: '3px',
                color: 'white',
                fontSize: '0.75em',
                cursor: 'pointer'
              }}
            >
              View Details
            </button>
            <button
              onClick={onDismiss}
              style={{
                padding: '4px 8px',
                background: 'transparent',
                border: '1px solid #6b7280',
                borderRadius: '3px',
                color: '#9ca3af',
                fontSize: '0.75em',
                cursor: 'pointer'
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: '#6b7280',
            fontSize: '1em',
            cursor: 'pointer',
            marginLeft: '8px'
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default FuelStopSuggestionUI;