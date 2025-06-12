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
        
        {/* Lock/Unlock Button - Round like Apple */}
        <div className="glass-button-container">
          <button 
            className={`glass-button round ${isLocked ? 'locked' : 'unlocked'}`}
            onClick={onToggleLock}
            title={isLocked ? 'Unlock to edit flight' : 'Lock to prevent edits'}
          >
            <div className="glass-icon lock-icon">
              {isLocked ? (
                // Locked padlock
                <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M6 10v-2a6 6 0 1 1 12 0v2h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8c0-1.1.9-2 2-2h2zm2 0h8v-2a4 4 0 1 0-8 0v2z"/>
                </svg>
              ) : (
                // Unlocked padlock  
                <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M6 10h2v-2a4 4 0 1 1 8 0h2a6 6 0 0 0-12 0v2zm-2 0a2 2 0 0 0-2 2v8c0 1.1.9 2 2 2h16a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2H4z"/>
                </svg>
              )}
            </div>
          </button>
        </div>

        {/* Route Button - With label */}
        <div className="glass-button-container">
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
          <span className="glass-label">Route</span>
        </div>

        {/* Menu Button - With label */}
        <div className="glass-button-container">
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
          <span className="glass-label">Menu</span>
        </div>

      </div>
    </div>
  );
};

export default GlassMenuDock;