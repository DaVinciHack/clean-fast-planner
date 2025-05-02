import React from 'react';
import { AuthProvider } from './context/AuthContext';
import FastPlannerPage from './pages/FastPlannerPage';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <FastPlannerPage />
    </AuthProvider>
  );
}

export default App;