import React from 'react';
import { AuthProvider } from './context/AuthContext';
import FastPlannerPage from './pages/FastPlannerPage';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <div className="app-container">
        <FastPlannerPage />
      </div>
    </AuthProvider>
  );
}

export default App;