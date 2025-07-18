class WeatherCirclesLayer {
  constructor(map) {
    this.map = map;
    this.sourceId = "weather-circles-source";
    this.layerId = "weather-circles-layer";
    this.isVisible = false;
    this.currentWeatherSegments = [];
  }
  /**
   * Add weather circles to the map
   * @param {Array} weatherSegments - Array of weather segments with coordinates and rankings
   */
  addWeatherCircles(weatherSegments) {
    var _a;
    if (!weatherSegments || !this.map) {
      console.warn("WeatherCirclesLayer: Missing weatherSegments or map");
      return;
    }
    const lockStartTime = Date.now();
    if (window.weatherCirclesCreationInProgress) {
      const lockAge = Date.now() - (window.weatherCirclesLockTime || 0);
      console.log(`🔄 WeatherCirclesLayer: Creation lock active for ${lockAge}ms`);
      if (lockAge > 1e4) {
        console.log("🔓 WeatherCirclesLayer: Clearing stale lock (older than 10s)");
        window.weatherCirclesCreationInProgress = false;
        window.weatherCirclesLockTime = null;
      } else {
        console.log("🔄 WeatherCirclesLayer: Recent lock detected, skipping duplicate request");
        return;
      }
    }
    window.weatherCirclesCreationInProgress = true;
    window.weatherCirclesLockTime = lockStartTime;
    console.log(`🔒 WeatherCirclesLayer: Setting creation lock at ${lockStartTime}`);
    const clearLock = () => {
      if (window.weatherCirclesCreationInProgress && window.weatherCirclesLockTime === lockStartTime) {
        window.weatherCirclesCreationInProgress = false;
        window.weatherCirclesLockTime = null;
        console.log(`🔓 WeatherCirclesLayer: Clearing creation lock (held for ${Date.now() - lockStartTime}ms)`);
      }
    };
    setTimeout(clearLock, 5e3);
    console.log("🟡 WeatherCirclesLayer: Adding", weatherSegments.length, "weather circles to map");
    this.currentWeatherSegments = weatherSegments;
    this.removeWeatherCircles();
    const allArrowData = [];
    const validSegments = [];
    const alternateLocations = /* @__PURE__ */ new Set();
    const processedLocations = /* @__PURE__ */ new Set();
    weatherSegments.forEach((segment) => {
      if (segment.alternateGeoShape && (segment.airportIcao || segment.locationName)) {
        alternateLocations.add(segment.airportIcao || segment.locationName);
      }
    });
    console.log("🔄 DEDUP: Found alternates for locations:", Array.from(alternateLocations));
    weatherSegments.forEach((segment, index) => {
      var _a2, _b, _c, _d;
      console.log(`🔍 Segment ${index}:`, {
        airportIcao: segment.airportIcao,
        locationName: segment.locationName,
        isRig: segment.isRig,
        alternateGeoShape: segment.alternateGeoShape,
        ranking2: segment.ranking2,
        hasAlternateCoords: !!(((_b = (_a2 = segment.alternateGeoShape) == null ? void 0 : _a2.coordinates) == null ? void 0 : _b.length) >= 2),
        hasGeoPoint: !!segment.geoPoint,
        geoPoint: segment.geoPoint
      });
      const hasValidRanking = segment.ranking2 !== void 0 && segment.ranking2 !== null;
      if (!hasValidRanking) {
        console.log(`❌ Invalid segment ${index}: no valid ranking`);
        return;
      }
      const locationKey = segment.airportIcao || segment.locationName;
      if (locationKey) {
        if (!segment.isRig && !segment.alternateGeoShape && alternateLocations.has(locationKey)) {
          console.log(`🔄 DEDUP: Skipping destination ${locationKey} - alternate exists for same location`);
          return;
        }
        if (processedLocations.has(locationKey)) {
          console.log(`🔄 DEDUP: Skipping duplicate ${locationKey} - already processed`);
          return;
        }
        processedLocations.add(locationKey);
      }
      if (segment.alternateGeoShape && segment.alternateGeoShape.coordinates && Array.isArray(segment.alternateGeoShape.coordinates) && segment.alternateGeoShape.coordinates.length >= 2) {
        const ranking = segment.ranking2;
        const alternateSegment = {
          ...segment,
          ranking2: ranking,
          extractedCoordinates: segment.alternateGeoShape.coordinates[1],
          circleType: "alternate"
        };
        validSegments.push(alternateSegment);
        console.log(`✅ Alternate ${index}: ${segment.airportIcao} at ${JSON.stringify(segment.alternateGeoShape.coordinates[1])} with ranking ${ranking}`);
        console.log(`🚨 COORDINATE DEBUG: Full alternateGeoShape.coordinates for ${segment.airportIcao}:`, JSON.stringify(segment.alternateGeoShape.coordinates, null, 2));
        console.log(`🌬️ COLLECTING: Alternate arrow data for ${segment.airportIcao}`);
        let windSpeed = null, windDirection = null, windGust = null, windSource = "Unknown";
        let comprehensiveMetarData = null;
        if (segment.rawMetar && window.weatherVisualizationManager) {
          const metarSpeed = window.weatherVisualizationManager.parseWindSpeedFromMetar(segment.rawMetar);
          const metarDir = window.weatherVisualizationManager.parseWindDirectionFromMetar(segment.rawMetar);
          const metarGust = window.weatherVisualizationManager.parseWindGustFromMetar(segment.rawMetar);
          comprehensiveMetarData = window.weatherVisualizationManager.parseComprehensiveMetar(segment.rawMetar);
          if (metarSpeed !== null && metarDir !== null) {
            windSpeed = metarSpeed;
            windDirection = metarDir;
            windGust = metarGust;
            windSource = "METAR";
          }
        }
        if (windSpeed === null && segment.windSpeed) {
          windSpeed = segment.windSpeed;
          windDirection = segment.windDirection;
          windGust = segment.windGust;
          windSource = "Segment";
        }
        if (windSpeed !== null) {
          allArrowData.push({
            rigName: segment.airportIcao,
            latitude: segment.alternateGeoShape.coordinates[1][1],
            longitude: segment.alternateGeoShape.coordinates[1][0],
            isAirport: !segment.isRig,
            windSpeed,
            windDirection,
            windGust,
            windSource,
            flightCategory: segment.flightCategory || "VFR",
            visibility: (comprehensiveMetarData == null ? void 0 : comprehensiveMetarData.visibility) || segment.visibility || 10,
            temperature: (comprehensiveMetarData == null ? void 0 : comprehensiveMetarData.temperature) || segment.temperature,
            conditions: segment.conditions || segment.weather || "Clear",
            stationId: segment.airportIcao,
            locationType: "alternate",
            // Enhanced METAR data for better popups
            comprehensiveMetar: comprehensiveMetarData,
            rawMetar: segment.rawMetar,
            rawTaf: segment.rawTaf,
            clouds: (comprehensiveMetarData == null ? void 0 : comprehensiveMetarData.clouds) || [],
            weatherConditions: (comprehensiveMetarData == null ? void 0 : comprehensiveMetarData.conditions) || [],
            altimeter: comprehensiveMetarData == null ? void 0 : comprehensiveMetarData.altimeter,
            dewpoint: comprehensiveMetarData == null ? void 0 : comprehensiveMetarData.dewpoint
          });
          console.log(`🌬️ COLLECTED: Alternate ${segment.airportIcao} arrow data`);
        } else {
          console.log(`🌬️ SKIP: No wind data for alternate ${segment.airportIcao}`);
        }
        console.log(`🎯 SKIP: Not creating separate split point arrow for ${segment.airportIcao} - prevents duplicates`);
      } else if (segment.isRig) {
        console.log(`🛢️ Processing rig weather: ${segment.airportIcao}`);
        let rigCoordinates = null;
        if (window.currentWaypoints && Array.isArray(window.currentWaypoints)) {
          const matchingWaypoint = window.currentWaypoints.find(
            (wp) => {
              var _a3, _b2;
              return wp.name === segment.airportIcao || ((_a3 = wp.name) == null ? void 0 : _a3.toUpperCase()) === ((_b2 = segment.airportIcao) == null ? void 0 : _b2.toUpperCase());
            }
          );
          if (matchingWaypoint && matchingWaypoint.lng && matchingWaypoint.lat) {
            rigCoordinates = [matchingWaypoint.lng, matchingWaypoint.lat];
            console.log(`🛢️ Found rig ${segment.airportIcao} coordinates from currentWaypoints:`, rigCoordinates);
          }
        }
        if (!rigCoordinates && ((_c = window.waypointManager) == null ? void 0 : _c.getWaypoints)) {
          const waypoints = window.waypointManager.getWaypoints();
          const matchingWaypoint = waypoints.find(
            (wp) => {
              var _a3, _b2;
              return wp.name === segment.airportIcao || ((_a3 = wp.name) == null ? void 0 : _a3.toUpperCase()) === ((_b2 = segment.airportIcao) == null ? void 0 : _b2.toUpperCase());
            }
          );
          if (matchingWaypoint && matchingWaypoint.lng && matchingWaypoint.lat) {
            rigCoordinates = [matchingWaypoint.lng, matchingWaypoint.lat];
            console.log(`🛢️ Found rig ${segment.airportIcao} coordinates from waypointManager:`, rigCoordinates);
          }
        }
        if (!rigCoordinates && window.globalWaypoints && Array.isArray(window.globalWaypoints)) {
          const matchingWaypoint = window.globalWaypoints.find(
            (wp) => {
              var _a3, _b2;
              return wp.name === segment.airportIcao || ((_a3 = wp.name) == null ? void 0 : _a3.toUpperCase()) === ((_b2 = segment.airportIcao) == null ? void 0 : _b2.toUpperCase());
            }
          );
          if (matchingWaypoint && matchingWaypoint.lng && matchingWaypoint.lat) {
            rigCoordinates = [matchingWaypoint.lng, matchingWaypoint.lat];
            console.log(`🛢️ Found rig ${segment.airportIcao} coordinates from globalWaypoints:`, rigCoordinates);
          }
        }
        if (!rigCoordinates && window.debugStopCards && Array.isArray(window.debugStopCards)) {
          const matchingStopCard = window.debugStopCards.find(
            (card) => {
              var _a3, _b2, _c2, _d2;
              return card.name === segment.airportIcao || ((_a3 = card.name) == null ? void 0 : _a3.toUpperCase()) === ((_b2 = segment.airportIcao) == null ? void 0 : _b2.toUpperCase()) || card.stop === segment.airportIcao || ((_c2 = card.stop) == null ? void 0 : _c2.toUpperCase()) === ((_d2 = segment.airportIcao) == null ? void 0 : _d2.toUpperCase());
            }
          );
          if (matchingStopCard && matchingStopCard.coordinates) {
            rigCoordinates = matchingStopCard.coordinates;
            console.log(`🛢️ Found rig ${segment.airportIcao} coordinates from stopCards:`, rigCoordinates);
          }
        }
        if (rigCoordinates) {
          const rigSegment = {
            ...segment,
            ranking2: segment.ranking2,
            extractedCoordinates: rigCoordinates,
            circleType: "rig"
          };
          validSegments.push(rigSegment);
          console.log(`✅ Rig ${segment.airportIcao}: Found coordinates ${JSON.stringify(rigCoordinates)} with ranking ${segment.ranking2}`);
          console.log(`🌬️ COLLECTING: Rig arrow data for ${segment.airportIcao}`);
          let windSpeed = null, windDirection = null, windGust = null, windSource = "Unknown";
          console.log(`🌬️ RIG DEBUG: Available wind fields for ${segment.airportIcao}:`, {
            rawMetar: segment.rawMetar,
            rawTaf: segment.rawTaf,
            windSpeed: segment.windSpeed,
            windDirection: segment.windDirection,
            windGust: segment.windGust,
            wind: segment.wind,
            allKeys: Object.keys(segment).filter((key) => key.toLowerCase().includes("wind"))
          });
          let comprehensiveMetarData = null;
          if (segment.rawMetar && window.weatherVisualizationManager) {
            console.log(`🌬️ RIG METAR: Parsing METAR for ${segment.airportIcao}: "${segment.rawMetar}"`);
            const metarSpeed = window.weatherVisualizationManager.parseWindSpeedFromMetar(segment.rawMetar);
            const metarDir = window.weatherVisualizationManager.parseWindDirectionFromMetar(segment.rawMetar);
            const metarGust = window.weatherVisualizationManager.parseWindGustFromMetar(segment.rawMetar);
            comprehensiveMetarData = window.weatherVisualizationManager.parseComprehensiveMetar(segment.rawMetar);
            console.log(`🌬️ RIG METAR: Parsed values - Speed: ${metarSpeed}, Dir: ${metarDir}, Gust: ${metarGust}`);
            console.log(`🌬️ RIG METAR: Comprehensive data:`, comprehensiveMetarData);
            if (metarSpeed !== null && metarDir !== null) {
              windSpeed = metarSpeed;
              windDirection = metarDir;
              windGust = metarGust;
              windSource = "METAR";
              console.log(`🌬️ RIG METAR: ✅ Successfully extracted wind from METAR for ${segment.airportIcao}`);
            } else {
              console.log(`🌬️ RIG METAR: ❌ METAR parsing failed for ${segment.airportIcao}`);
            }
          }
          if (windSpeed === null && segment.rawTaf && window.weatherVisualizationManager) {
            console.log(`🌬️ RIG TAF: Parsing TAF for ${segment.airportIcao}: "${segment.rawTaf}"`);
            const tafSpeed = window.weatherVisualizationManager.parseWindSpeedFromMetar(segment.rawTaf);
            const tafDir = window.weatherVisualizationManager.parseWindDirectionFromMetar(segment.rawTaf);
            const tafGust = window.weatherVisualizationManager.parseWindGustFromMetar(segment.rawTaf);
            console.log(`🌬️ RIG TAF: Parsed values - Speed: ${tafSpeed}, Dir: ${tafDir}, Gust: ${tafGust}`);
            if (tafSpeed !== null && tafDir !== null) {
              windSpeed = tafSpeed;
              windDirection = tafDir;
              windGust = tafGust;
              windSource = "Pseudo TAF";
              console.log(`🌬️ RIG TAF: ✅ Successfully extracted wind from TAF for ${segment.airportIcao}`);
            }
          }
          if (windSpeed === null && segment.windSpeed !== void 0 && segment.windSpeed !== null) {
            windSpeed = segment.windSpeed;
            windDirection = segment.windDirection;
            windGust = segment.windGust;
            windSource = "Rig Model Data";
          }
          if (windSpeed === null && segment.wind) {
            if (typeof segment.wind === "object") {
              windSpeed = segment.wind.speed || segment.wind.windSpeed;
              windDirection = segment.wind.direction || segment.wind.windDirection;
              windGust = segment.wind.gust || segment.wind.windGust;
              windSource = "Rig Wind Object";
            }
          }
          if (windSpeed === null) {
            const possibleSpeedFields = ["windSpeedKts", "windSpeedMps", "speed", "wspd"];
            const possibleDirFields = ["windDirectionDeg", "direction", "wdir"];
            for (const field of possibleSpeedFields) {
              if (segment[field] !== void 0 && segment[field] !== null) {
                windSpeed = segment[field];
                windSource = `Rig Field: ${field}`;
                break;
              }
            }
            for (const field of possibleDirFields) {
              if (segment[field] !== void 0 && segment[field] !== null) {
                windDirection = segment[field];
                break;
              }
            }
          }
          if (windSpeed !== null) {
            allArrowData.push({
              rigName: segment.airportIcao,
              latitude: rigCoordinates[1],
              longitude: rigCoordinates[0],
              isAirport: false,
              windSpeed,
              windDirection,
              windGust,
              windSource,
              flightCategory: segment.flightCategory || "VFR",
              visibility: (comprehensiveMetarData == null ? void 0 : comprehensiveMetarData.visibility) || segment.visibility || 10,
              temperature: (comprehensiveMetarData == null ? void 0 : comprehensiveMetarData.temperature) || segment.temperature,
              conditions: segment.conditions || segment.weather || "Clear",
              stationId: segment.airportIcao,
              locationType: "rig",
              // Enhanced METAR data for better popups
              comprehensiveMetar: comprehensiveMetarData,
              rawMetar: segment.rawMetar,
              rawTaf: segment.rawTaf,
              clouds: (comprehensiveMetarData == null ? void 0 : comprehensiveMetarData.clouds) || [],
              weatherConditions: (comprehensiveMetarData == null ? void 0 : comprehensiveMetarData.conditions) || [],
              altimeter: comprehensiveMetarData == null ? void 0 : comprehensiveMetarData.altimeter,
              dewpoint: comprehensiveMetarData == null ? void 0 : comprehensiveMetarData.dewpoint
            });
            console.log(`🌬️ COLLECTED: Rig ${segment.airportIcao} arrow data`);
          } else {
            console.log(`🌬️ SKIP: No wind data for rig ${segment.airportIcao}`);
          }
        } else {
          console.log(`❌ Rig ${segment.airportIcao}: Could not find coordinates in any source`);
        }
      } else if (!segment.isRig) {
        console.log(`✈️ Processing destination weather: ${segment.airportIcao || segment.locationName}`);
        let destinationCoordinates = null;
        if (segment.geoPoint) {
          destinationCoordinates = this.parseGeoPoint(segment.geoPoint);
          if (destinationCoordinates) {
            console.log(`✈️ Found destination ${segment.airportIcao} coordinates from geoPoint:`, destinationCoordinates);
          }
        }
        if (!destinationCoordinates && window.currentWaypoints && Array.isArray(window.currentWaypoints)) {
          const matchingWaypoint = window.currentWaypoints.find(
            (wp) => {
              var _a3, _b2;
              return wp.name === segment.airportIcao || ((_a3 = wp.name) == null ? void 0 : _a3.toUpperCase()) === ((_b2 = segment.airportIcao) == null ? void 0 : _b2.toUpperCase());
            }
          );
          if (matchingWaypoint && matchingWaypoint.lng && matchingWaypoint.lat) {
            destinationCoordinates = [matchingWaypoint.lng, matchingWaypoint.lat];
            console.log(`✈️ Found destination ${segment.airportIcao} coordinates from currentWaypoints:`, destinationCoordinates);
          }
        }
        if (!destinationCoordinates && ((_d = window.waypointManager) == null ? void 0 : _d.getWaypoints)) {
          const waypoints = window.waypointManager.getWaypoints();
          const matchingWaypoint = waypoints.find(
            (wp) => {
              var _a3, _b2;
              return wp.name === segment.airportIcao || ((_a3 = wp.name) == null ? void 0 : _a3.toUpperCase()) === ((_b2 = segment.airportIcao) == null ? void 0 : _b2.toUpperCase());
            }
          );
          if (matchingWaypoint && matchingWaypoint.lng && matchingWaypoint.lat) {
            destinationCoordinates = [matchingWaypoint.lng, matchingWaypoint.lat];
            console.log(`✈️ Found destination ${segment.airportIcao} coordinates from waypointManager:`, destinationCoordinates);
          }
        }
        if (!destinationCoordinates && window.debugStopCards && Array.isArray(window.debugStopCards)) {
          const matchingStopCard = window.debugStopCards.find(
            (card) => {
              var _a3, _b2, _c2, _d2;
              return card.name === segment.airportIcao || ((_a3 = card.name) == null ? void 0 : _a3.toUpperCase()) === ((_b2 = segment.airportIcao) == null ? void 0 : _b2.toUpperCase()) || card.stop === segment.airportIcao || ((_c2 = card.stop) == null ? void 0 : _c2.toUpperCase()) === ((_d2 = segment.airportIcao) == null ? void 0 : _d2.toUpperCase());
            }
          );
          if (matchingStopCard && matchingStopCard.coordinates) {
            destinationCoordinates = matchingStopCard.coordinates;
            console.log(`✈️ Found destination ${segment.airportIcao} coordinates from stopCards:`, destinationCoordinates);
          }
        }
        if (destinationCoordinates) {
          const destinationSegment = {
            ...segment,
            ranking2: segment.ranking2,
            extractedCoordinates: destinationCoordinates,
            circleType: "destination"
          };
          validSegments.push(destinationSegment);
          console.log(`✅ Destination ${segment.airportIcao || segment.locationName}: Found coordinates ${JSON.stringify(destinationCoordinates)} with ranking ${segment.ranking2}`);
          console.log(`🌬️ COLLECTING: Destination arrow data for ${segment.airportIcao}`);
          let windSpeed = null, windDirection = null, windGust = null, windSource = "Unknown";
          let comprehensiveMetarData = null;
          if (segment.rawMetar && window.weatherVisualizationManager) {
            const metarSpeed = window.weatherVisualizationManager.parseWindSpeedFromMetar(segment.rawMetar);
            const metarDir = window.weatherVisualizationManager.parseWindDirectionFromMetar(segment.rawMetar);
            const metarGust = window.weatherVisualizationManager.parseWindGustFromMetar(segment.rawMetar);
            comprehensiveMetarData = window.weatherVisualizationManager.parseComprehensiveMetar(segment.rawMetar);
            if (metarSpeed !== null && metarDir !== null) {
              windSpeed = metarSpeed;
              windDirection = metarDir;
              windGust = metarGust;
              windSource = "METAR";
            }
          }
          if (windSpeed === null && segment.windSpeed) {
            windSpeed = segment.windSpeed;
            windDirection = segment.windDirection;
            windGust = segment.windGust;
            windSource = "Segment";
          }
          if (windSpeed !== null) {
            allArrowData.push({
              rigName: segment.airportIcao || segment.locationName,
              latitude: destinationCoordinates[1],
              longitude: destinationCoordinates[0],
              isAirport: true,
              windSpeed,
              windDirection,
              windGust,
              windSource,
              flightCategory: segment.flightCategory || "VFR",
              visibility: (comprehensiveMetarData == null ? void 0 : comprehensiveMetarData.visibility) || segment.visibility || 10,
              temperature: (comprehensiveMetarData == null ? void 0 : comprehensiveMetarData.temperature) || segment.temperature,
              conditions: segment.conditions || segment.weather || "Clear",
              stationId: segment.airportIcao || segment.locationName,
              locationType: "destination",
              // Enhanced METAR data for better popups
              comprehensiveMetar: comprehensiveMetarData,
              rawMetar: segment.rawMetar,
              rawTaf: segment.rawTaf,
              clouds: (comprehensiveMetarData == null ? void 0 : comprehensiveMetarData.clouds) || [],
              weatherConditions: (comprehensiveMetarData == null ? void 0 : comprehensiveMetarData.conditions) || [],
              altimeter: comprehensiveMetarData == null ? void 0 : comprehensiveMetarData.altimeter,
              dewpoint: comprehensiveMetarData == null ? void 0 : comprehensiveMetarData.dewpoint
            });
            console.log(`🌬️ COLLECTED: Destination ${segment.airportIcao} arrow data`);
          } else {
            console.log(`🌬️ SKIP: No wind data for destination ${segment.airportIcao}`);
          }
        } else {
          console.log(`❌ Destination ${segment.airportIcao || segment.locationName}: Could not find coordinates from any source (geoPoint: ${segment.geoPoint})`);
        }
      } else {
        console.log(`❌ Segment ${index} (${segment.airportIcao || segment.locationName}) has no coordinates and is not a rig or destination`);
      }
    });
    const deduplicatedSegments = this.deduplicateCirclesByLocation(validSegments);
    console.log(`🟡 Found ${validSegments.length} total segments, deduplicated to ${deduplicatedSegments.length} unique locations`);
    if (deduplicatedSegments.length === 0) {
      console.log("🔴 No valid segments found, adding test circles instead");
      clearLock();
      this.addTestCircles();
      return;
    }
    console.log("🟢 WeatherCirclesLayer: Processing", deduplicatedSegments.length, "deduplicated segments");
    const outerMostFeatures = deduplicatedSegments.map((segment) => this.createRingFeature(segment, "outermost")).filter((f) => f !== null);
    const outerFeatures = deduplicatedSegments.map((segment) => this.createRingFeature(segment, "outer")).filter((f) => f !== null);
    const middleFeatures = deduplicatedSegments.map((segment) => this.createRingFeature(segment, "middle")).filter((f) => f !== null);
    const innerFeatures = deduplicatedSegments.map((segment) => this.createRingFeature(segment, "inner")).filter((f) => f !== null);
    const innerMostFeatures = deduplicatedSegments.map((segment) => this.createRingFeature(segment, "innermost")).filter((f) => f !== null);
    if (outerFeatures.length === 0) {
      console.log("🔴 No valid ring features created");
      clearLock();
      return;
    }
    console.log(`🟢 Created ${outerFeatures.length} concentric ring sets`);
    this.addAlternateLines(weatherSegments);
    this.map.addSource(this.sourceId + "-outermost", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: outerMostFeatures
      }
    });
    this.map.addSource(this.sourceId, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: outerFeatures
      }
    });
    this.map.addSource(this.sourceId + "-middle", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: middleFeatures
      }
    });
    this.map.addSource(this.sourceId + "-inner", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: innerFeatures
      }
    });
    this.map.addSource(this.sourceId + "-innermost", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: innerMostFeatures
      }
    });
    const hasCircleGeometry = outerFeatures.some((f) => f.geometry.type === "Polygon");
    const hasPointGeometry = outerFeatures.some((f) => f.geometry.type === "Point");
    console.log("WeatherCirclesLayer: Geometry types found:", { hasCircleGeometry, hasPointGeometry });
    let beforeLayer = this.findFirstRouteLayer();
    if (hasCircleGeometry) {
      this.map.addLayer({
        id: this.layerId + "-outermost",
        type: "line",
        source: this.sourceId + "-outermost",
        filter: ["==", "$type", "Polygon"],
        paint: {
          "line-color": ["get", "color"],
          "line-width": 2,
          "line-opacity": 0.15
          // Very faint
        },
        layout: {
          "visibility": "visible"
        }
      }, beforeLayer);
      this.map.addLayer({
        id: this.layerId + "-outer",
        type: "line",
        source: this.sourceId,
        filter: ["==", "$type", "Polygon"],
        paint: {
          "line-color": ["get", "color"],
          "line-width": 2,
          "line-opacity": 0.25
          // Faint
        },
        layout: {
          "visibility": "visible"
        }
      }, beforeLayer);
      this.map.addLayer({
        id: this.layerId + "-middle",
        type: "line",
        source: this.sourceId + "-middle",
        paint: {
          "line-color": ["get", "color"],
          "line-width": 2,
          "line-opacity": 0.5
        },
        layout: {
          "visibility": "visible"
        }
      }, beforeLayer);
      this.map.addLayer({
        id: this.layerId + "-inner",
        type: "line",
        source: this.sourceId + "-inner",
        paint: {
          "line-color": ["get", "color"],
          "line-width": 2,
          "line-opacity": 0.75
        },
        layout: {
          "visibility": "visible"
        }
      }, beforeLayer);
      this.map.addLayer({
        id: this.layerId + "-innermost",
        type: "line",
        source: this.sourceId + "-innermost",
        paint: {
          "line-color": ["get", "color"],
          "line-width": 2,
          "line-opacity": 0.95
          // Brightest
        },
        layout: {
          "visibility": "visible"
        }
      }, beforeLayer);
      console.log("WeatherCirclesLayer: Added 5 concentric ring layers");
      console.log("🔗 POPUP: WeatherCirclesLayer popup disabled - RigWeatherGraphics has more detailed weather data");
    }
    if (hasPointGeometry) {
      const pointLayerId = this.layerId + "-points";
      this.map.addLayer({
        id: pointLayerId + "-outer",
        type: "circle",
        source: this.sourceId,
        filter: ["==", "$type", "Point"],
        paint: {
          "circle-color": "transparent",
          "circle-radius": ["case", ["has", "radius"], ["/", ["get", "radius"], 80], 60],
          "circle-stroke-color": ["get", "color"],
          "circle-stroke-width": 3,
          "circle-stroke-opacity": 0.3
        },
        layout: {
          "visibility": "visible"
        }
      }, beforeLayer);
      this.map.addLayer({
        id: pointLayerId + "-middle",
        type: "circle",
        source: this.sourceId,
        filter: ["==", "$type", "Point"],
        paint: {
          "circle-color": "transparent",
          "circle-radius": ["case", ["has", "radius"], ["/", ["get", "radius"], 120], 40],
          "circle-stroke-color": ["get", "color"],
          "circle-stroke-width": 2,
          "circle-stroke-opacity": 0.5
        },
        layout: {
          "visibility": "visible"
        }
      }, beforeLayer);
      this.map.addLayer({
        id: pointLayerId + "-inner",
        type: "circle",
        source: this.sourceId,
        filter: ["==", "$type", "Point"],
        paint: {
          "circle-color": "transparent",
          "circle-radius": ["case", ["has", "radius"], ["/", ["get", "radius"], 160], 25],
          "circle-stroke-color": ["get", "color"],
          "circle-stroke-width": 2,
          "circle-stroke-opacity": 0.95
          // Brightened from 0.8 to 0.95
        },
        layout: {
          "visibility": "visible"
        }
      }, beforeLayer);
      console.log("WeatherCirclesLayer: Added concentric ring layers for points");
      console.log("🔗 POPUP: WeatherCirclesLayer popup disabled - RigWeatherGraphics has more detailed weather data");
    }
    this.isVisible = true;
    console.log("WeatherCirclesLayer: Added", outerFeatures.length, "weather circles");
    if (allArrowData.length > 0 && window.rigWeatherIntegration && window.rigWeatherIntegration.updateRigWeather) {
      console.log(
        `🌬️ CREATING ARROWS: ${allArrowData.length} wind arrows for all locations:`,
        allArrowData.map((a) => `${a.rigName}(${a.locationType})`)
      );
      try {
        window.rigWeatherIntegration.updateRigWeather(allArrowData);
        console.log(`🌬️ ARROWS: ✅ Successfully created ${allArrowData.length} wind arrows`);
        const arrowTypes = allArrowData.reduce((acc, arrow) => {
          acc[arrow.locationType] = (acc[arrow.locationType] || 0) + 1;
          return acc;
        }, {});
        console.log(`🌬️ ARROWS: Arrow breakdown:`, arrowTypes);
      } catch (error) {
        console.error(`🌬️ ARROWS: Error creating wind arrows:`, error);
      }
    } else {
      console.log(`🌬️ ARROWS: Cannot create arrows - rigWeatherIntegration not available or missing updateRigWeather method`);
      console.log(`🌬️ DEBUG: rigWeatherIntegration exists: ${!!window.rigWeatherIntegration}`);
      console.log(`🌬️ DEBUG: updateRigWeather method exists: ${!!((_a = window.rigWeatherIntegration) == null ? void 0 : _a.updateRigWeather)}`);
    }
    clearLock();
    setTimeout(() => {
      const layersToCheck = [
        this.layerId + "-outermost",
        this.layerId + "-outer",
        this.layerId + "-middle",
        this.layerId + "-inner",
        this.layerId + "-innermost",
        this.layerId + "-points-outer",
        this.layerId + "-points-middle",
        this.layerId + "-points-inner",
        this.layerId + "-lines"
      ];
      const foundLayers = layersToCheck.filter((layerId) => this.map.getLayer(layerId));
      if (foundLayers.length > 0) {
        console.log(`✅ WeatherCirclesLayer: ${foundLayers.length} layers successfully added to map:`, foundLayers);
      } else {
        console.warn("⚠️ WeatherCirclesLayer: No weather circle layers found in map after adding - this may be normal if no features were created");
        console.log("🔍 WeatherCirclesLayer: Available layers:", layersToCheck.map((id) => ({ id, exists: !!this.map.getLayer(id) })));
      }
    }, 200);
  }
  /**
   * Create a ring feature for a weather segment with specific size
   * @param {Object} segment - Weather segment with extractedCoordinates and ranking
   * @param {string} ringType - 'outer', 'middle', or 'inner'
   * @returns {Object} GeoJSON feature
   */
  createRingFeature(segment, ringType) {
    const coords = segment.extractedCoordinates;
    if (!coords || !Array.isArray(coords) || coords.length !== 2) {
      console.warn("WeatherCirclesLayer: Invalid extractedCoordinates:", coords);
      return null;
    }
    const ranking = segment.ranking2;
    const color = this.getAviationRankingColor(ranking);
    console.log(`🎨 RING CREATION: ${ringType} ring for ${segment.airportIcao} (${segment.circleType}) at ${coords} with ranking ${segment.ranking2} = COLOR ${color}`);
    const baseRadius = this.getCircleRadius(ranking);
    let radius;
    switch (ringType) {
      case "outermost":
        radius = baseRadius * 1.8;
        break;
      case "outer":
        radius = baseRadius * 1.4;
        break;
      case "middle":
        radius = baseRadius * 1;
        break;
      case "inner":
        radius = baseRadius * 0.7;
        break;
      case "innermost":
        radius = baseRadius * 0.4;
        break;
      default:
        radius = baseRadius;
    }
    if (!window.turf) {
      console.warn("WeatherCirclesLayer: Turf.js not available, creating simple point feature");
      return {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: coords
        },
        properties: {
          airportIcao: segment.airportIcao || "Unknown",
          ranking,
          color,
          isRig: segment.isRig || false,
          radius: radius * 1e3,
          // Convert km to meters for point display
          ringType
        }
      };
    }
    const center = window.turf.point(coords);
    const circle = window.turf.buffer(center, radius, { units: "kilometers" });
    return {
      type: "Feature",
      geometry: circle.geometry,
      properties: {
        airportIcao: segment.airportIcao || "Unknown",
        ranking,
        color,
        isRig: segment.isRig || false,
        ringType
      }
    };
  }
  /**
   * Parse geoPoint string to coordinates
   * @param {string} geoPoint - Comma-separated lat,lng string
   * @returns {Array} [longitude, latitude] coordinates or null
   */
  parseGeoPoint(geoPoint) {
    if (!geoPoint) return null;
    console.log("WeatherCirclesLayer: Parsing geoPoint:", geoPoint);
    try {
      const parts = geoPoint.split(",");
      if (parts.length === 2) {
        const lat = parseFloat(parts[0].trim());
        const lon = parseFloat(parts[1].trim());
        console.log("WeatherCirclesLayer: Parsed coordinates:", { lat, lon, isValidLat: !isNaN(lat), isValidLon: !isNaN(lon) });
        if (!isNaN(lat) && !isNaN(lon)) {
          const coords = [lon, lat];
          console.log("WeatherCirclesLayer: Final coordinates (GeoJSON format):", coords);
          if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
            return coords;
          } else {
            console.warn("WeatherCirclesLayer: Coordinates out of valid range:", { lat, lon });
            return null;
          }
        }
      }
    } catch (error) {
      console.error("WeatherCirclesLayer: Error parsing geoPoint:", geoPoint, error);
    }
    return null;
  }
  /**
   * Get circle radius based on weather ranking
   * @param {number} ranking - Weather ranking (5, 8, 10, 15, 20)
   * @returns {number} Radius in kilometers
   */
  getCircleRadius(ranking) {
    const baseRadius = 8;
    switch (ranking) {
      case 5:
        return baseRadius * 1.2;
      case 8:
        return baseRadius * 1.1;
      case 10:
        return baseRadius;
      case 15:
        return baseRadius * 0.9;
      case 20:
        return baseRadius * 0.8;
      default:
        return baseRadius;
    }
  }
  /**
   * Get aviation ranking color using the centralized color system from WeatherCard.jsx
   * @param {number} ranking - Weather ranking
   * @returns {string} Hex color code
   */
  getAviationRankingColor(ranking) {
    switch (ranking) {
      case 5:
        return "#D32F2F";
      // Red - Below alternate minimums
      case 8:
        return "#8E24AA";
      // Brighter purple - ARA fuel needed at rig
      case 10:
        return "#F57C00";
      // Orange - Warning conditions
      case 15:
        return "#66BB6A";
      // Much brighter green - Good conditions
      case 20:
        return "#616161";
      // Grey - Not applicable to landing time
      default:
        return "#1976D2";
    }
  }
  /**
   * Remove weather circles from map
   */
  removeWeatherCircles() {
    if (window.weatherCirclesCreationInProgress) {
      console.log("🔓 WeatherCirclesLayer: Clearing creation lock during removal");
      window.weatherCirclesCreationInProgress = false;
      window.weatherCirclesLockTime = null;
    }
    if (!this.map) {
      console.warn("🧹 WeatherCirclesLayer: Cannot remove weather circles - map reference is null/undefined");
      return;
    }
    try {
      const hoverLayer = this.layerId + "-hover-areas";
      if (this.map.getLayer && this.map.getLayer(hoverLayer)) {
        this.map.off("mouseenter", hoverLayer);
        this.map.off("mouseleave", hoverLayer);
        console.log("🧹 Removed weather hover event listeners");
      }
      if (this.popup) {
        this.popup.remove();
        this.popup = null;
        console.log("🧹 Removed weather popup instance");
      }
      const ringLayers = ["-outermost", "-outer", "-middle", "-inner", "-innermost"];
      ringLayers.forEach((suffix) => {
        if (this.map.getLayer(this.layerId + suffix)) {
          this.map.removeLayer(this.layerId + suffix);
        }
      });
      const pointRingLayers = ["-points-outer", "-points-middle", "-points-inner"];
      pointRingLayers.forEach((suffix) => {
        if (this.map.getLayer(this.layerId + suffix)) {
          this.map.removeLayer(this.layerId + suffix);
        }
      });
      if (this.map.getLayer(this.layerId)) {
        this.map.removeLayer(this.layerId);
      }
      if (this.map.getLayer(this.layerId + "-points")) {
        this.map.removeLayer(this.layerId + "-points");
      }
      if (this.map.getLayer(this.layerId + "-lines")) {
        this.map.removeLayer(this.layerId + "-lines");
      }
      if (this.map.getLayer(this.layerId + "-lines-shadow")) {
        this.map.removeLayer(this.layerId + "-lines-shadow");
      }
      if (this.map.getSource(this.sourceId + "-lines")) {
        this.map.removeSource(this.sourceId + "-lines");
      }
      if (this.map.getSource(this.sourceId + "-lines-shadow")) {
        this.map.removeSource(this.sourceId + "-lines-shadow");
      }
      if (this.map.getLayer(this.layerId + "-hover-areas")) {
        this.map.removeLayer(this.layerId + "-hover-areas");
      }
      if (this.map.getSource(this.sourceId + "-hover-areas")) {
        this.map.removeSource(this.sourceId + "-hover-areas");
      }
      const sources = ["-outermost", "", "-middle", "-inner", "-innermost"];
      sources.forEach((suffix) => {
        if (this.map.getSource(this.sourceId + suffix)) {
          this.map.removeSource(this.sourceId + suffix);
        }
      });
    } catch (error) {
      console.error("WeatherCirclesLayer: Error removing weather circles:", error);
    }
  }
  /**
   * Toggle layer visibility
   */
  toggle() {
    this.isVisible = !this.isVisible;
    const visibility = this.isVisible ? "visible" : "none";
    if (this.map.getLayer(this.layerId)) {
      this.map.setLayoutProperty(this.layerId, "visibility", visibility);
    }
  }
  /**
   * Add test weather circles for debugging
   */
  addTestCircles() {
    console.log("WeatherCirclesLayer: Adding test circles for debugging");
    console.log("WeatherCirclesLayer: Map state:", {
      hasMap: !!this.map,
      mapLoaded: this.map ? this.map.loaded ? this.map.loaded() : "checking..." : false,
      mapStyle: this.map ? this.map.getStyle() : null
    });
    const testSegments = [
      {
        geoPoint: "27.5, -90.5",
        // Should be in Gulf of Mexico southwest of New Orleans
        airportIcao: "TEST1",
        ranking2: 5,
        // Use ranking2 to match real data structure
        isRig: false
      },
      {
        geoPoint: "28.0, -89.5",
        // Should be in Gulf of Mexico south of New Orleans
        airportIcao: "TEST2",
        ranking2: 8,
        // Use ranking2 to match real data structure
        isRig: true
      },
      {
        geoPoint: "26.8, -91.2",
        // Should be in Gulf of Mexico southwest of Louisiana
        airportIcao: "TEST3",
        ranking2: 15,
        // Use ranking2 to match real data structure
        isRig: false
      },
      {
        geoPoint: "27.8, -88.5",
        // Should be in Gulf of Mexico southeast of New Orleans
        airportIcao: "TEST4",
        ranking2: 10,
        // Use ranking2 to match real data structure
        isRig: false
      }
    ];
    console.log("WeatherCirclesLayer: Created test segments:", testSegments);
    this.addWeatherCircles(testSegments);
  }
  /**
   * Add curved dotted lines from split points to alternate destinations
   * @param {Array} validSegments - Weather segments with coordinates
   */
  addAlternateLines(validSegments) {
    console.log("🔗 Adding curved dotted lines for weather alternate routes");
    if (!this.map) {
      console.warn("🔗 WeatherCirclesLayer: Cannot add alternate lines - map reference is null/undefined");
      return;
    }
    const flightAlternateData = window.flightAlternateData;
    let correctSplitPoint = null;
    if (flightAlternateData && flightAlternateData.splitPoint) {
      if (typeof flightAlternateData.splitPoint === "string") {
        const parts = flightAlternateData.splitPoint.split(",");
        if (parts.length === 2) {
          const lat = parseFloat(parts[0].trim());
          const lng = parseFloat(parts[1].trim());
          correctSplitPoint = [lng, lat];
          console.log("🎯 CORRECT SPLIT POINT: Using flight data split point:", correctSplitPoint);
        }
      } else if (Array.isArray(flightAlternateData.splitPoint)) {
        correctSplitPoint = flightAlternateData.splitPoint;
        console.log("🎯 CORRECT SPLIT POINT: Using flight data split point array:", correctSplitPoint);
      }
    }
    if (!correctSplitPoint) {
      console.warn("🎯 WARNING: No correct split point available from flight data - alternate lines may be incorrect");
      console.warn("🎯 Available flight alternate data:", flightAlternateData);
    }
    const lineFeatures = [];
    validSegments.forEach((segment) => {
      if (segment.alternateGeoShape && segment.alternateGeoShape.coordinates && segment.alternateGeoShape.coordinates.length >= 2) {
        const splitPoint = correctSplitPoint || segment.alternateGeoShape.coordinates[0];
        const destination = segment.alternateGeoShape.coordinates[1];
        console.log(`🔗 Creating curved line from split ${JSON.stringify(splitPoint)} to ${segment.airportIcao} ${JSON.stringify(destination)}`);
        console.log(`🎯 SPLIT POINT SOURCE: ${correctSplitPoint ? "Flight Data (CORRECT)" : "Weather Segment (FALLBACK)"}`);
        console.log(`🚨 LINE DEBUG: Full coordinates array for ${segment.airportIcao}:`, JSON.stringify(segment.alternateGeoShape.coordinates, null, 2));
        const straightCoordinates = [splitPoint, destination];
        const lineFeature = {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: straightCoordinates
          },
          properties: {
            type: "weather-alternate-line",
            airportIcao: segment.airportIcao,
            ranking: segment.ranking2,
            isRig: segment.isRig || false
          }
        };
        lineFeatures.push(lineFeature);
      }
    });
    if (lineFeatures.length > 0) {
      const linesSourceId = this.sourceId + "-lines";
      const linesLayerId = this.layerId + "-lines";
      try {
        if (this.map.getLayer && this.map.getLayer(linesLayerId)) {
          this.map.removeLayer(linesLayerId);
        }
        if (this.map.getSource && this.map.getSource(linesSourceId)) {
          this.map.removeSource(linesSourceId);
        }
        this.map.addSource(linesSourceId, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: lineFeatures
          }
        });
        this.map.addSource(linesSourceId + "-shadow", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: this.createStraightShadowLines(validSegments)
          }
        });
        this.map.addLayer({
          id: linesLayerId + "-shadow",
          type: "line",
          source: linesSourceId + "-shadow",
          paint: {
            "line-color": "rgba(0, 0, 0, 0.2)",
            // LIGHTER shadow (was 0.6, now 0.2)
            "line-width": 2,
            // THINNER shadow (was 3, now 2)
            "line-blur": 1
            // BLURRIER shadow effect
            // REMOVED line-dasharray - solid line for shadow
          },
          layout: {
            "visibility": "visible"
          }
        });
        this.map.addLayer({
          id: linesLayerId,
          type: "line",
          source: linesSourceId,
          paint: {
            "line-color": "#999999",
            // Brighter grey (was #666666)
            "line-width": 1,
            // Single pixel width
            "line-dasharray": [3, 3]
            // Dotted pattern
          },
          layout: {
            "visibility": "visible"
          }
        });
        console.log("🔗 Added", lineFeatures.length, "curved dotted weather alternate lines");
      } catch (error) {
        console.error("🔗 Error adding alternate lines:", error);
      }
    } else {
      console.log("🔗 No valid segments found for alternate lines");
    }
  }
  // 🗑️ OLD POPUP SYSTEM REMOVED
  // The old popup system has been permanently removed to prevent confusion.
  // All popups are now handled by RigWeatherGraphics which has more detailed weather data.
  // 🗑️ OLD HOVER AREAS REMOVED
  // Hover areas are now handled by RigWeatherGraphics
  // 🗑️ OLD HOVER FEATURE CREATION REMOVED
  // 🗑️ OLD POPUP HELPER METHODS REMOVED
  // All popup functionality now handled by RigWeatherGraphics
  /**
   * Deduplicate circles by location (only keep one circle per unique location)
   * @param {Array} segments - Array of weather segments with coordinates
   * @returns {Array} Deduplicated segments
   */
  deduplicateCirclesByLocation(segments) {
    const locationMap = /* @__PURE__ */ new Map();
    segments.forEach((segment) => {
      if (!segment.extractedCoordinates) return;
      const [lng, lat] = segment.extractedCoordinates;
      const locationKey = `${Math.round(lng * 1e4)},${Math.round(lat * 1e4)}`;
      const existing = locationMap.get(locationKey);
      if (!existing || this.getCirclePriority(segment) > this.getCirclePriority(existing)) {
        const color = this.getAviationRankingColor(segment.ranking2);
        locationMap.set(locationKey, segment);
        console.log(`🎯 Deduplicate: Keeping ${segment.airportIcao} (${segment.circleType}) at ${locationKey} with ranking ${segment.ranking2} = COLOR ${color}`);
      } else {
        const existingColor = this.getAviationRankingColor(existing.ranking2);
        const segmentColor = this.getAviationRankingColor(segment.ranking2);
        console.log(`🎯 Deduplicate: Skipping ${segment.airportIcao} (${segment.circleType}) ranking=${segment.ranking2} color=${segmentColor} - already have ${existing.airportIcao} (${existing.circleType}) ranking=${existing.ranking2} color=${existingColor}`);
      }
    });
    return Array.from(locationMap.values());
  }
  /**
   * Get priority for circle deduplication (higher number = higher priority)
   * @param {Object} segment - Weather segment
   * @returns {number} Priority score
   */
  getCirclePriority(segment) {
    let basePriority = 0;
    switch (segment.circleType) {
      case "alternate":
        basePriority = 200;
        break;
      case "split":
        basePriority = 100;
        break;
      default:
        basePriority = 150;
    }
    const weatherPriority = segment.ranking2 ? 25 - segment.ranking2 : 0;
    return basePriority + weatherPriority;
  }
  /**
   * Find the first route layer to ensure weather rings go underneath
   * @returns {string|undefined} Layer ID to insert before, or undefined for top
   */
  findFirstRouteLayer() {
    var _a;
    if (!this.map) return void 0;
    const routeLayerPatterns = [
      "route-shadow",
      // Route shadows (lowest route layer)
      "route-glow",
      // Route glow effects
      "route-line",
      // Main route lines
      "route",
      // Generic route layers
      "alternate-shadow",
      // Alternate route shadows
      "alternate-glow",
      // Alternate glow
      "alternate-line",
      // Alternate lines
      "alternate",
      // Generic alternate layers
      "waypoint",
      // Waypoint layers
      "platform",
      // Platform layers
      "airfield"
      // Airfield layers
    ];
    const allLayers = ((_a = this.map.getStyle()) == null ? void 0 : _a.layers) || [];
    for (const pattern of routeLayerPatterns) {
      const matchingLayer = allLayers.find(
        (layer) => layer.id.toLowerCase().includes(pattern.toLowerCase())
      );
      if (matchingLayer) {
        console.log(`🎯 Weather rings will be placed before route layer: ${matchingLayer.id}`);
        return matchingLayer.id;
      }
    }
    console.log(`🎯 No route layers found, weather rings will be on top`);
    return void 0;
  }
  /**
   * Get rig coordinates from waypoints data
   * @param {string} rigIcao - Rig ICAO code to find
   * @returns {Array|null} [lng, lat] coordinates or null
   */
  getRigCoordinatesFromWaypoints(rigIcao) {
    var _a, _b, _c, _d, _e;
    console.log(`🔧 DEBUG: Looking for rig coordinates for ${rigIcao}...`);
    console.log(`🔧 DEBUG: Available window objects:`, Object.keys(window).filter((k) => k.includes("waypoint") || k.includes("route")));
    if (window.waypointManager) {
      try {
        const waypoints = window.waypointManager.waypoints || ((_b = (_a = window.waypointManager).getWaypoints) == null ? void 0 : _b.call(_a)) || window.waypointManager.currentWaypoints;
        console.log(`🔧 DEBUG: WaypointManager waypoints:`, waypoints);
        if (waypoints && Array.isArray(waypoints)) {
          const matchingWaypoint = waypoints.find(
            (wp) => wp.name === rigIcao || wp.id === rigIcao || wp.airportIcao === rigIcao
          );
          if (matchingWaypoint && matchingWaypoint.lat && matchingWaypoint.lng) {
            console.log(`✅ Found coordinates for rig ${rigIcao} in waypointManager:`, [matchingWaypoint.lng, matchingWaypoint.lat]);
            return [matchingWaypoint.lng, matchingWaypoint.lat];
          }
        }
        const waypointManagerKeys = Object.keys(window.waypointManager);
        console.log(`🔍 WaypointManager available methods/properties:`, waypointManagerKeys);
        for (const key of waypointManagerKeys) {
          const value = window.waypointManager[key];
          if (Array.isArray(value) && value.length > 0) {
            console.log(`🔍 Checking waypointManager.${key}:`, value);
            const match = value.find(
              (wp) => (wp.name === rigIcao || wp.id === rigIcao || wp.airportIcao === rigIcao) && wp.lat && wp.lng
            );
            if (match) {
              console.log(`✅ Found coordinates for rig ${rigIcao} in waypointManager.${key}:`, [match.lng, match.lat]);
              return [match.lng, match.lat];
            }
          }
        }
      } catch (error) {
        console.warn(`Error accessing waypointManager:`, error);
      }
    }
    if (window.routeCalculator) {
      try {
        const routeWaypoints = window.routeCalculator.waypoints || ((_d = (_c = window.routeCalculator).getWaypoints) == null ? void 0 : _d.call(_c)) || ((_e = window.routeCalculator.currentRoute) == null ? void 0 : _e.waypoints);
        if (routeWaypoints && Array.isArray(routeWaypoints)) {
          const match = routeWaypoints.find(
            (wp) => (wp.name === rigIcao || wp.id === rigIcao || wp.airportIcao === rigIcao) && wp.lat && wp.lng
          );
          if (match) {
            console.log(`✅ Found coordinates for rig ${rigIcao} in routeCalculator:`, [match.lng, match.lat]);
            return [match.lng, match.lat];
          }
        }
      } catch (error) {
        console.warn(`Error accessing routeCalculator:`, error);
      }
    }
    console.warn(`❌ Could not find coordinates for rig ${rigIcao} in any waypoint source`);
    return null;
  }
  /**
   * Create straight shadow lines for 3D effect
   * @param {Array} validSegments - Weather segments with coordinates
   * @returns {Array} Array of straight line features for shadows
   */
  createStraightShadowLines(validSegments) {
    const shadowFeatures = [];
    const flightAlternateData = window.flightAlternateData;
    let correctSplitPoint = null;
    if (flightAlternateData && flightAlternateData.splitPoint) {
      if (typeof flightAlternateData.splitPoint === "string") {
        const parts = flightAlternateData.splitPoint.split(",");
        if (parts.length === 2) {
          const lat = parseFloat(parts[0].trim());
          const lng = parseFloat(parts[1].trim());
          correctSplitPoint = [lng, lat];
        }
      } else if (Array.isArray(flightAlternateData.splitPoint)) {
        correctSplitPoint = flightAlternateData.splitPoint;
      }
    }
    validSegments.forEach((segment) => {
      if (segment.alternateGeoShape && segment.alternateGeoShape.coordinates && segment.alternateGeoShape.coordinates.length >= 2) {
        const splitPoint = correctSplitPoint || segment.alternateGeoShape.coordinates[0];
        const destination = segment.alternateGeoShape.coordinates[1];
        const shadowFeature = {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [splitPoint, destination]
            // Straight line for shadow
          },
          properties: {
            type: "weather-alternate-shadow",
            airportIcao: segment.airportIcao
          }
        };
        shadowFeatures.push(shadowFeature);
      }
    });
    return shadowFeatures;
  }
  /**
   * Create curved line coordinates between two points (same as route curves)
   * @param {Array} start - [lng, lat] start coordinates
   * @param {Array} end - [lng, lat] end coordinates
   * @returns {Array} Array of curved coordinates
   */
  createCurvedLine(start, end) {
    const [startLng, startLat] = start;
    const [endLng, endLat] = end;
    const midLng = (startLng + endLng) / 2;
    const midLat = (startLat + endLat) / 2;
    const deltaLng = endLng - startLng;
    const deltaLat = endLat - startLat;
    const distance = Math.sqrt(deltaLng * deltaLng + deltaLat * deltaLat);
    const curveOffset = distance * 0.035;
    let perpLng = -deltaLat / distance * curveOffset;
    let perpLat = deltaLng / distance * curveOffset;
    if (perpLat < 0) {
      perpLng = -perpLng;
      perpLat = -perpLat;
    }
    const controlLng = midLng + perpLng;
    const controlLat = midLat + perpLat;
    const steps = 25;
    const coordinates = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const t2 = t * t;
      const oneMinusT = 1 - t;
      const oneMinusT2 = oneMinusT * oneMinusT;
      const lng = oneMinusT2 * startLng + 2 * oneMinusT * t * controlLng + t2 * endLng;
      const lat = oneMinusT2 * startLat + 2 * oneMinusT * t * controlLat + t2 * endLat;
      coordinates.push([lng, lat]);
    }
    return coordinates;
  }
  /**
   * Update weather circles with new data
   * @param {Array} weatherSegments - New weather segments data
   */
  updateWeatherCircles(weatherSegments) {
    this.addWeatherCircles(weatherSegments);
  }
  /**
   * Static method to auto-create weather circles when segments are loaded
   * Call this when weather segments are first loaded for a new flight
   */
  static autoCreateOnWeatherLoad(map, weatherSegments) {
    if (!map || !weatherSegments || weatherSegments.length === 0) {
      return;
    }
    console.log("🔄 AUTO-CREATE: Weather segments loaded, creating weather circles automatically");
    if (!window.currentWeatherCirclesLayer) {
      const weatherCirclesLayer = new WeatherCirclesLayer(map);
      weatherCirclesLayer.addWeatherCircles(weatherSegments);
      window.currentWeatherCirclesLayer = weatherCirclesLayer;
      console.log("🔄 AUTO-CREATE: Weather circles created automatically for new flight");
    } else {
      window.currentWeatherCirclesLayer.addWeatherCircles(weatherSegments);
      console.log("🔄 AUTO-CREATE: Weather circles updated automatically");
    }
  }
  /**
   * Global helper function to refresh weather circles from any available data
   * Useful for debugging and manual testing
   */
  static refreshFromAvailableData(map) {
    var _a;
    try {
      console.log("🔄 REFRESH: Attempting to refresh weather circles from available data");
      let weatherData = null;
      let dataSource = "none";
      if (((_a = window.loadedWeatherSegments) == null ? void 0 : _a.length) > 0) {
        weatherData = window.loadedWeatherSegments;
        dataSource = "window.loadedWeatherSegments";
      }
      console.log(`🔄 REFRESH: Found data from ${dataSource}, segments:`, (weatherData == null ? void 0 : weatherData.length) || 0);
      if (weatherData && weatherData.length > 0 && map) {
        if (window.currentWeatherCirclesLayer) {
          try {
            window.currentWeatherCirclesLayer.removeWeatherCircles();
          } catch (cleanupError) {
            console.warn("🔄 REFRESH: Error during cleanup:", cleanupError);
          }
        }
        const weatherCirclesLayer = new WeatherCirclesLayer(map);
        weatherCirclesLayer.addWeatherCircles(weatherData);
        window.currentWeatherCirclesLayer = weatherCirclesLayer;
        console.log("🔄 REFRESH: Weather circles refreshed successfully");
        return true;
      } else {
        console.log("🔄 REFRESH: No weather data available to refresh from");
        return false;
      }
    } catch (error) {
      console.error("🔄 REFRESH: Error refreshing weather circles:", error);
      return false;
    }
  }
}
window.refreshWeatherCircles = () => {
  var _a;
  if ((_a = window.mapManager) == null ? void 0 : _a.map) {
    return WeatherCirclesLayer.refreshFromAvailableData(window.mapManager.map);
  } else {
    console.error("🔄 REFRESH: Map not available for refresh");
    return false;
  }
};
window.clearWeatherCirclesLock = () => {
  if (window.weatherCirclesCreationInProgress) {
    const lockAge = Date.now() - (window.weatherCirclesLockTime || 0);
    console.log(`🔓 MANUAL: Clearing weather circles lock (was active for ${lockAge}ms)`);
    window.weatherCirclesCreationInProgress = false;
    window.weatherCirclesLockTime = null;
    return true;
  } else {
    console.log("🔓 MANUAL: No active lock to clear");
    return false;
  }
};
window.checkWeatherCirclesLock = () => {
  if (window.weatherCirclesCreationInProgress) {
    const lockAge = Date.now() - (window.weatherCirclesLockTime || 0);
    console.log(`🔒 LOCK STATUS: Active for ${lockAge}ms (set at ${new Date(window.weatherCirclesLockTime).toLocaleTimeString()})`);
    return { active: true, ageMs: lockAge, setAt: window.weatherCirclesLockTime };
  } else {
    console.log("🔓 LOCK STATUS: No active lock");
    return { active: false };
  }
};
export {
  WeatherCirclesLayer as default
};
//# sourceMappingURL=WeatherCirclesLayer-Bt0rLZ19.js.map
