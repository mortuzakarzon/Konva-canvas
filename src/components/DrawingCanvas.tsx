import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Stage, Layer } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { useDrawing } from '../context/DrawingContext';
import Rectangle from './shapes/Rectangle';
import Ellipse from './shapes/Ellipse';
import Line from './shapes/Line';
import Text from './shapes/Text';
import Image from './shapes/Image';
import { v4 as uuidv4 } from 'uuid';
import { ShapeConfig } from '../types';

const DrawingCanvas: React.FC = () => {
  const {
    shapes,
    selectedId,
    activeTool,
    addShape,
    selectShape,
    updateShape,
    deleteShape,
    setActiveTool,
    lastUsedFill,
    lastUsedStroke,
    lastUsedStrokeWidth,
    lastUsedOpacity
  } = useDrawing();
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [newShape, setNewShape] = useState<Partial<ShapeConfig> | null>(null);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);
  
  const stageRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const zoomingTimeoutRef = useRef<number>();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        deleteShape(selectedId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, deleteShape]);

  const updateZoom = useCallback((newScale: number, pointer: { x: number; y: number }) => {
    const oldScale = scale;
    
    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };
    
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    requestAnimationFrame(() => {
      setScale(newScale);
      setPosition(newPos);
    });
  }, [scale, position]);

  const handleWheel = useCallback((e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    
    if (e.evt.ctrlKey) {
      const stage = stageRef.current;
      const oldScale = scale;
      const pointer = stage.getPointerPosition();
      
      const zoomSpeed = 0.005;
      const newScale = Math.max(0.1, oldScale - e.evt.deltaY * zoomSpeed * oldScale);
      
      if (!isZooming) {
        setIsZooming(true);
      }

      updateZoom(newScale, pointer);

      if (zoomingTimeoutRef.current) {
        clearTimeout(zoomingTimeoutRef.current);
      }
      zoomingTimeoutRef.current = window.setTimeout(() => {
        setIsZooming(false);
      }, 150) as unknown as number;
    }
  }, [scale, isZooming, updateZoom]);

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    const pos = e.target.getStage()?.getPointerPosition() || { x: 0, y: 0 };
    const stagePos = {
      x: (pos.x - position.x) / scale,
      y: (pos.y - position.y) / scale,
    };

    if (clickedOnEmpty) {
      if (activeTool === 'text') {
        const textShape = {
          type: 'text',
          id: uuidv4(),
          x: stagePos.x,
          y: stagePos.y,
          text: 'Click to edit',
          fontSize: 16,
          fill: '#000000',
          width: 200,
          height: 30
        } as ShapeConfig;
        addShape(textShape);
        selectShape(textShape.id);
        return;
      }

      if (activeTool !== 'select' && activeTool !== 'image') {
        setIsDrawing(true);
        setStartPoint(stagePos);
        selectShape(null);
        
        switch (activeTool) {
          case 'rectangle':
            setNewShape({
              type: 'rectangle',
              id: uuidv4(),
              x: stagePos.x,
              y: stagePos.y,
              width: 0,
              height: 0,
              fill: lastUsedFill,
              stroke: lastUsedStroke,
              strokeWidth: lastUsedStrokeWidth,
              opacity: lastUsedOpacity
            });
            break;
            
          case 'ellipse':
            setNewShape({
              type: 'ellipse',
              id: uuidv4(),
              x: stagePos.x,
              y: stagePos.y,
              radiusX: 0,
              radiusY: 0,
              fill: lastUsedFill,
              stroke: lastUsedStroke,
              strokeWidth: lastUsedStrokeWidth,
              opacity: lastUsedOpacity
            });
            break;
            
          case 'line':
            setNewShape({
              type: 'line',
              id: uuidv4(),
              points: [stagePos.x, stagePos.y, stagePos.x, stagePos.y],
              stroke: lastUsedStroke,
              strokeWidth: lastUsedStrokeWidth
            });
            break;
            
          case 'freehand':
            setNewShape({
              type: 'freehand',
              id: uuidv4(),
              points: [stagePos.x, stagePos.y],
              stroke: lastUsedStroke,
              strokeWidth: lastUsedStrokeWidth
            });
            break;
        }
      } else {
        selectShape(null);
      }
    }
  };
  
  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || !newShape || !startPoint) return;
    
    const pos = e.target.getStage()?.getPointerPosition() || { x: 0, y: 0 };
    const stagePos = {
      x: (pos.x - position.x) / scale,
      y: (pos.y - position.y) / scale,
    };
    
    switch (activeTool) {
      case 'rectangle':
        setNewShape({
          ...newShape,
          width: stagePos.x - startPoint.x,
          height: stagePos.y - startPoint.y
        });
        break;
        
      case 'ellipse': {
        const width = stagePos.x - startPoint.x;
        const height = stagePos.y - startPoint.y;
        
        if (e.evt.shiftKey) {
          const size = Math.max(Math.abs(width), Math.abs(height));
          const signX = width >= 0 ? 1 : -1;
          const signY = height >= 0 ? 1 : -1;
          
          setNewShape({
            ...newShape,
            x: startPoint.x + (size * signX) / 2,
            y: startPoint.y + (size * signY) / 2,
            radiusX: Math.abs(size / 2),
            radiusY: Math.abs(size / 2)
          });
        } else {
          setNewShape({
            ...newShape,
            x: startPoint.x + width / 2,
            y: startPoint.y + height / 2,
            radiusX: Math.abs(width / 2),
            radiusY: Math.abs(height / 2)
          });
        }
        break;
      }
        
      case 'line':
        if (e.evt.shiftKey) {
          const dx = stagePos.x - startPoint.x;
          const dy = stagePos.y - startPoint.y;
          const angle = Math.atan2(dy, dx);
          const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
          const distance = Math.sqrt(dx * dx + dy * dy);
          const snapX = startPoint.x + distance * Math.cos(snapAngle);
          const snapY = startPoint.y + distance * Math.sin(snapAngle);
          
          setNewShape({
            ...newShape,
            points: [startPoint.x, startPoint.y, snapX, snapY]
          });
        } else {
          setNewShape({
            ...newShape,
            points: [startPoint.x, startPoint.y, stagePos.x, stagePos.y]
          });
        }
        break;
        
      case 'freehand':
        setNewShape({
          ...newShape,
          points: [...(newShape.points || []), stagePos.x, stagePos.y]
        });
        break;
    }
  };
  
  const handleMouseUp = () => {
    if (isDrawing && newShape && startPoint) {
      setIsDrawing(false);
      setStartPoint(null);
      
      switch (activeTool) {
        case 'rectangle':
          if (Math.abs(newShape.width as number) > 5 && Math.abs(newShape.height as number) > 5) {
            let { x = 0, y = 0, width = 0, height = 0 } = newShape;
            if (width < 0) {
              x += width;
              width = Math.abs(width);
            }
            if (height < 0) {
              y += height;
              height = Math.abs(height);
            }
            const finalShape = { ...newShape, x, y, width, height } as ShapeConfig;
            addShape(finalShape);
            selectShape(finalShape.id);
            setActiveTool('select');
          }
          break;
          
        case 'ellipse':
          if ((newShape.radiusX as number) > 2 && (newShape.radiusY as number) > 2) {
            const finalShape = newShape as ShapeConfig;
            addShape(finalShape);
            selectShape(finalShape.id);
            setActiveTool('select');
          }
          break;
          
        case 'line':
          const points = newShape.points || [];
          if (points.length >= 4) {
            const [x1, y1, x2, y2] = points;
            if (Math.abs(x2 - x1) > 5 || Math.abs(y2 - y1) > 5) {
              const finalShape = newShape as ShapeConfig;
              addShape(finalShape);
              selectShape(finalShape.id);
              setActiveTool('select');
            }
          }
          break;
          
        case 'freehand':
          const finalShape = newShape as ShapeConfig;
          addShape(finalShape);
          selectShape(finalShape.id);
          setActiveTool('select');
          break;
      }
      
      setNewShape(null);
    }
  };
  
  const getCursor = () => {
    switch (activeTool) {
      case 'select': return 'default';
      case 'text': return 'text';
      case 'image': return 'pointer';
      default: return 'crosshair';
    }
  };
  
  return (
    <div 
      className="w-full h-full bg-white overflow-hidden" 
      style={{ cursor: activeTool === 'text' ? 'text' : getCursor() }}
    >
      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        ref={stageRef}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
      >
        <Layer ref={layerRef}>
          {shapes.map((shape) => {
            const props = {
              key: shape.id,
              shapeProps: shape,
              isSelected: shape.id === selectedId
            };
            
            switch (shape.type) {
              case 'rectangle':
                return <Rectangle {...props} />;
              case 'ellipse':
                return <Ellipse {...props} />;
              case 'line':
              case 'freehand':
                return <Line {...props} />;
              case 'text':
                return <Text {...props} />;
              case 'image':
                return <Image {...props} />;
              default:
                return null;
            }
          })}
          
          {isDrawing && newShape && (
            <>
              {activeTool === 'rectangle' && (
                <Rectangle
                  shapeProps={newShape as any}
                  isSelected={false}
                />
              )}
              {activeTool === 'ellipse' && (
                <Ellipse
                  shapeProps={newShape as any}
                  isSelected={false}
                />
              )}
              {(activeTool === 'line' || activeTool === 'freehand') && (
                <Line
                  shapeProps={newShape as any}
                  isSelected={false}
                />
              )}
            </>
          )}
        </Layer>
      </Stage>
    </div>
  );
};

export default DrawingCanvas;