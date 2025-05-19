// Export context providers and hooks for easier imports
import RouteContext, { RouteProvider, useRoute } from './RouteContext';
import FinanceContext, { FinanceProvider, useFinance } from './FinanceContext';

// Import RegionContext from the region directory
import RegionContext, { RegionProvider, useRegion } from './region/RegionContext';

export {
  RouteContext,
  RouteProvider,
  useRoute,
  FinanceContext,
  FinanceProvider,
  useFinance,
  RegionContext,
  RegionProvider,
  useRegion
};