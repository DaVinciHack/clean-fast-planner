import React, { useState, useEffect } from 'react';
import { FlightLoaderService } from '../../../../services/flights';

/**
 * LoadFlightsCard Component
 * 
 * Card for loading and selecting saved flights
 */
const LoadFlightsCard = ({ 
  id,
  onClose, 
  onSelect,
  currentRegion
}) => {
  // State for flights and loading status
  const [flights, setFlights] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFlightId, setSelectedFlightId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Load flights when the component mounts or region changes
  useEffect(() => {
    loadFlights();
  }, [currentRegion]);
  
  // Function to load flights from the service
  const loadFlights = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const loadedFlights = await FlightLoaderService.loadFlights({
        region: currentRegion,
        searchQuery: searchQuery
      });
      
      setFlights(loadedFlights);
    } catch (error) {
      console.error('Error loading flights:', error);
      setErrorMessage(FlightLoaderService.formatErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    loadFlights();
  };
  
  // Handle flight selection
  const handleFlightSelect = (flightId) => {
    setSelectedFlightId(flightId);
  };
  
  // Handle loading the selected flight
  const handleLoadFlight = () => {
    if (!selectedFlightId) return;
    
    const selectedFlight = flights.find(flight => flight.id === selectedFlightId);
    if (selectedFlight) {
      onSelect(selectedFlight);
    }
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    loadFlights();
  };
  
  // Get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'Completed':
        return '#4caf50'; // Green
      case 'Planned':
        return '#2196f3'; // Blue
      case 'In Progress':
        return '#ff9800'; // Orange
      default:
        return '#9e9e9e'; // Grey
    }
  };
  
  // Format date for display (YYYY-MM-DD)
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  };
  
  // CSS styles to match the app's design
  const styles = {
    container: {
      maxWidth: '100%',
      width: '100%',
      color: 'white',
      fontSize: '14px'
    },
    header: {
      marginBottom: '15px'
    },
    searchContainer: {
      marginBottom: '15px'
    },
    searchInput: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #444',
      borderRadius: '4px',
      backgroundColor: 'rgba(30, 30, 30, 0.6)',
      color: 'white',
      fontSize: '14px',
      marginBottom: '10px'
    },
    flightList: {
      maxHeight: '400px',
      overflowY: 'auto',
      marginBottom: '15px',
      border: '1px solid #444',
      borderRadius: '4px'
    },
    flightItem: {
      padding: '10px',
      borderBottom: '1px solid #444',
      cursor: 'pointer',
      backgroundColor: 'rgba(30, 30, 30, 0.6)',
      transition: 'background-color 0.2s'
    },
    selectedFlight: {
      backgroundColor: 'rgba(3, 141, 222, 0.3)',
      borderLeft: '3px solid #038dde'
    },
    flightTitle: {
      fontSize: '16px',
      fontWeight: 'bold',
      marginBottom: '5px'
    },
    flightInfo: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '13px',
      marginBottom: '3px'
    },
    buttonRow: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
      marginTop: '15px'
    },
    button: {
      padding: '8px 16px',
      borderRadius: '4px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 'normal'
    },
    refreshButton: {
      backgroundColor: '#2196f3',
      color: 'white'
    },
    cancelButton: {
      backgroundColor: '#444',
      color: 'white'
    },
    loadButton: {
      backgroundColor: '#4caf50',
      color: 'white'
    },
    disabledButton: {
      backgroundColor: '#444',
      cursor: 'not-allowed',
      opacity: 0.7
    },
    errorMessage: {
      color: '#f44336',
      backgroundColor: 'rgba(244, 67, 54, 0.1)',
      border: '1px solid #f44336',
      borderRadius: '4px',
      padding: '10px',
      marginBottom: '15px'
    },
    statusBadge: {
      display: 'inline-block',
      padding: '3px 6px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 'bold'
    },
    loadingSpinner: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px'
    },
    noResults: {
      textAlign: 'center',
      padding: '20px',
      color: '#ccc'
    }
  };
  
  return (
    <div className="tab-content" style={styles.container}>
      <div className="panel-header" style={styles.header}>
        <h3>Load Saved Flights</h3>
      </div>
      
      <div style={styles.searchContainer}>
        <form onSubmit={handleSearch}>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search Flights:"
            style={styles.searchInput}
          />
        </form>
      </div>
      
      {errorMessage && (
        <div style={styles.errorMessage}>
          {errorMessage}
        </div>
      )}
      
      <div style={styles.flightList}>
        {isLoading ? (
          <div style={styles.loadingSpinner}>
            Loading flights...
          </div>
        ) : flights.length === 0 ? (
          <div style={styles.noResults}>
            No flights found
          </div>
        ) : (
          flights.map(flight => (
            <div
              key={flight.id}
              style={{
                ...styles.flightItem,
                ...(selectedFlightId === flight.id ? styles.selectedFlight : {})
              }}
              onClick={() => handleFlightSelect(flight.id)}
            >
              <div style={styles.flightTitle}>
                {flight.title}
                <span style={{
                  ...styles.statusBadge,
                  backgroundColor: getStatusColor(flight.status),
                  float: 'right'
                }}>
                  {flight.status}
                </span>
              </div>
              
              <div style={styles.flightInfo}>
                <span>{formatDateDisplay(flight.etd)}</span>
                <span>{flight.formattedDate.split(' ')[1]}</span>
              </div>
              
              {flight.flightNumber && (
                <div style={{...styles.flightInfo, opacity: 0.7}}>
                  Flight: {flight.flightNumber}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      <div style={styles.buttonRow}>
        <button
          onClick={handleRefresh}
          style={{
            ...styles.button,
            ...styles.refreshButton,
            ...(isLoading ? styles.disabledButton : {})
          }}
          disabled={isLoading}
        >
          Refresh
        </button>
        
        <button
          onClick={onClose}
          style={{
            ...styles.button,
            ...styles.cancelButton
          }}
        >
          Cancel
        </button>
        
        <button
          onClick={handleLoadFlight}
          style={{
            ...styles.button,
            ...(selectedFlightId ? styles.loadButton : styles.disabledButton)
          }}
          disabled={!selectedFlightId}
        >
          Load
        </button>
      </div>
    </div>
  );
};

export default LoadFlightsCard;