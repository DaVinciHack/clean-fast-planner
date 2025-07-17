import React, { useState, useRef, useEffect } from 'react';
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
  // Mobile slide control
  onHideLeftPanel, // Callback to hide left panel when menu slides up
  onHideRightPanel, // Callback to hide right panel when menu slides up
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
  liveWeatherActive = false,
  // New flight wizard props
  onNewFlight
}) => {

  // State for expanded/compact mode
  const [isExpanded, setIsExpanded] = useState(false);
  
  // State for force showing menu (overrides panel visibility)
  const [forceShowMenu, setForceShowMenu] = useState(false);
  
  // Ref for the tab element to add native event listeners
  const tabRef = useRef(null);
  
  // Auto-hide menu when any panel is visible (mobile/iPad), unless forced to show
  const shouldHideMenu = (leftPanelVisible || rightPanelVisible) && (isPhoneLayout || window.innerWidth <= 1024) && !forceShowMenu;
  
  // State calculation for menu visibility
  // (Debug logs removed for performance)

  // Add native touch event listeners to capture events before map
  useEffect(() => {
    const tabElement = tabRef.current;
    if (!tabElement) return;

    const handleTouchStart = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    };

    const handleTouchEnd = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      handleTabClick();
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    };

    // Add passive: false to allow preventDefault
    tabElement.addEventListener('touchstart', handleTouchStart, { passive: false, capture: true });
    tabElement.addEventListener('touchend', handleTouchEnd, { passive: false, capture: true });
    tabElement.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });

    return () => {
      tabElement.removeEventListener('touchstart', handleTouchStart, { capture: true });
      tabElement.removeEventListener('touchend', handleTouchEnd, { capture: true });
      tabElement.removeEventListener('touchmove', handleTouchMove, { capture: true });
    };
  }, [shouldHideMenu]);

  if (!isVisible) return null;

  // Toggle expanded state when menu button is clicked
  const handleMenuClick = () => {
    if (isExpanded) {
      // If expanded, collapse it
      setIsExpanded(false);
    } else {
      // If compact, expand it
      setIsExpanded(true);
      
      // On mobile/iPad, when menu opens, hide any open panels
      if (leftPanelVisible && onHideLeftPanel) {
        onHideLeftPanel();
      }
      if (rightPanelVisible && onHideRightPanel) {
        onHideRightPanel();
      }
    }
    // Also trigger the original menu action if needed
    onOpenMenu();
  };
  
  // Handle tab click to close panels and show menu
  const handleTabClick = () => {
    console.log('🎯 TAB CLICKED - Closing panels and showing menu');
    
    // Close any open panels immediately
    if (leftPanelVisible && onOpenRoute) {
      onOpenRoute(); // Toggle route panel to close it
    }
    if (rightPanelVisible && onToggleRightPanel) {
      onToggleRightPanel(); // Toggle right panel to close it
    }
    
    // Fallback: try the hide functions if they exist
    if (leftPanelVisible && onHideLeftPanel) {
      onHideLeftPanel();
    }
    if (rightPanelVisible && onHideRightPanel) {
      onHideRightPanel();
    }
    
    // Force menu to show and keep it shown longer to ensure panels close
    setForceShowMenu(true);
    
    // Reset force show after panels have had time to close
    setTimeout(() => {
      setForceShowMenu(false);
    }, 1000);
  };

  // All menu items for expanded state
  const expandedMenuItems = [
    {
      id: 'new',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      ),
      label: 'New',
      action: () => {
        if (onNewFlight) onNewFlight();
        // Close any open panels when starting new flight
        if (leftPanelVisible && onHideLeftPanel) onHideLeftPanel();
        if (rightPanelVisible && onHideRightPanel) onHideRightPanel();
      }
    },
    {
      id: 'main',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9,22 9,12 15,12 15,22"/>
        </svg>
      ),
      label: 'Main',
      action: () => {
        if (onMainCard) onMainCard();
        // Close any open panels when opening right panel cards
        if (leftPanelVisible && onHideLeftPanel) onHideLeftPanel();
      }
    },
    {
      id: 'weather',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          <circle cx="5" cy="8" r="2"/>
          <circle cx="19" cy="8" r="2"/>
        </svg>
      ),
      label: 'Weather',
      action: () => {
        if (onWeatherCard) onWeatherCard();
        // Close left panel when opening right panel cards
        if (leftPanelVisible && onHideLeftPanel) onHideLeftPanel();
      }
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
      action: () => {
        if (onFinanceCard) onFinanceCard();
        // Close left panel when opening right panel cards
        if (leftPanelVisible && onHideLeftPanel) onHideLeftPanel();
      }
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
      action: () => {
        if (onSARCard) onSARCard();
        // Close left panel when opening right panel cards
        if (leftPanelVisible && onHideLeftPanel) onHideLeftPanel();
      }
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
      action: () => {
        if (onLayersCard) onLayersCard();
        // Close left panel when opening right panel cards
        if (leftPanelVisible && onHideLeftPanel) onHideLeftPanel();
      }
    }
  ];

  return (
    <div className="glass-dock-container">
      {/* Mobile/iPad slide-up tab - show when menu is hidden by panels */}
      {shouldHideMenu && (
        <div 
          ref={tabRef}
          className="mobile-slide-tab" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleTabClick();
          }}
        >
          <div className="slide-tab-indicator">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 15l-6-6-6 6"/>
            </svg>
          </div>
        </div>
      )}
      
      <div className={`glass-dock ${isExpanded ? 'expanded' : 'compact'} ${shouldHideMenu ? 'mobile-hidden' : ''}`}>
        
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

        {/* Always visible: Main button */}
        <div className="glass-button-container">
          <button 
            className="glass-button icon-above-text main-button"
            onClick={onMainCard || (() => console.log('Main clicked'))}
            title="Main card"
          >
            <div className="glass-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9,22 9,12 15,12 15,22"/>
              </svg>
            </div>
            <span className="button-label">Main</span>
          </button>
        </div>

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

        {/* Always visible: Route button */}
        <div className="glass-button-container">
          <button 
            className={`glass-button icon-above-text route-button ${leftPanelVisible ? 'active' : ''}`}
            onClick={() => {
              onOpenRoute();
              // When opening route panel, close right panel if open
              if (rightPanelVisible && onHideRightPanel) {
                onHideRightPanel();
              }
              // Reset force show when opening panels
              setForceShowMenu(false);
            }}
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

        {/* Always visible: Weather button */}
        <div className="glass-button-container">
          <button 
            className="glass-button icon-above-text weather-button"
            onClick={() => {
              if (onWeatherCard) onWeatherCard();
              // Close left panel when opening right panel cards
              if (leftPanelVisible && onHideLeftPanel) onHideLeftPanel();
            }}
            title="Weather"
          >
            <div className="glass-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                <circle cx="5" cy="8" r="2"/>
                <circle cx="19" cy="8" r="2"/>
              </svg>
            </div>
            <span className="button-label">Weather</span>
          </button>
        </div>

        {/* Phone Layout: Settings Panel Button - shows on phones to toggle right panel */}
        {isPhoneLayout && (
          <div className="glass-button-container">
            <button 
              className={`glass-button icon-above-text menu-button ${rightPanelVisible ? 'active' : ''}`}
              onClick={() => {
                onToggleRightPanel();
                // When opening right panel, close left panel if open
                if (leftPanelVisible && onHideLeftPanel) {
                  onHideLeftPanel();
                }
                // Reset force show when opening panels
                setForceShowMenu(false);
              }}
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