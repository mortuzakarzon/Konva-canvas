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
      newPoints[pointIndex * 2] = newX;
      newPoints[pointIndex * 2 + 1] = newY;
      
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

  // const handlePointDragEnd = () => {
  //   const stage = shapeRef.current?.getStage();
  //   if (stage) {
  //     stage.draggable(true);
  //   }
  //   setIsDraggingPoint(null);
  // };


  const handlePointDragEnd = () => {
  const stage = shapeRef.current?.getStage();
  if (stage) {
    stage.draggable(false); // Avoid globally enabling stage dragging again
  }
  setIsDraggingPoint(null);
  setActiveTool('select'); // Ensure tool resets properly
};

  const handleDragEnd = (e: any) => {
    if (isDraggingPoint !== null) {
      e.cancelBubble = true;
      return;
    }

    const dx = e.target.x();
    const dy = e.target.y();
    
    const newPoints = shapeProps.points.map((coord, i) =>
      i % 2 === 0 ? coord + dx : coord + dy
    );
    
    updateShape({
      ...shapeProps,
      points: newPoints
    });
    
    e.target.position({ x: 0, y: 0 });
  };

  const points = shapeProps.points;
  const isLineType = shapeProps.type === 'line';
  const isFreehandType = shapeProps.type === 'freehand';
  
  return (
    <Group
      draggable={activeTool === 'select' && isDraggingPoint === null}
      onClick={handleSelect}
      onDragStart={(e) => {
        if (isDraggingPoint !== null) {
          e.cancelBubble = true;
        }
        handleSelect();
      }}
      onDragMove={(e) => {
        if (isDraggingPoint !== null) {
          e.cancelBubble = true;
        }
      }}
      onDragEnd={handleDragEnd}
      onMouseEnter={(e) => {
        if (activeTool === 'select' && isDraggingPoint === null) {
          const stage = e.target.getStage();
          if (stage) stage.container().style.cursor = 'move';
        }
        setIsHovered(true);
      }}
      onMouseLeave={(e) => {
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = 'default';
        setIsHovered(false);
      }}
    >
      <KonvaLine
        points={points}
        stroke="transparent"
        strokeWidth={20}
      />
      <KonvaLine
        ref={shapeRef}
        {...shapeProps}
        onClick={handleSelect}
        onTap={handleSelect}
        stroke={isHovered || isSelected ? "#3886F6" : shapeProps.stroke}
        strokeWidth={isHovered || isSelected ? shapeProps.strokeWidth * 1.5 : shapeProps.strokeWidth}
        tension={isFreehandType ? 0.5 : 0}
      />
      {(isSelected || isHovered) && activeTool === 'select' && (
        <>
          {points.map((_, index) => {
            if (index % 2 === 0) {
              const x = points[index];
              const y = points[index + 1];
              
              if (isLineType && index !== 0 && index !== points.length - 2) {
                return null;
              }
              
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
                  onDragStart={(e) => {
                    e.cancelBubble = true;
                    e.target.getStage().draggable(false);
                    handlePointDragStart(index / 2);
                  }}
                  onDragMove={(e) => handlePointDragMove(e, index / 2)}
                  onDragEnd={(e) => {
                    e.cancelBubble = true;
                    e.target.getStage().draggable(true);
                    handlePointDragEnd();
                  }}
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