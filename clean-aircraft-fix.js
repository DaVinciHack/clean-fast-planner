// CLEAN AIRCRAFT FIX - Less hacky approach
// This bypasses the broken useAircraft hook and provides aircraft data directly

window.CleanAircraftFix = {
  init() {
    console.log('🛠️ INITIALIZING CLEAN AIRCRAFT FIX');
    
    // Wait for aircraft manager
    const checkManager = () => {
      if (window.aircraftManager?.filteredAircraft?.length > 0) {
        this.setupDropdowns();
        this.setupEventListeners();
        console.log('✅ Clean aircraft fix active');
        return true;
      }
      return false;
    };
    
    const interval = setInterval(() => {
      if (checkManager()) clearInterval(interval);
    }, 500);
    
    setTimeout(() => clearInterval(interval), 30000);
  },
  
  setupDropdowns() {
    const typeDropdown = document.getElementById('aircraft-type');
    if (!typeDropdown) return;
    
    // Organize aircraft data
    const aircraft = window.aircraftManager.filteredAircraft;
    const byType = {};
    
    aircraft.forEach(a => {
      const type = a.modelType || 'Unknown';
      if (!byType[type]) byType[type] = [];
      byType[type].push(a);
    });
    
    // Clear and populate type dropdown
    while (typeDropdown.children.length > 1) {
      typeDropdown.removeChild(typeDropdown.lastChild);
    }
    
    Object.keys(byType).sort().forEach(type => {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = `${type} (${byType[type].length})`;
      typeDropdown.appendChild(option);
    });
    
    // Store data for registration dropdown
    this.aircraftByType = byType;
    console.log(`✅ Type dropdown populated with ${Object.keys(byType).length} types`);
  },
  
  setupEventListeners() {
    const typeDropdown = document.getElementById('aircraft-type');
    const regDropdown = document.getElementById('aircraft-registration');
    
    if (typeDropdown) {
      typeDropdown.addEventListener('change', (e) => {
        this.handleTypeChange(e.target.value);
      });
    }
    
    if (regDropdown) {
      regDropdown.addEventListener('change', (e) => {
        this.handleRegistrationChange(e.target.value);
      });
    }
  },
  
  handleTypeChange(selectedType) {
    console.log(`🛠️ Type selected: ${selectedType}`);
    
    if (!selectedType || selectedType === 'select') return;
    
    const regDropdown = document.getElementById('aircraft-registration');
    if (!regDropdown || !this.aircraftByType[selectedType]) return;
    
    // Clear and populate registration dropdown
    while (regDropdown.children.length > 1) {
      regDropdown.removeChild(regDropdown.lastChild);
    }
    
    this.aircraftByType[selectedType].forEach(aircraft => {
      const option = document.createElement('option');
      option.value = aircraft.registration;
      option.textContent = aircraft.registration;
      regDropdown.appendChild(option);
    });
    
    console.log(`✅ Registration dropdown populated with ${this.aircraftByType[selectedType].length} aircraft`);
  },
  
  handleRegistrationChange(registration) {
    if (!registration) return;
    
    console.log(`🛠️ Aircraft selected: ${registration}`);
    
    // Find the aircraft
    let selectedAircraft = null;
    for (const type in this.aircraftByType) {
      const aircraft = this.aircraftByType[type].find(a => a.registration === registration);
      if (aircraft) {
        selectedAircraft = aircraft;
        break;
      }
    }
    
    if (selectedAircraft) {
      // Store globally and trigger minimal updates
      window.currentSelectedAircraft = selectedAircraft;
      
      // Try to trigger React updates cleanly
      const event = new CustomEvent('aircraftSelected', {
        detail: { aircraft: selectedAircraft }
      });
      document.dispatchEvent(event);
      
      console.log('✅ Aircraft selection complete:', selectedAircraft.registration);
    }
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => window.CleanAircraftFix.init(), 1000);
  });
} else {
  setTimeout(() => window.CleanAircraftFix.init(), 1000);
}