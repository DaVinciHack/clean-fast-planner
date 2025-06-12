import React from 'react';
import './GlassMenu.css';

/**
 * GlassMenu Component
 * 
 * Apple-style glassmorphism menu that appears at bottom when flight is loaded
 * Features three buttons: Lock, Route, Menu
 * Clean single-color icons with backdrop blur effect
 */
const GlassMenu = ({
  isVisible = false,
  isLocked = true,
  onToggleLock,
  onOpenRoutePanel,
  onOpenMenuPanel
}) => {
  
  if (!isVisible) return null;
  
  return (
    <div className="glass-menu">
      <div className="glass-menu-container">
        
        {/* Lock/Unlock Button */}
        <button 
          className={`glass-btn ${isLocked ? 'locked' : 'unlocked'}`}
          onClick={onToggleLock}
          title={isLocked ? 'Unlock to edit flight' : 'Lock to prevent edits'}
        >
          <div className="glass-icon lock-icon">
            {isLocked ? (
              // Locked padlock
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="10" rx="2" ry="2"/>
                <circle cx="12" cy="7" r="4"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            ) : (
              // Unlocked padlock
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="10" rx="2" ry="2"/>
                <circle cx="12" cy="7" r="4"/>
                <path d="M7 11V7a5 5 0 0 1 8-4"/>
              </svg>
            )}
          </div>
        </button>

        {/* Route Panel Button */}
        <button 
          className="glass-btn route-btn"
          onClick={onOpenRoutePanel}
          title="Open route editor"
        >
          <div className="glass-icon route-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        </button>

        {/* Menu Panel Button */}
        <button 
          className="glass-btn menu-btn"
          onClick={onOpenMenuPanel}
          title="Open menu panel"
        >
          <div className="glass-icon menu-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="1"/>
              <circle cx="19" cy="12" r="1"/>
              <circle cx="5" cy="12" r="1"/>
            </svg>
          </div>
        </button>
        
      </div>
    </div>
  );
};

export default GlassMenu;