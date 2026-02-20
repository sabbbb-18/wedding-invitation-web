import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import InvitationPage from './InvitationPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/invitation/:uniqueId" element={<InvitationPage />} />
        <Route path="/" element={
          <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">
                💌 Wedding Invitation System
              </h1>
              <p className="text-gray-600">
                Silakan akses menggunakan link undangan yang Anda terima
              </p>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}

export default App;