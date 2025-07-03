import React, { useState } from 'react';
import './GlassMenuDock.css';

/**
 * Expandable Glass Menu Dock
 * 
 * Features a compact 3-button mode and an expanded mode with all menu items.
 * Clean design with icons above text, matching the iPad layout style.
 * Includes smart edit button that appears in satellite+no-rigs mode.
 */
const GlassMenuDock = ({
  isVisible = false,
  isLocked = true,
  onToggleLock,
  onOpenRoute,
  onOpenMenu,
  // Panel states for visual feedback
  leftPanelVisible = false,
  rightPanelVisible = false,
  // Phone layout support
  isPhoneLayout = false,
  onToggleRightPanel, // New callback for toggling right panel on phones
  // Smart toggle button props
  showEditButton = false, // Shows when flight is loaded
  currentMapMode = 'dark', // Current map style (dark/3d)
  onEditMode, // Callback to toggle between modes
  // Card change handlers for expanded buttons
  onMainCard,
  onSettingsCard,
  onPerformanceCard,
  onWeatherCard,
  onFinanceCard,
  onSARCard,
  onSaveCard,
  onLoadCard,
  onLayersCard,
  // LIVE weather toggle props
  onLiveWeatherToggle,
  liveWeatherActive = false
}) => {

  // State for expanded/compact mode
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible) return null;
  
  // Debug logging for LIVE weather button
  console.log('🔍 GlassMenuDock render:', {
    isExpanded,
    hasLiveWeatherToggle: !!onLiveWeatherToggle,
    liveWeatherActive,
    shouldShowLiveButton: !isExpanded && !!onLiveWeatherToggle
  });

  // Toggle expanded state when menu button is clicked
  const handleMenuClick = () => {
    if (isExpanded) {
      // If expanded, collapse it
      setIsExpanded(false);
    } else {
      // If compact, expand it
      setIsExpanded(true);
    }
    // Also trigger the original menu action if needed
    onOpenMenu();
  };

  // All menu items for expanded state
  const expandedMenuItems = [
    {
      id: 'main',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9,22 9,12 15,12 15,22"/>
        </svg>
      ),
      label: 'Main',
      action: onMainCard || (() => console.log('Main clicked'))
    },
    {
      id: 'settings',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="3"/>
          <path d="m12 1 3.09 5.26L22 9l-5.26 3.09L14 21l-2-7-7-2 8.91-5.26L12 1z"/>
        </svg>
      ),
      label: 'Settings',
      action: onSettingsCard || (() => console.log('Settings clicked'))
    },
    {
      id: 'performance',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
      ),
      label: 'Performance',
      action: onPerformanceCard || (() => console.log('Performance clicked'))
    },
    {
      id: 'weather',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
        </svg>
      ),
      label: 'Weather',
      action: onWeatherCard || (() => console.log('Weather clicked'))
    },
    {
      id: 'finance',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
      label: 'Finance',
      action: onFinanceCard || (() => console.log('Finance clicked'))
    },
    {
      id: 'sar',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      label: 'S.A.R',
      action: onSARCard || (() => console.log('SAR clicked'))
    },
    {
      id: 'save',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17,21 17,13 7,13 7,21"/>
          <polyline points="7,3 7,8 15,8"/>
        </svg>
      ),
      label: 'Save',
      action: onSaveCard || (() => console.log('Save clicked'))
    },
    {
      id: 'load',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
      ),
      label: 'Load',
      action: onLoadCard || (() => console.log('Load clicked'))
    },
    {
      id: 'layers',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polygon points="12,2 22,8.5 12,15 2,8.5"/>
          <polyline points="2,17.5 12,24 22,17.5"/>
          <polyline points="2,12.5 12,19 22,12.5"/>
        </svg>
      ),
      label: 'Map Layers',
      action: onLayersCard || (() => console.log('Map Layers clicked'))
    }
  ];

  return (
    <div className="glass-dock-container">
      <div className={`glass-dock ${isExpanded ? 'expanded' : 'compact'}`}>
        
        {/* Always visible: Lock button - Round with no text */}
        <div className="glass-button-container">
          <button 
            className={`glass-button round-button ${isLocked ? 'locked' : 'unlocked'}`}
            onClick={onToggleLock}
            title={isLocked ? 'Unlock to edit flight' : 'Lock to prevent edits'}
          >
            <div className="glass-icon">
              {isLocked ? (
                <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M6 10v-2a6 6 0 1 1 12 0v2h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8c0-1.1.9-2 2-2h2zm2 0h8v-2a4 4 0 1 0-8 0v2z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M6 10h2v-2a4 4 0 1 1 8 0h2a6 6 0 0 0-12 0v2zm-2 0a2 2 0 0 0-2 2v8c0 1.1.9 2 2 2h16a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2H4z"/>
                </svg>
              )}
            </div>
          </button>
        </div>

        {/* Always visible: Route button */}
        <div className="glass-button-container">
          <button 
            className={`glass-button icon-above-text route-button ${leftPanelVisible ? 'active' : ''}`}
            onClick={onOpenRoute}
            title={leftPanelVisible ? 'Close route editor' : 'Open route editor'}
          >
            <div className="glass-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <span className="button-label">Route</span>
          </button>
        </div>

        {/* Phone Layout: Settings Panel Button - shows on phones to toggle right panel */}
        {isPhoneLayout && (
          <div className="glass-button-container">
            <button 
              className={`glass-button icon-above-text menu-button ${rightPanelVisible ? 'active' : ''}`}
              onClick={onToggleRightPanel}
              title={rightPanelVisible ? 'Hide settings panel' : 'Show settings panel'}
            >
              <div className="glass-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="m12 1 3 9 9 3-9 3-3 9-3-9-9-3 9-3 3-9z"/>
                </svg>
              </div>
              <span className="button-label">Panel</span>
            </button>
          </div>
        )}

        {/* Smart Toggle Button - shows when flight is loaded (desktop) */}
        {showEditButton && !isPhoneLayout && (
          <div className="glass-button-container edit-button-container">
            <button 
              className={`glass-button icon-above-text ${currentMapMode === '3d' ? 'edit-button' : 'satellite-button'}`}
              onClick={onEditMode}
              title={currentMapMode === '3d' ? 
                'Switch to edit mode - vertical view with all layers' : 
                'Switch to starlight mode - 3D satellite view for presentation'
              }
            >
              <div className="glass-icon">
                {currentMapMode === '3d' ? (
                  // Edit icon when in starlight mode (60° tilt + satellite)
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                ) : (
                  // Satellite icon when in edit mode (vertical tilt)
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z"/>
                    <path d="M8 12h8"/>
                    <path d="M12 8v8"/>
                    <path d="M16.24 7.76l-8.48 8.48"/>
                    <path d="M7.76 7.76l8.48 8.48"/>
                  </svg>
                )}
              </div>
              <span className="button-label">
                {currentMapMode === '3d' ? 'Edit' : 'Map'}
              </span>
            </button>
          </div>
        )}

        {/* Expanded menu items - only show when expanded */}
        {isExpanded && expandedMenuItems.map((item, index) => (
          <div 
            key={item.id} 
            className="glass-button-container expanded-item"
            style={{
              animationDelay: `${index * 0.05}s` // Stagger animation
            }}
          >
            <button 
              className="glass-button icon-above-text"
              onClick={item.action}
              title={item.label}
            >
              <div className="glass-icon">
                {item.icon}
              </div>
              <span className="button-label">{item.label}</span>
            </button>
          </div>
        ))}

        {/* LIVE Weather Toggle - Only visible in compact mode */}
        {!isExpanded && onLiveWeatherToggle && (
          <div className="glass-button-container">
            <button 
              className={`glass-button icon-above-text live-weather-button ${liveWeatherActive ? 'active' : ''}`}
              onClick={() => {
                console.log('🌩️ LIVE BUTTON CLICK DETECTED!');
                console.log('🌩️ onLiveWeatherToggle function:', onLiveWeatherToggle);
                onLiveWeatherToggle();
              }}
              title={liveWeatherActive ? 
                'Disable LIVE weather (Lightning + NOAA + Radar)' : 
                'Enable LIVE weather monitoring (Lightning + NOAA + Radar)'
              }
            >
              <div className="glass-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <span className="button-label">LIVE</span>
            </button>
          </div>
        )}

        {/* Always visible: Menu/Close button - Round with no text */}
        <div className="glass-button-container">
          <button 
            className={`glass-button round-button menu-button ${isExpanded ? 'active' : ''}`}
            onClick={handleMenuClick}
            title={isExpanded ? 'Close menu' : 'Open menu'}
          >
            <div className="glass-icon">
              {isExpanded ? (
                // Close X icon when expanded
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              ) : (
                // Menu icon when compact
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              )}
            </div>
          </button>
        </div>

      </div>
    </div>
  );
};

export default GlassMenuDock;