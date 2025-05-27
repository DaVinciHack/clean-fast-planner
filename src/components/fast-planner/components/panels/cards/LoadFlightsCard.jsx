import React, { useState, useEffect } from 'react';
import FlightService from '../../../services/FlightService';

/**
 * LoadFlightsCard Component
 * 
 * A panel card for loading previously saved flights from Palantir
 * Designed to slide in from the right side like other cards
 */
const LoadFlightsCard = ({ 
  id,
  onLoad, 
  onCancel,
  isLoading,
  currentRegion = null // Add region prop to filter flights
}) => {
  const [flights, setFlights] = useState([]);
  const [selectedFlightId, setSelectedFlightId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingFlights, setIsLoadingFlights] = useState(false);
  
  // Load flights when the card is shown or region changes
  useEffect(() => {
    loadFlights();
  }, [currentRegion]); // Reload when region changes
  
  // Load flights from Palantir
  const loadFlights = async () => {
    setIsLoadingFlights(true);
    
    try {
      console.log(`LoadFlightsCard: Loading flights for region: ${currentRegion || 'ALL'}`);
      
      // Use the real FlightService to load flights filtered by region
      const result = await FlightService.loadFlights(currentRegion, 50);
      
      if (result.success) {
        console.log(`LoadFlightsCard: Loaded ${result.flights.length} flights`);
        setFlights(result.flights);
        
        if (window.LoadingIndicator) {
          window.LoadingIndicator.updateStatusIndicator(
            `Loaded ${result.flights.length} flights`, 
            'success'
          );
        }
      } else {
        console.error('LoadFlightsCard: Failed to load flights:', result.error);
        setFlights([]);
        
        if (window.LoadingIndicator) {
          window.LoadingIndicator.updateStatusIndicator(
            `Failed to load flights: ${result.error}`, 
            'error'
          );
        }
      }
    } catch (error) {
      console.error('LoadFlightsCard: Error loading flights:', error);
      setFlights([]);
      
      if (window.LoadingIndicator) {
        window.LoadingIndicator.updateStatusIndicator(
          `Failed to load flights: ${error.message}`, 
          'error'
        );
      }
    } finally {
      setIsLoadingFlights(false);
    }
  };
  
  // Handle loading a flight
  const handleLoadFlight = () => {
    if (!selectedFlightId) return;
    
    const flight = flights.find(f => f.id === selectedFlightId);
    if (flight) {
      onLoad(flight);
    }
  };
  
  // Filter and sort flights based on search term, with newest flights first
  const filteredFlights = flights
    .filter(flight => 
      flight.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flight.status.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Sort by date in descending order (newest first)
      // Handle cases where date might be null or undefined
      const dateA = a.date ? new Date(a.date) : new Date(0);
      const dateB = b.date ? new Date(b.date) : new Date(0);
      
      return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
    });
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    // Show relative time for recent flights
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    } else {
      // For older flights, show the full date
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    }
  };
  
  return (
    <div className="tab-content">
      <div className="panel-header">
        <h3>Load Saved Flights</h3>
      </div>
      
      <div className="control-section">
        {/* Search input */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '5px', 
            fontWeight: 'normal', 
            fontSize: '14px',
            color: '#e0e0e0'
          }}>
            Search Flights:
          </label>
          <input 
            type="text" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by name or status"
            style={{ 
              width: 'calc(100% - 18px)', /* Adjusted width to match container below */
              padding: '5px 8px', 
              border: '1px solid #444', 
              borderRadius: '4px', 
              backgroundColor: 'rgba(30, 30, 30, 0.6)', 
              color: 'white', 
              fontSize: '14px', 
              height: '28px' 
            }}
          />
        </div>
        
        {/* Flights list header */}
        {!isLoadingFlights && filteredFlights.length > 0 && (
          <div style={{
            fontSize: '12px',
            color: '#999',
            marginTop: '15px',
            marginBottom: '5px',
            fontStyle: 'italic'
          }}>
            {flights.length} flight{flights.length !== 1 ? 's' : ''} found • Sorted by newest first
          </div>
        )}
        
        {/* Flights list */}
        <div style={{ 
          marginTop: filteredFlights.length > 0 ? '5px' : '15px', 
          marginBottom: '15px', 
          maxHeight: '300px', 
          overflowY: 'auto', 
          border: '1px solid #444', 
          borderRadius: '4px', 
          backgroundColor: 'rgba(25, 25, 25, 0.6)',
          width: '100%' /* Ensure same width as parent */
        }}>
          {isLoadingFlights ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
              <span style={{
                display: 'inline-block',
                width: '14px',
                height: '14px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '50%',
                borderTopColor: 'white',
                animation: 'spin 1s ease-in-out infinite',
                marginRight: '8px'
              }}></span> 
              Loading flights...
            </div>
          ) : filteredFlights.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
              {searchTerm ? 'No flights match your search' : 'No saved flights found'}
            </div>
          ) : (
            filteredFlights.map(flight => {
              // Check if flight is new (created within last 24 hours)
              const isNewFlight = flight.date && 
                (new Date() - new Date(flight.date)) < 24 * 60 * 60 * 1000;
              
              return (
                <div 
                  key={flight.id}
                  style={{
                    padding: '10px',
                    borderBottom: '1px solid #444',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    backgroundColor: selectedFlightId === flight.id ? 'rgba(60, 130, 180, 0.4)' : 'transparent'
                  }}
                  onClick={() => setSelectedFlightId(flight.id)}
                >
                  <div style={{ 
                    fontWeight: 'bold', 
                    fontSize: '14px', 
                    marginBottom: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>{flight.name}</span>
                    {isNewFlight && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 'bold',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        backgroundColor: '#4caf50',
                        color: 'white',
                        textTransform: 'uppercase'
                      }}>
                        NEW
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>
                    {formatDate(flight.date)}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    marginTop: '5px',
                    display: 'inline-block',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    backgroundColor: 'rgba(40, 40, 40, 0.6)',
                    color: flight.status === 'Completed' ? '#4caf50' : 
                          flight.status === 'Planned' ? '#2196f3' :
                          flight.status === 'In Progress' ? '#ff9800' : '#f44336'
                  }}>
                    {flight.status}
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {/* Bottom buttons - full width, equal size, small gap */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '20px',
          gap: '8px',
          width: '100%' /* Ensure same width as parent */
        }}>
          <button
            onClick={loadFlights}
            disabled={isLoadingFlights}
            style={{
              backgroundColor: '#444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '5px',
              cursor: isLoadingFlights ? 'not-allowed' : 'pointer',
              fontWeight: 'normal',
              fontSize: '12px',
              height: '28px',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            className="control-button"
          >
            {isLoadingFlights ? (
              <>
                <span style={{
                  display: 'inline-block',
                  width: '14px',
                  height: '14px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderRadius: '50%',
                  borderTopColor: 'white',
                  animation: 'spin 1s ease-in-out infinite',
                  marginRight: '6px'
                }}></span> 
                Refresh
              </>
            ) : (
              'Refresh'
            )}
          </button>
          
          <button
            onClick={onCancel}
            style={{
              backgroundColor: '#444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '5px',
              cursor: 'pointer',
              fontWeight: 'normal',
              fontSize: '12px',
              height: '28px',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            className="control-button"
          >
            Cancel
          </button>
          
          <button
            onClick={handleLoadFlight}
            disabled={isLoading || !selectedFlightId}
            style={{
              backgroundColor: isLoading || !selectedFlightId ? '#444' : '#038dde',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '5px',
              cursor: isLoading || !selectedFlightId ? 'not-allowed' : 'pointer',
              fontWeight: 'normal',
              fontSize: '12px',
              height: '28px',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            className="control-button"
          >
            {isLoading ? (
              <>
                <span style={{
                  display: 'inline-block',
                  width: '14px',
                  height: '14px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderRadius: '50%',
                  borderTopColor: 'white',
                  animation: 'spin 1s ease-in-out infinite',
                  marginRight: '6px'
                }}></span> 
                Load
              </>
            ) : (
              'Load'
            )}
          </button>
        </div>
      </div>
      
      {/* Add loading animation */}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LoadFlightsCard;