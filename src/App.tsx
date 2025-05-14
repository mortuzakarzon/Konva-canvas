import React from 'react';
import DrawingCanvas from './components/DrawingCanvas';
import Toolbar from './components/Toolbar';
import { DrawingProvider } from './context/DrawingContext';

function App() {
  return (
    <DrawingProvider>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white shadow-sm py-4 px-6 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-800">React Konva Drawing Tool</h1>
        </header>
        
        <main className="flex flex-1 overflow-hidden">
          <div className="flex flex-col flex-1">
            <Toolbar />
            <div className="flex-1 overflow-hidden">
              <DrawingCanvas />
            </div>
          </div>
        </main>
      </div>
    </DrawingProvider>
  );
}

export default App