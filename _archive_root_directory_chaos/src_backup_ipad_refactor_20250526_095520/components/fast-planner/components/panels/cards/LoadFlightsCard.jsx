import React, { useState, useEffect } from 'react';

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
  isLoading
}) => {
  const [flights, setFlights] = useState([]);
  const [selectedFlightId, setSelectedFlightId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoadingFlights, setIsLoadingFlights] = useState(false);
  
  // Load flights when the card is shown
  useEffect(() => {
    loadFlights();
  }, []);
  
  // Load flights from Palantir
  const loadFlights = async () => {
    setIsLoadingFlights(true);
    
    try {
      // Mock data for now - this would be replaced with real API call
      setTimeout(() => {
        const mockFlights = [
          { id: '1', name: 'KLCH to KIYA - 2025-05-09', date: '2025-05-09T10:00:00', status: 'Completed' },
          { id: '2', name: 'ENZV to ENLE - 2025-05-08', date: '2025-05-08T14:30:00', status: 'Planned' },
          { id: '3', name: 'KIYA to EC176 - 2025-05-07', date: '2025-05-07T08:15:00', status: 'In Progress' },
          { id: '4', name: 'WC369 to KHUM - 2025-05-06', date: '2025-05-06T16:45:00', status: 'Completed' },
          { id: '5', name: 'KLCH to WC487 - 2025-05-05', date: '2025-05-05T11:20:00', status: 'Cancelled' }
        ];
        setFlights(mockFlights);
        setIsLoadingFlights(false);
      }, 1000);
      
      // This is where the real API call would go
      // const sdk = await import('@flight-app/sdk');
      // const result = await client(sdk.listFlights).applyAction({});
      // setFlights(result.flights);
    } catch (error) {
      console.error('Error loading flights:', error);
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
  
  // Filter flights based on search term
  const filteredFlights = flights.filter(flight => 
    flight.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flight.status.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
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
        
        {/* Flights list */}
        <div style={{ 
          marginTop: '15px', 
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
            filteredFlights.map(flight => (
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
                  marginBottom: '5px'
                }}>
                  {flight.name}
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
            ))
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