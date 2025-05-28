/**
 * WeatherSegmentsService.js
 * 
 * Service for loading and processing weather segments from Palantir OSDK
 * Handles Norwegian weather data with ranking system for flight planning
 */

import client from '../../../client';

class WeatherSegmentsService {
  
  /**
   * Load weather segments for a specific flight
   */
  static async loadWeatherSegmentsForFlight(flightUuid) {
    if (!flightUuid) {
      throw new Error('Flight UUID is required to load weather segments');
    }
    
    try {
      console.log(`WeatherSegmentsService: Loading weather segments for flight ${flightUuid}`);
      
      const sdk = await import('@flight-app/sdk');
      
      if (!sdk.NorwayWeatherSegments) {
        throw new Error('NorwayWeatherSegments not found in SDK');
      }
      
      const result = await client(sdk.NorwayWeatherSegments)
        .where({
          flightUuid: flightUuid
        })
        .fetchPageWithErrors({
          $pageSize: 100
        });
      
      if (!result.value || !result.value.data) {
        console.log(`WeatherSegmentsService: No weather segments found`);
        return { success: true, segments: [], alternates: [] };
      }
      
      const segments = result.value.data;
      console.log(`WeatherSegmentsService: Found ${segments.length} segments`);
      
      const processedData = this.processWeatherSegments(segments);
      return { success: true, ...processedData };
    }    catch (error) {
      console.error('WeatherSegmentsService: Error loading weather segments:', error);
      return {
        success: false,
        error: error.message || 'Failed to load weather segments',
        segments: [],
        alternates: []
      };
    }
  }
  
  /**
   * Process raw weather segments into categorized and ranked data
   */
  static processWeatherSegments(rawSegments) {
    const mainSegments = [];
    const alternateSegments = [];
    const weatherData = [];
    
    rawSegments.forEach(segment => {
      const processedSegment = this.processSingleSegment(segment);
      
      if (segment.isAlternateFor) {
        alternateSegments.push(processedSegment);
      } else {
        mainSegments.push(processedSegment);
      }
      
      // Extract weather data for each segment (segments 1-10)
      for (let i = 1; i <= 10; i++) {
        const segmentData = segment[`segment${i}`];
        const ranking = segment[`ranking${i}`];
        
        if (segmentData && ranking) {
          weatherData.push({
            segmentIndex: i,
            data: segmentData,
            ranking: ranking,
            color: this.getRankingColor(ranking),
            airportIcao: segment.airportIcao,
            flightUuid: segment.flightUuid,
            geoPoint: segment.geoPoint,
            timestamp: segment.timestamp
          });
        }
      }
    });
    
    // Sort segments by distance from departure if available
    mainSegments.sort((a, b) => 
      (a.distanceFromDeparture || 0) - (b.distanceFromDeparture || 0)
    );
    
    alternateSegments.sort((a, b) => 
      (a.alternateRanking || 0) - (b.alternateRanking || 0)
    );
    
    console.log(`WeatherSegmentsService: Processed ${mainSegments.length} main, ${alternateSegments.length} alternates`);
    
    return {
      segments: mainSegments,
      alternates: alternateSegments,
      weatherData: weatherData,
      totalSegments: rawSegments.length
    };
  }  
  /**
   * Process a single weather segment with all necessary properties
   */
  static processSingleSegment(segment) {
    return {
      uniqueId: segment.uniqueId,
      airportIcao: segment.airportIcao,
      flightUuid: segment.flightUuid,
      geoPoint: segment.geoPoint,
      alternateGeoShape: segment.alternateGeoShape,
      windSpeed: segment.windSpeed,
      windDirection: segment.windDirection,
      crosswindComponent: segment.crosswindComponent,
      rawMetar: segment.rawMetar,
      rawTaf: segment.rawTaf,
      weatherSource: segment.weatherSource,
      arrivalTime: segment.arrivalTime,
      estimatedFlightTime: segment.estimatedFlightTime,
      distanceFromDeparture: segment.distanceFromDeparture,
      distanceFromDestination: segment.distanceFromDestination,
      distanceForAlternate: segment.distanceForAlternate,
      isRig: segment.isRig,
      isAccessible: segment.isAccessible,
      isDaytime: segment.isDaytime,
      araRequired: segment.araRequired,
      isAlternateFor: segment.isAlternateFor,
      alternateRanking: segment.alternateRanking,
      alternateBearing: segment.alternateBearing,
      approachSegment: segment.approachSegment,
      approachRanking: segment.approachRanking,
      altApproachType: segment.altApproachType,
      altRunway: segment.altRunway,
      sunrise: segment.sunrise,
      sunset: segment.sunset,
      timestamp: segment.timestamp,
      limitations: segment.limitations,
      warnings: segment.warnings,
      notams: segment.notams,
      deckReport: segment.deckReport,
      color: this.getSegmentColor(segment),
      priority: this.getSegmentPriority(segment)
    };
  }
  
  /**
   * Get color for ranking based on Norwegian aviation standards
   */
  static getRankingColor(ranking) {
    switch (ranking) {
      case 5:
        return '#E91E63'; // Pink/Red - Below minimums, cannot be used
      case 8:
        return '#FF9800'; // Orange - ARA required (rigs only)
      case 10:
        return '#FF9800'; // Orange - Warning
      case 15:
        return '#4CAF50'; // Green - Good conditions
      case 20:
        return '#9E9E9E'; // Grey - Outside arrival window
      default:
        return '#2196F3'; // Blue - Default/Unknown
    }
  }  
  /**
   * Get overall segment color based on primary ranking and conditions
   */
  static getSegmentColor(segment) {
    if (segment.araRequired) return '#FF9800'; // Orange - ARA required
    if (segment.warnings) return '#F44336'; // Red - Warnings present
    if (!segment.isAccessible) return '#E91E63'; // Pink - Not accessible
    if (!segment.isDaytime) return '#3F51B5'; // Indigo - Night operations
    if (segment.isRig) return '#00BCD4'; // Cyan - Rig operation
    
    const primaryRanking = segment.ranking1 || segment.alternateRanking;
    if (primaryRanking) {
      return this.getRankingColor(primaryRanking);
    }
    
    return '#2196F3'; // Default blue
  }
  
  /**
   * Get segment priority for display ordering
   */
  static getSegmentPriority(segment) {
    if (segment.warnings) return 1; // Highest priority
    if (!segment.isAccessible) return 2;
    if (segment.araRequired) return 3;
    if (segment.isAlternateFor) return 4; // Alternates lower priority
    return 5; // Normal segments
  }
  
  /**
   * Get human-readable description for ranking
   */
  static getRankingDescription(ranking) {
    switch (ranking) {
      case 5:
        return 'Below alternate minimums - Cannot be used';
      case 8:
        return 'ARA required for rig operations';
      case 10:
        return 'Weather warning conditions';
      case 15:
        return 'Good weather conditions';
      case 20:
        return 'Outside arrival time window';
      default:
        return `Weather ranking: ${ranking}`;
    }
  }
  
  /**
   * Extract wind data for flight calculations
   */
  static extractWindDataForRoute(segments) {
    if (!segments || segments.length === 0) {
      return null;
    }
    
    let totalWindSpeed = 0;
    let totalWindDirection = 0;
    let validSegments = 0;
    
    segments.forEach(segment => {
      if (segment.windSpeed !== undefined && segment.windDirection !== undefined) {
        totalWindSpeed += segment.windSpeed;
        totalWindDirection += segment.windDirection;
        validSegments++;
      }
    });
    
    if (validSegments === 0) {
      return null;
    }
    
    return {
      windSpeed: Math.round(totalWindSpeed / validSegments),
      windDirection: Math.round(totalWindDirection / validSegments),
      source: 'OSDK_Weather_Segments',
      segmentCount: validSegments,
      lastUpdated: segments[0]?.timestamp
    };
  }
}

export default WeatherSegmentsService;