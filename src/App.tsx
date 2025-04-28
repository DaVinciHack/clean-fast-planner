import React from 'react';
import { AuthProvider } from './context/AuthContext';
import ModularFastPlannerComponent from './components/fast-planner/ModularFastPlannerComponent';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <div className="app-container">
        <ModularFastPlannerComponent />
      </div>
    </AuthProvider>
  );
}

export default App;