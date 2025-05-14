/**
 * regions.js
 * 
 * Contains region definitions for the Fast Planner application
 */

// Region definitions with center coordinates and bounds
const regions = [
  {
    id: 'gulf-of-mexico',
    name: 'Gulf of Mexico',
    center: [-90.5, 27.5],
    zoom: 6,
    bounds: [
      [-98, 24], // Southwest corner [lng, lat]
      [-83, 31]  // Northeast corner [lng, lat]
    ],
    osdkRegion: 'GULF OF MEXICO' // Matches the region name in Foundry database
  },
  {
    id: 'norway',
    name: 'Norway',
    center: [4.0, 59.0],
    zoom: 5.5,
    bounds: [
      [1, 55], // Southwest corner [lng, lat]
      [9, 63]  // Northeast corner [lng, lat]
    ],
    osdkRegion: 'NORWAY' // Matches the region name in Foundry database
  },
  {
    id: 'united-kingdom',
    name: 'United Kingdom',
    center: [-1.5, 57.0],
    zoom: 5.5,
    bounds: [
      [-5, 51], // Southwest corner [lng, lat]
      [1, 62]   // Northeast corner [lng, lat]
    ],
    osdkRegion: 'UNITED KINGDOM' // Matches the region name in Foundry database
  },
  {
    id: 'west-africa',
    name: 'West Africa',
    center: [5.0, 2.0],
    zoom: 5,
    bounds: [
      [-1, -5], // Southwest corner [lng, lat]
      [11, 9]   // Northeast corner [lng, lat]
    ],
    osdkRegion: 'NIGERIA' // Updated to match Foundry database
  },
  {
    id: 'brazil',
    name: 'Brazil',
    center: [-38.0, -22.0],
    zoom: 5,
    bounds: [
      [-45, -26], // Southwest corner [lng, lat]
      [-31, -18]  // Northeast corner [lng, lat]
    ],
    osdkRegion: 'EAST BRAZIL' // Updated to match Foundry database
  },
  {
    id: 'australia',
    name: 'Australia NW Shelf',
    center: [116.0, -19.0],
    zoom: 5,
    bounds: [
      [110, -23], // Southwest corner [lng, lat]
      [122, -15]  // Northeast corner [lng, lat]
    ],
    osdkRegion: 'WESTERN AUSTRALIA' // Updated to match Foundry database
  }
];

export default regions;
