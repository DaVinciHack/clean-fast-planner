import React from 'react';

/**
 * SVG Icons for the Stop Cards
 * All blue-themed icons for consistency
 */

export const DistanceIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" 
      fill="#3498db" />
  </svg>
);

export const TimeIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.99 2C6.47 2 2 6.48 2 12C2 17.52 6.47 22 11.99 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 11.99 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20ZM12.5 7H11V13L16.25 16.15L17 14.92L12.5 12.25V7Z" 
      fill="#3498db" />
  </svg>
);

export const FuelIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.77 7.23L19.78 7.22L16.06 3.5L15 4.56L17.11 6.67C16.17 7.03 15.5 7.93 15.5 9C15.5 10.38 16.62 11.5 18 11.5C18.36 11.5 18.69 11.42 19 11.29V18.5C19 19.05 18.55 19.5 18 19.5C17.45 19.5 17 19.05 17 18.5V14C17 12.9 16.1 12 15 12H14V5C14 3.9 13.1 3 12 3H6C4.9 3 4 3.9 4 5V21H14V13.5H15.5V18.5C15.5 19.88 16.62 21 18 21C19.38 21 20.5 19.88 20.5 18.5V9C20.5 8.31 20.22 7.68 19.77 7.23ZM12 10H6V5H12V10Z" 
      fill="#3498db" />
  </svg>
);

export const PassengerIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C5.67 13 1 14.17 1 16.5V19H15V16.5C15 14.17 10.33 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 13.89 17 15.02 17 16.5V19H23V16.5C23 14.17 18.33 13 16 13Z" 
      fill="#3498db" />
  </svg>
);

export const WindIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 5C14 3.9 13.1 3 12 3C10.9 3 10 3.9 10 5C10 6.1 10.9 7 12 7H20V9H12C9.24 9 7 6.76 7 4C7 1.24 9.24 -1 12 -1C14.76 -1 17 1.24 17 4V5H14ZM4 13C4 14.1 4.9 15 6 15C7.1 15 8 14.1 8 13C8 11.9 7.1 11 6 11H2V9H6C8.76 9 11 11.24 11 14C11 16.76 8.76 19 6 19C3.24 19 1 16.76 1 14V13H4ZM13 17C13 18.66 11.66 20 10 20C8.34 20 7 18.66 7 17C7 15.34 8.34 14 10 14H22V16H10C9.45 16 9 16.45 9 17C9 17.55 9.45 18 10 18H13V17Z" 
      fill="#3498db" />
  </svg>
);

// Icon set as a component with name props
export const StopIcon = ({ name }) => {
  switch (name) {
    case 'distance':
      return <DistanceIcon />;
    case 'time':
      return <TimeIcon />;
    case 'fuel':
      return <FuelIcon />;
    case 'passenger':
      return <PassengerIcon />;
    case 'wind':
      return <WindIcon />;
    default:
      return null;
  }
};