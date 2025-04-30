import React from 'react';
import { AuthProvider } from './context/AuthContext';
import FastPlannerApp from './components/fast-planner/FastPlannerApp';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <div className="app-container">
        <FastPlannerApp />
      </div>
    </AuthProvider>
  );
}

export default App;