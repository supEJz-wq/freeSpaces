import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './Pages/LandingPage';
import Dashboard from './Pages/Dashboard';
import Admin from './Pages/Admin';
import PostcardPage from './Pages/PostcardPage';
import PostcardWallPage from './Pages/PostcardWallPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<Dashboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/postcard" element={<PostcardPage />} />
        <Route path="/postcard-wall" element={<PostcardWallPage />} />
      </Routes>
    </Router>
  );
}

export default App;