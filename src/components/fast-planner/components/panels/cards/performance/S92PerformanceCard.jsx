import React from 'react';
import BaseCard from '../BaseCard';

/**
 * S92PerformanceCard Component
 * 
 * This will eventually implement the S92 dropdown graph
 * For now, it's just a placeholder
 */
const S92PerformanceCard = ({ id }) => {
  return (
    <BaseCard title="S92 Performance Calculator" id={id}>
      <div className="performance-info">
        <p>This component will contain the S92 Dropdown Graph from the provided code.</p>
        <p>It will be implemented as a separate card within the Performance tab.</p>
      </div>
    </BaseCard>
  );
};

export default S92PerformanceCard;