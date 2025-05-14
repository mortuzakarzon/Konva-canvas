import React, { useRef, useEffect, useState } from 'react';
import { useDrawing } from '../context/DrawingContext';
import { Square, Circle, MousePointer, Type, Pencil, Minus, Trash2, RotateCcw, RotateCw, Image, RefreshCw, Copy } from 'lucide-react';
import { Tool } from '../types';
import { v4 as uuidv4 } from 'uuid';

const tools: { id: Tool; icon: React.ReactNode; title: string }[] = [
  { id: 'select', icon: <MousePointer size={20} />, title: 'Select' },
  { id: 'rectangle', icon: <Square size={20} />, title: 'Rectangle' },
  { id: 'ellipse', icon: <Circle size={20} />, title: 'Ellipse' },
  { id: 'line', icon: <Minus size={20} />, title: 'Line' },
  { id: 'text', icon: <Type size={20} />, title: 'Text' },
  { id: 'freehand', icon: <Pencil size={20} />, title: 'Freehand' },
  { id: 'image', icon: <Image size={20} />, title: 'Upload Image' },
];

const DEFAULT_FILL = 'rgba(0, 70, 168)';
const DEFAULT_STROKE = '#3886F6';
const DEFAULT_OPACITY = 0.1;

const Toolbar: React.FC = () => {
  const {
    shapes,
    selectedId,
    activeTool,
    setActiveTool,
    addShape,
    selectShape,
    updateShape,
    deleteShape,
    canUndo,
    canRedo,
    undo,
    redo,
    reset,
    cloneSelectedShape,
    setLastUsedFill,
    setLastUsedStroke,
    setLastUsedOpacity,
    lastUsedStroke
  } = useDrawing();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedShape, setSelectedShape] = useState<any>(null);
  const [fontSize, setFontSize] = useState(16);
  const [fillColor, setFillColor] = useState(DEFAULT_FILL);
  const [strokeColor, setStrokeColor] = useState(DEFAULT_STROKE);
  const [opacity, setOpacity] = useState(DEFAULT_OPACITY);

  useEffect(() => {
    if (selectedId) {
      const shape = shapes.find(s => s.id === selectedId);
      if (shape) {
        setSelectedShape(shape);
        if (shape.type === 'text') {
          setFontSize(shape.fontSize || 16);
          setFillColor(shape.fill || '#000000');
        } else if (shape.type === 'rectangle' || shape.type === 'ellipse') {
          // Extract the base color from rgba
          const fillMatch = shape.fill?.match(/rgba\(([^)]+)\)/);
          if (fillMatch) {
            const [r, g, b] = fillMatch[1].split(',').map(n => parseInt(n));
            const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            setFillColor(hex);
          }
          setStrokeColor(shape.stroke || DEFAULT_STROKE);
          setOpacity(shape.opacity || DEFAULT_OPACITY);
        } else if (shape.type === 'line' || shape.type === 'freehand') {
          setStrokeColor(shape.stroke || DEFAULT_STROKE);
        }
      } else {
        setSelectedShape(null);
        setFillColor(DEFAULT_FILL);
        setStrokeColor(DEFAULT_STROKE);
        setOpacity(DEFAULT_OPACITY);
      }
    } else {
      setSelectedShape(null);
      setFillColor(DEFAULT_FILL);
      setStrokeColor(DEFAULT_STROKE);
      setOpacity(DEFAULT_OPACITY);
    }
  }, [selectedId, shapes]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const aspectRatio = img.width / img.height;
          const maxWidth = 300;
          const width = Math.min(img.width, maxWidth);
          const height = width / aspectRatio;
          
          addShape({
            id: uuidv4(),
            type: 'image',
            x: window.innerWidth / 2 - width / 2,
            y: window.innerHeight / 2 - height / 2,
            width,
            height,
            src: event.target?.result as string
          });
          setActiveTool('select');
        };
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value);
    setFontSize(newSize);
    if (selectedShape?.type === 'text') {
      updateShape({
        ...selectedShape,
        fontSize: newSize
      });
    }
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newOpacity = parseFloat(e.target.value);
    setOpacity(newOpacity);
    setLastUsedOpacity(newOpacity);
    
    if (selectedShape?.type === 'rectangle' || selectedShape?.type === 'ellipse') {
      const rgbaColor = `rgba(${hexToRgb(fillColor)}, ${newOpacity})`;
      updateShape({
        ...selectedShape,
        fill: rgbaColor,
        opacity: newOpacity
      });
      setLastUsedFill(rgbaColor);
    }
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
      `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
      '56, 134, 246';
  };

  const handleToolClick = (toolId: Tool) => {
    if (toolId === 'text') {
      const textShape = {
        id: uuidv4(),
        type: 'text',
        x: window.innerWidth / 2 - 100,
        y: window.innerHeight / 2 - 15,
        text: 'Click to edit',
        fontSize: fontSize,
        fill: '#000000',
        width: 200,
        height: 30
      };
      addShape(textShape);
      selectShape(textShape.id);
      setActiveTool('select');
    } else if (toolId === 'image' && fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      // Reset to default colors when switching tools
      if (toolId === 'rectangle' || toolId === 'ellipse') {
        setFillColor(DEFAULT_FILL);
        setStrokeColor(DEFAULT_STROKE);
        setOpacity(DEFAULT_OPACITY);
        setLastUsedFill(DEFAULT_FILL);
        setLastUsedStroke(DEFAULT_STROKE);
        setLastUsedOpacity(DEFAULT_OPACITY);
      } else if (toolId === 'line' || toolId === 'freehand') {
        setStrokeColor(DEFAULT_STROKE);
        setLastUsedStroke(DEFAULT_STROKE);
      }
      setActiveTool(toolId);
    }
  };
  
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
      <div className="flex items-center space-x-1">
        {tools.map((tool) => (
          <ToolButton
            key={tool.id}
            title={tool.title}
            isActive={activeTool === tool.id}
            onClick={() => handleToolClick(tool.id)}
          >
            {tool.icon}
          </ToolButton>
        ))}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        {selectedShape?.type === 'text' && (
          <>
            <div className="h-8 w-px bg-gray-200 mx-2" />
            
            <select
              value={fontSize}
              onChange={handleFontSizeChange}
              className="h-8 px-2 border border-gray-200 rounded-md text-sm"
            >
              {[12, 14, 16, 18, 20, 24, 28, 32, 36, 48].map(size => (
                <option key={size} value={size}>{size}px</option>
              ))}
            </select>

            <input
              type="color"
              value={fillColor}
              onChange={(e) => {
                const newColor = e.target.value;
                setFillColor(newColor);
                updateShape({
                  ...selectedShape,
                  fill: newColor
                });
              }}
              className="h-8 w-8 p-0 border border-gray-200 rounded cursor-pointer"
              title="Text Color"
            />
          </>
        )}

        {(selectedShape?.type === 'rectangle' || selectedShape?.type === 'ellipse') && (
          <>
            <div className="h-8 w-px bg-gray-200 mx-2" />
            
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={fillColor}
                onChange={(e) => {
                  const newColor = e.target.value;
                  setFillColor(newColor);
                  const rgbaColor = `rgba(${hexToRgb(newColor)}, ${opacity})`;
                  updateShape({
                    ...selectedShape,
                    fill: rgbaColor,
                    opacity
                  });
                  setLastUsedFill(rgbaColor);
                }}
                className="h-8 w-8 p-0 border border-gray-200 rounded cursor-pointer"
                title="Fill Color"
              />
              
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => {
                  const newColor = e.target.value;
                  setStrokeColor(newColor);
                  updateShape({
                    ...selectedShape,
                    stroke: newColor
                  });
                  setLastUsedStroke(newColor);
                }}
                className="h-8 w-8 p-0 border border-gray-200 rounded cursor-pointer"
                title="Stroke Color"
              />
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={opacity}
                onChange={handleOpacityChange}
                className="w-24"
                title="Fill Opacity"
              />
            </div>
          </>
        )}

        {(selectedShape?.type === 'line' || selectedShape?.type === 'freehand') && (
          <>
            <div className="h-8 w-px bg-gray-200 mx-2" />
            
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => {
                  const newColor = e.target.value;
                  setStrokeColor(newColor);
                  updateShape({
                    ...selectedShape,
                    stroke: newColor
                  });
                  setLastUsedStroke(newColor);
                }}
                className="h-8 w-8 p-0 border border-gray-200 rounded cursor-pointer"
                title="Line Color"
              />
            </div>
          </>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <ToolButton
            title="Undo"
            disabled={!canUndo}
            onClick={undo}
          >
            <RotateCcw size={20} />
          </ToolButton>
          
          <ToolButton
            title="Redo"
            disabled={!canRedo}
            onClick={redo}
          >
            <RotateCw size={20} />
          </ToolButton>
        </div>

        <div className="h-8 w-px bg-gray-200 mx-1" />
        
        <div className="flex items-center space-x-1">
          <ToolButton
            title="Clone"
            disabled={!selectedId}
            onClick={cloneSelectedShape}
          >
            <Copy size={20} />
          </ToolButton>

          <ToolButton
            title="Delete"
            disabled={!selectedId}
            onClick={() => selectedId && deleteShape(selectedId)}
          >
            <Trash2 size={20} />
          </ToolButton>

          <ToolButton
            title="Reset Canvas"
            onClick={reset}
          >
            <RefreshCw size={20} />
          </ToolButton>
        </div>
      </div>
    </div>
  );
};

interface ToolButtonProps {
  title: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  ref?: React.RefObject<HTMLButtonElement>;
}

const ToolButton = React.forwardRef<HTMLButtonElement, ToolButtonProps>(({
  title,
  isActive = false,
  disabled = false,
  onClick,
  children
}, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`w-10 h-10 rounded-md flex items-center justify-center transition-colors ${
        isActive
          ? 'bg-blue-100 text-blue-600'
          : disabled
          ? 'text-gray-300 cursor-not-allowed'
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
});

export default Toolbar;