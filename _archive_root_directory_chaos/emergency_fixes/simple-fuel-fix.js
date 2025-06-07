// SIMPLE FUEL POLICY FIX
// Add this to FastPlannerApp.jsx imports and replace the complex logic

import { SimpleFuelPolicyManager } from './SimpleFuelPolicyManager';

// In component, replace fuel policy logic with:
const simpleFuelManager = useRef(new SimpleFuelPolicyManager());
const [currentFuelPolicy, setCurrentFuelPolicy] = useState(null);
const [availableFuelPolicies, setAvailableFuelPolicies] = useState([]);

// Region change effect - SIMPLE
useEffect(() => {
  if (activeRegionFromContext?.osdkRegion) {
    simpleFuelManager.current.loadPoliciesForRegion(activeRegionFromContext.osdkRegion)
      .then(policies => {
        setAvailableFuelPolicies(policies);
        setCurrentFuelPolicy(simpleFuelManager.current.selectedPolicy);
      });
  }
}, [activeRegionFromContext?.osdkRegion]);

// Aircraft change effect - SIMPLE  
useEffect(() => {
  if (selectedAircraft && availableFuelPolicies.length > 0) {
    const policy = simpleFuelManager.current.selectPolicyForAircraft(selectedAircraft);
    setCurrentFuelPolicy(policy);
  }
}, [selectedAircraft?.registration, availableFuelPolicies.length]);

// Pass to FlightSettings - SIMPLE
const simpleFuelPolicyObject = {
  availablePolicies: availableFuelPolicies,
  currentPolicy: currentFuelPolicy,
  selectPolicy: (policy) => {
    simpleFuelManager.current.selectPolicy(policy);
    setCurrentFuelPolicy(policy);
  }
};
