import React, { useRef, useEffect, useState } from 'react';
import { Line as KonvaLine, Transformer, Circle, Group } from 'react-konva';
import { LineConfig } from '../../types';
import { useDrawing } from '../../context/DrawingContext';

interface LineProps {
  shapeProps: LineConfig;
  isSelected: boolean;
}

const Line: React.FC<LineProps> = ({ shapeProps, isSelected }) => {
  const { selectShape, updateShape, activeTool, setActiveTool } = useDrawing();
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDraggingPoint, setIsDraggingPoint] = useState<number | null>(null);
  
  useEffect(() => {
    if (isSelected && transformerRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);
  
  const handleSelect = () => {
    selectShape(shapeProps.id);
    if (activeTool !== 'select') {
      setActiveTool('select');
    }
  };

  const handlePointDragStart = (pointIndex: number) => {
    setIsDraggingPoint(pointIndex);
  };

  const handlePointDragMove = (e: any, pointIndex: number) => {
    if (!shapeRef.current) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    const scale = stage.scaleX();
    
    const newX = (point.x - stage.x()) / scale;
    const newY = (point.y - stage.y()) / scale;

    const newPoints = [...shapeProps.points];
    
    if (shapeProps.type === 'line') {
      newPoints[pointIndex * 2] = newX;
      newPoints[pointIndex * 2 + 1] = newY;

      if (e.evt.shiftKey && pointIndex === 1) {
        const startX = newPoints[0];
        const startY = newPoints[1];
        const dx = newX - startX;
        const dy = newY - startY;
        const angle = Math.atan2(dy, dx);
        const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
        const distance = Math.sqrt(dx * dx + dy * dy);
        newPoints[2] = startX + distance * Math.cos(snapAngle);
        newPoints[3] = startY + distance * Math.sin(snapAngle);
      }
    } else if (shapeProps.type === 'freehand') {
      // For freehand, we adjust the control point and its neighbors to maintain smoothness
      newPoints[pointIndex * 2] = newX;
      newPoints[pointIndex * 2 + 1] = newY;
      
      // Adjust neighboring points for smoother curves
      if (pointIndex > 0) {
        newPoints[pointIndex * 2 - 2] += (newX - shapeProps.points[pointIndex * 2]) * 0.5;
        newPoints[pointIndex * 2 - 1] += (newY - shapeProps.points[pointIndex * 2 + 1]) * 0.5;
      }
      if (pointIndex < (newPoints.length / 2) - 1) {
        newPoints[pointIndex * 2 + 2] += (newX - shapeProps.points[pointIndex * 2]) * 0.5;
        newPoints[pointIndex * 2 + 3] += (newY - shapeProps.points[pointIndex * 2 + 1]) * 0.5;
      }
    }

    updateShape({
      ...shapeProps,
      points: newPoints
    });
  };

  const handlePointDragEnd = () => {
    setIsDraggingPoint(null);
  };
  
  const handleDragEnd = (e: any) => {
    const node = shapeRef.current;
    const points = node.points();
    const dx = node.x();
    const dy = node.y();
    
    node.x(0);
    node.y(0);
    
    const newPoints = points.map((point: number, i: number) => {
      return i % 2 === 0 ? point + dx : point + dy;
    });
    
    updateShape({
      ...shapeProps,
      points: newPoints
    });
  };

  const points = shapeProps.points;
  const isLineType = shapeProps.type === 'line';
  const isFreehandType = shapeProps.type === 'freehand';

  // Calculate the hitbox for better hover detection
  const hitStrokeWidth = 20; // Wider area for hover detection
  
  return (
    <Group>
      {/* Invisible line for better hover detection */}
      <KonvaLine
        points={points}
        stroke="transparent"
        strokeWidth={hitStrokeWidth}
        onMouseEnter={(e) => {
          const stage = e.target.getStage();
          if (stage) {
            stage.container().style.cursor = activeTool === 'select' ? 'move' : 'pointer';
          }
          setIsHovered(true);
        }}
        onMouseLeave={(e) => {
          const stage = e.target.getStage();
          if (stage) {
            stage.container().style.cursor = 'default';
          }
          setIsHovered(false);
        }}
        onClick={handleSelect}
      />
      {/* Visible line */}
      <KonvaLine
        ref={shapeRef}
        {...shapeProps}
        draggable={activeTool === 'select' && isDraggingPoint === null}
        onClick={handleSelect}
        onTap={handleSelect}
        onDragEnd={handleDragEnd}
        stroke={isHovered || isSelected ? '#3886F6' : shapeProps.stroke}
        strokeWidth={isHovered || isSelected ? shapeProps.strokeWidth * 1.5 : shapeProps.strokeWidth}
        shadowColor={isHovered ? 'rgba(0,0,0,0.3)' : 'transparent'}
        shadowBlur={isHovered ? 4 : 0}
        shadowOffset={{ x: 0, y: 2 }}
        shadowOpacity={0.3}
        tension={isFreehandType ? 0.5 : 0}
      />
      {(isSelected || isHovered) && activeTool === 'select' && (
        <>
          {points.map((_, index) => {
            if (index % 2 === 0) {
              // Only create control points for even indices (x coordinates)
              const x = points[index];
              const y = points[index + 1];
              
              // For line type, only show endpoints
              if (isLineType && index !== 0 && index !== points.length - 2) {
                return null;
              }
              
              // For freehand, show control points at intervals
              if (isFreehandType && index % 4 !== 0 && index !== points.length - 2) {
                return null;
              }

              return (
                <Circle
                  key={index}
                  x={x}
                  y={y}
                  radius={4}
                  fill="#ffffff"
                  stroke="#3886F6"
                  strokeWidth={2}
                  draggable
                  onDragStart={() => handlePointDragStart(index / 2)}
                  onDragMove={(e) => handlePointDragMove(e, index / 2)}
                  onDragEnd={handlePointDragEnd}
                  onMouseEnter={(e) => {
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = 'pointer';
                  }}
                  onMouseLeave={(e) => {
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = 'default';
                  }}
                />
              );
            }
            return null;
          })}
        </>
      )}
    </Group>
  );
};

export default Line;