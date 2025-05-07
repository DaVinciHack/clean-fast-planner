/**
 * Contexts index - exports all Fast Planner Context Providers
 */

import RegionContext, { RegionProvider, useRegion } from './RegionContext';
import AircraftContext, { AircraftProvider, useAircraft } from './AircraftContext';
import RouteContext, { RouteProvider, useRoute } from './RouteContext';
import MapContext, { MapProvider, useMap } from './MapContext';
import FuelContext, { FuelProvider, useFuel } from './FuelContext';

export {
  RegionContext,
  RegionProvider,
  useRegion,
  AircraftContext,
  AircraftProvider,
  useAircraft,
  RouteContext,
  RouteProvider,
  useRoute,
  MapContext,
  MapProvider,
  useMap,
  FuelContext,
  FuelProvider,
  useFuel
};