import React, { useState, useEffect } from 'react';
import './FlightAutomationLoader.css';

/**
 * FlightAutomationLoader - Professional aviation automation progress display
 * Shows realistic flight planning steps during the 40-second automation process
 */
const FlightAutomationLoader = ({ 
  isVisible, 
  flightNumber, 
  departureIcao, 
  destinationIcao,
  onComplete 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [subProgress, setSubProgress] = useState(0);
  const [currentTaff, setCurrentTaff] = useState('');

  // Real automation steps - 6 seconds each for simple timing
  const automationSteps = [
    {
      title: "Saving Flight and Checking Waypoints",
      subtitle: "Validating route and saving to Palantir"
    },
    {
      title: "Computing Sunrise and Sunset Times", 
      subtitle: "Calculating daylight operations windows"
    },
    {
      title: "Fetching Winds for Flight Track",
      subtitle: "Fetching atmospheric conditions"
    },
    {
      title: "Searching for Nearest Alternates",
      subtitle: "Finding available alternate destinations"
    },
    {
      title: "Analyzing Weather at Alternates",
      subtitle: "Choosing best alternate and approach"
    },
    {
      title: "Checking Aircraft Configuration",
      subtitle: "Verifying performance parameters"
    }
  ];

  // Sample TAF data for visual effect
  const sampleTaffs = [
    `${departureIcao || 'ENLE'} 101200Z 1012/1112 28008KT 9999 FEW020 SCT040`,
    `${destinationIcao || 'ENHF'} 101200Z 1012/1112 31012KT 9999 BKN025`,
    "ENOL 101200Z 1012/1112 25015G25KT 8000 -SHRA BKN015",
    "ENZV 101200Z 1012/1112 22008KT 9999 FEW030 BKN080",
    "ENVA 101200Z 1012/1112 29010KT 9999 SCT025 BKN045"
  ];

  useEffect(() => {
    console.log('🚀 FlightAutomationLoader useEffect triggered:', { isVisible, flightNumber, departureIcao, destinationIcao });
    if (!isVisible) {
      console.log('🚀 FlightAutomationLoader: Not visible, returning early');
      // RESET STATE: Always reset when becoming invisible
      setCurrentStep(0);
      setProgress(0);
      setSubProgress(0);
      setCurrentTaff('');
      return;
    }
    
    console.log('🚀 FlightAutomationLoader: Starting automation animation');
    
    // FRESH START: Always reset state when starting new animation
    setCurrentStep(0);
    setProgress(0);
    setSubProgress(0);
    setCurrentTaff('');

    let mainTimer;
    let taffTimer;
    let startTime = Date.now();
    
    const STEP_DURATION = 7000; // 9 seconds per step
    const TOTAL_STEPS = automationSteps.length;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const currentStepIndex = Math.floor(elapsed / STEP_DURATION);
      const stepProgress = ((elapsed % STEP_DURATION) / STEP_DURATION) * 100;
      const overallProgress = (elapsed / (TOTAL_STEPS * STEP_DURATION)) * 100;

      if (currentStepIndex >= TOTAL_STEPS) {
        // Animation complete
        clearInterval(mainTimer);
        clearInterval(taffTimer);
        setCurrentStep(TOTAL_STEPS - 1);
        setSubProgress(100);
        setProgress(100);
        setTimeout(() => {
          onComplete?.();
        }, 1000);
        return;
      }

      // Update all state
      setCurrentStep(currentStepIndex);
      setSubProgress(stepProgress);
      setProgress(overallProgress);
    };

    // Single timer that runs everything
    mainTimer = setInterval(updateProgress, 100);

    // TAF cycling timer  
    let taffIndex = 0;
    taffTimer = setInterval(() => {
      setCurrentTaff(sampleTaffs[taffIndex % sampleTaffs.length]);
      taffIndex++;
    }, 2000);

    return () => {
      clearInterval(mainTimer);
      clearInterval(taffTimer);
    };
  }, [isVisible]);

  if (!isVisible) {
    console.log('🚀 FlightAutomationLoader: Render check - not visible, returning null');
    return null;
  }
  
  console.log('🚀 FlightAutomationLoader: Rendering loader with props:', { 
    isVisible, 
    flightNumber, 
    departureIcao, 
    destinationIcao,
    currentStep,
    progress 
  });

  const currentStepData = automationSteps[currentStep] || automationSteps[0];

  return (
    <div className="flight-automation-overlay">
      <div className="flight-automation-popup">
        {/* Current Step Display */}
        <div className="current-step">
          <div className="step-info">
            <h3>{currentStepData.title}</h3>
            <p>{currentStepData.subtitle}</p>
            <div className="step-progress">
              <div 
                className="step-progress-bar"
                style={{ width: `${subProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Steps List with Mini Loaders */}
        <div className="steps-list">
          {automationSteps.map((step, index) => (
            <div 
              key={index}
              className={`step-item ${index < currentStep ? 'completed' : index === currentStep ? 'active' : 'pending'}`}
            >
              <div className="step-marker">
                {index < currentStep ? (
                  <div className="step-checkmark">✓</div>
                ) : index === currentStep ? (
                  <div className="step-loader"></div>
                ) : (
                  <div className="step-circle"></div>
                )}
              </div>
              <span className="step-name">{step.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FlightAutomationLoader;