import { useState } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from '@/components/LandingPage';
import FileAnalyzer from '@/components/FileAnalyzer';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <div className="App">
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/analyzer" element={<FileAnalyzer />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;