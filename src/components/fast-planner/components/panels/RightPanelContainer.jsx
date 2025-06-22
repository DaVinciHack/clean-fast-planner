import React, { useState, useRef, useEffect } from 'react';
import '../../FastPlannerStyles.css';
import '../../animationFixes.css';

/**
 * RightPanelContainer
 * 
 * Container component that manages which card is visible in the right panel
 * and handles the sliding animations between cards.
 * 
 * This version uses CSS animations to slide entire cards:
 * - Current card slides out to the left
 * - New card slides in from the right
 */
const RightPanelContainer = React.forwardRef(({
  visible,
  onToggleVisibility,
  children, // All card components will be passed as children
  initialActiveCard = 'main' // Default to main card
}, ref) => {
  // State for active card
  const [activeCard, setActiveCard] = useState(initialActiveCard);
  
  // State for animation
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentCard, setCurrentCard] = useState(initialActiveCard);
  const [nextCard, setNextCard] = useState(null);
  const [animationState, setAnimationState] = useState('idle'); // 'idle', 'exit', 'enter'
  
  // Reference to the panel element
  const panelRef = useRef(null);
  
  // Define the available tabs/cards
  const cards = [
    { id: 'main', name: 'Main' },
    { id: 'settings', name: 'Settings' },
    { id: 'performance', name: 'Performance' },
    { id: 'weather', name: 'Weather' },
    { id: 'finance', name: 'Finance' },
    { id: 'sar', name: 'SAR Mode' },
    { id: 'maplayers', name: 'Map Layers' }, // Added Map Layers tab
    { id: 'saveflight', name: 'Save Flight', hidden: true }, // Hidden card for Save Flight
    { id: 'loadflights', name: 'Load Flights', hidden: true }, // Hidden card for Load Flights
    { id: 'autoplan', name: 'Auto Plan', hidden: true } // Hidden card for Auto Plan
  ];
  
  // Filter children to get the current active card
  const getActiveChild = () => {
    const childrenArray = React.Children.toArray(children);
    // Add a null check for child.props to prevent TypeError
    return childrenArray.find(child => child && child.props && child.props.id === currentCard) || null;
  };
  
  // Filter children to get the next card (when animating)
  const getNextChild = () => {
    if (!nextCard) return null;
    const childrenArray = React.Children.toArray(children);
    // Add a null check for child.props to prevent TypeError
    return childrenArray.find(child => child && child.props && child.props.id === nextCard) || null;
  };
  
  // Handle card change with animation
  const handleCardChange = (cardId) => {
    // Add debugging to trace card change requests
    console.log(`RightPanelContainer: handleCardChange called with cardId=${cardId}, currentCard=${currentCard}, activeCard=${activeCard}, isAnimating=${isAnimating}`);
    
    // Don't do anything if clicking the current active tab or if animation is in progress
    if (activeCard === cardId || isAnimating) return;
    
    // Start the animation sequence
    setIsAnimating(true);
    setAnimationState('exit');
    setActiveCard(cardId);
    setNextCard(cardId);
    
    // Apply the exit animation (slide to right)
    if (panelRef.current) {
      panelRef.current.style.animation = 'slideOutToRight 0.4s cubic-bezier(0.34, 0.95, 0.67, 0.99) forwards';
    }
    
    // After exit animation completes, switch cards and start entrance animation
    setTimeout(() => {
      setCurrentCard(cardId);
      setAnimationState('enter');
      
      // Apply the enter animation (slide from right)
      if (panelRef.current) {
        panelRef.current.style.animation = 'slideInFromRight 0.5s cubic-bezier(0.34, 0.95, 0.67, 0.99) forwards';
      }
      
      // Reset animation state after entrance animation completes
      setTimeout(() => {
        setAnimationState('idle');
        setIsAnimating(false);
        setNextCard(null);
      }, 400);
    }, 400);
  };
  
  // Expose the handleCardChange method and current activeCard through the ref
  React.useImperativeHandle(ref, () => ({
    handleCardChange,
    getCurrentActiveCard: () => activeCard
  }));
  
  return (
    <>
      {/* Right panel toggle tab */}
      <div 
        className="panel-tab right-panel-tab main-toggle tab-selector" 
        style={{ top: '90px' }}
        onClick={onToggleVisibility}
      >
        {visible ? 'Hide →' : '← Show'}
      </div>
      
      {/* Tab/Card Selectors */}
      {visible && cards.map((card, index) => !card.hidden && (
        <div 
          key={card.id}
          className={`panel-tab right-panel-tab tab-selector tab-${card.id} ${activeCard === card.id ? 'active' : ''}`}
          style={{ 
            top: `${90 + (index + 1) * 95}px` // Increased from 80px to 95px - more vertical spread
          }}
          onClick={() => handleCardChange(card.id)}
          title={card.name}
        >
          {card.name}
        </div>
      ))}
      
      {/* The panel content container - no nested animation div */}
      <div 
        id="info-panel" 
        ref={panelRef}
        className={`info-panel ${!visible ? "hidden" : ""}`}
      >
        {getActiveChild()}
      </div>
    </>
  );
});

export default RightPanelContainer;