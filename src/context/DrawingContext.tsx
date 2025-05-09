import React, { createContext, useContext, useState, useCallback } from 'react';
import { ShapeConfig, Tool } from '../types';
import { v4 as uuidv4 } from 'uuid';

type HistoryAction = 'add' | 'modify' | 'delete' | 'reset';

interface HistoryState {
  shapes: ShapeConfig[];
  action: HistoryAction;
}

interface DrawingContextType {
  shapes: ShapeConfig[];
  selectedId: string | null;
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  addShape: (shape: ShapeConfig) => void;
  updateShape: (shape: ShapeConfig) => void;
  deleteShape: (id: string) => void;
  selectShape: (id: string | null) => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  cloneSelectedShape: () => void;
}

const DrawingContext = createContext<DrawingContextType | undefined>(undefined);

export const DrawingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [shapes, setShapes] = useState<ShapeConfig[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const addToHistory = useCallback((newShapes: ShapeConfig[], action: HistoryAction) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ shapes: JSON.parse(JSON.stringify(newShapes)), action });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);
  
  const addShape = useCallback((shape: ShapeConfig) => {
    const newShapes = [...shapes, shape];
    setShapes(newShapes);
    addToHistory(newShapes, 'add');
  }, [shapes, addToHistory]);
  
  const updateShape = useCallback((shape: ShapeConfig) => {
    const newShapes = shapes.map(s => s.id === shape.id ? shape : s);
    setShapes(newShapes);
    addToHistory(newShapes, 'modify');
  }, [shapes, addToHistory]);
  
  const deleteShape = useCallback((id: string) => {
    const newShapes = shapes.filter(s => s.id !== id);
    setShapes(newShapes);
    setSelectedId(null);
    addToHistory(newShapes, 'delete');
  }, [shapes, addToHistory]);
  
  const selectShape = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);
  
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setShapes(JSON.parse(JSON.stringify(history[newIndex].shapes)));
      setHistoryIndex(newIndex);
      setSelectedId(null);
    }
  }, [history, historyIndex]);
  
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setShapes(JSON.parse(JSON.stringify(history[newIndex].shapes)));
      setHistoryIndex(newIndex);
      setSelectedId(null);
    }
  }, [history, historyIndex]);

  const reset = useCallback(() => {
    setShapes([]);
    setSelectedId(null);
    setActiveTool('select');
    addToHistory([], 'reset');
  }, [addToHistory]);

  const cloneSelectedShape = useCallback(() => {
    if (selectedId) {
      const selectedShape = shapes.find(shape => shape.id === selectedId);
      if (selectedShape) {
        const clonedShape = {
          ...JSON.parse(JSON.stringify(selectedShape)),
          id: uuidv4(),
          x: selectedShape.x + 20,
          y: selectedShape.y + 20
        };
        const newShapes = [...shapes, clonedShape];
        setShapes(newShapes);
        setSelectedId(clonedShape.id);
        addToHistory(newShapes, 'add');
      }
    }
  }, [selectedId, shapes, addToHistory]);
  
  return (
    <DrawingContext.Provider
      value={{
        shapes,
        selectedId,
        activeTool,
        setActiveTool,
        addShape,
        updateShape,
        deleteShape,
        selectShape,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1,
        undo,
        redo,
        reset,
        cloneSelectedShape
      }}
    >
      {children}
    </DrawingContext.Provider>
  );
};

export const useDrawing = () => {
  const context = useContext(DrawingContext);
  if (context === undefined) {
    throw new Error('useDrawing must be used within a DrawingProvider');
  }
  return context;
};