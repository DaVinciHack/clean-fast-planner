import React from 'react';

/**
 * BaseCard Component
 * 
 * A base component for all card types to ensure consistent styling and structure.
 * All specific card types should extend from this component.
 */
const BaseCard = ({ title, children, id }) => {
  return (
    <div className="tab-content" id={id}>
      <h3>{title}</h3>
      {children}
    </div>
  );
};

export default BaseCard;