  // Add event listener for saving aircraft settings
  React.useEffect(() => {
    // Add event listener for saving aircraft settings from RightPanel
    const handleSaveAircraftSettings = (e) => {
      const { key, settings } = e.detail;
      console.log(`Saving settings for ${key}:`, settings);
      saveAircraftSettings(key, settings);
    };
    
    window.addEventListener('save-aircraft-settings', handleSaveAircraftSettings);
    
    // Cleanup function
    return () => {
      window.removeEventListener('save-aircraft-settings', handleSaveAircraftSettings);
    };
  }, [saveAircraftSettings]);
