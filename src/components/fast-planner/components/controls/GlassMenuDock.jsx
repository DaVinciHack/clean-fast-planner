import React from 'react';
import './GlassMenuDock.css';

/**
 * Apple-style Glass Menu Dock
 * 
 * Appears at bottom when flight is loaded with three controls:
 * - Lock/Unlock (prevents accidental edits)
 * - Route (opens left panel)
 * - Menu (opens right panel)
 * 
 * Features beautiful glassmorphism design inspired by Apple Control Center
 */
const GlassMenuDock = ({
  isVisible = false,
  isLocked = true,
  onToggleLock,
  onOpenRoute,
  onOpenMenu
}) => {

  if (!isVisible) return null;

  return (
    <div className="glass-dock-container">
      <div className="glass-dock">
        
        {/* Lock/Unlock Button */}
        <button 
          className={`glass-button ${isLocked ? 'locked' : 'unlocked'}`}
          onClick={onToggleLock}
          title={isLocked ? 'Unlock to edit flight' : 'Lock to prevent edits'}
        >
          <div className="glass-icon lock-icon">
            {isLocked ? (
              // Locked padlock
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="m7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            ) : (
              // Unlocked padlock  
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="m7 11V7a5 5 0 0 1 9.9-1"/>
              </svg>
            )}
          </div>
        </button>

        {/* Route Button */}
        <button 
          className="glass-button route-button"
          onClick={onOpenRoute}
          title="Open route editor"
        >
          <div className="glass-icon route-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
        </button>

        {/* Menu Button */}
        <button 
          className="glass-button menu-button"
          onClick={onOpenMenu}
          title="Open settings menu"
        >
          <div className="glass-icon menu-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="3"/>
              <path d="m12 1l3.09 5.26L22 9l-5.26 3.09L14 21l-2-7-7-2 8.91-5.26L12 1z"/>
            </svg>
          </div>
        </button>

      </div>
    </div>
  );
};

export default GlassMenuDock;