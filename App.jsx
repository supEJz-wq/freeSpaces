import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './Components/LandingPage'; // Updated path to match your folder!
import Dashboard from '../freeSpace/src/Dashboard.jsx'; // Assuming Dashboard.jsx is still in the src/ folder

function App() {
  return (
    <Router>
      <Routes>
        {/* The root URL shows the Welcome Homepage */}
        <Route path="/" element={<LandingPage />} />
        
        {/* /home shows the Dashboard we built earlier */}
        <Route path="/home" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;