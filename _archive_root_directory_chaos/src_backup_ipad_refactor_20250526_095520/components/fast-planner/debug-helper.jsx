import React from 'react';

/**
 * StopCardsDebugHelper component
 * 
 * Add this to FastPlannerApp.jsx render method before the Route Stats Card component
 * This will display stopCards data directly for debugging
 */
const StopCardsDebugHelper = ({ stopCards }) => {
  return (
    <div style={{
      position: 'fixed',
      top: '100px',
      right: '10px',
      backgroundColor: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      zIndex: 9999,
      fontSize: '12px',
      width: '300px',
      maxHeight: '300px',
      overflow: 'auto'
    }}>
      <h3 style={{ color: 'orange', margin: '0 0 5px 0' }}>Stop Cards Debug</h3>
      <div>Has Cards: {stopCards ? 'Yes' : 'No'}</div>
      <div>Length: {stopCards ? stopCards.length : 0}</div>
      <div>Is Array: {Array.isArray(stopCards) ? 'Yes' : 'No'}</div>
      
      {stopCards && stopCards.length > 0 && (
        <div>
          <h4 style={{ color: 'lightgreen', margin: '5px 0' }}>First Card</h4>
          <pre style={{ fontSize: '10px', overflow: 'auto', maxHeight: '100px' }}>
            {JSON.stringify(stopCards[0], null, 2)}
          </pre>
          
          <h4 style={{ color: 'lightgreen', margin: '5px 0' }}>Last Card</h4>
          <pre style={{ fontSize: '10px', overflow: 'auto', maxHeight: '100px' }}>
            {JSON.stringify(stopCards[stopCards.length - 1], null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default StopCardsDebugHelper;
