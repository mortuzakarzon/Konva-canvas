import React, { useRef, useEffect, useState } from 'react';
import { Ellipse as KonvaEllipse, Transformer, Text as KonvaText, Group } from 'react-konva';
import { EllipseConfig } from '../../types';
import { useDrawing } from '../../context/DrawingContext';

interface EllipseProps {
  shapeProps: EllipseConfig;
  isSelected: boolean;
}

const Ellipse: React.FC<EllipseProps> = ({ shapeProps, isSelected }) => {
  const { selectShape, updateShape, activeTool, setActiveTool } = useDrawing();
  const shapeRef = useRef<any>(null);
  const textRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const [isEditing, setIsEditing] = useState(false);

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

  const handleDblClick = () => {
    setIsEditing(true);
    const stage = shapeRef.current.getStage();
    const stageBox = stage.container().getBoundingClientRect();
    const shapeBox = shapeRef.current.getClientRect();

    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    textarea.value = shapeProps.text || '';
    textarea.style.position = 'absolute';
    textarea.style.top = `${stageBox.top + shapeBox.y + shapeBox.height / 2 - 50}px`;
    textarea.style.left = `${stageBox.left + shapeBox.x + 10}px`;
    textarea.style.width = `${shapeBox.width - 20}px`;
    textarea.style.height = '100px';
    textarea.style.fontSize = `${shapeProps.fontSize || 16}px`;
    textarea.style.border = 'none';
    textarea.style.padding = '5px';
    textarea.style.margin = '0px';
    textarea.style.overflow = 'hidden';
    textarea.style.background = 'transparent';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.lineHeight = '1.2';
    textarea.style.fontFamily = 'sans-serif';
    textarea.style.transformOrigin = 'left top';
    textarea.style.textAlign = 'center';
    textarea.style.color = shapeProps.textColor || '#000000';

    textarea.focus();

    // Prevent shape deletion on backspace
    textarea.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace') {
        e.stopPropagation();
      }
    });

    textarea.addEventListener('blur', function () {
      const newText = textarea.value;
      updateShape({
        ...shapeProps,
        text: newText || undefined,
        fontSize: shapeProps.fontSize || 16,
        textColor: shapeProps.textColor || '#000000'
      });
      document.body.removeChild(textarea);
      setIsEditing(false);
    });
  };

  const handleDragEnd = (e: any) => {
    updateShape({
      ...shapeProps,
      x: e.target.x(),
      y: e.target.y()
    });
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    updateShape({
      ...shapeProps,
      x: node.x(),
      y: node.y(),
      radiusX: Math.max(5, node.radiusX() * scaleX),
      radiusY: Math.max(5, node.radiusY() * scaleY),
      fontSize: shapeProps.fontSize ? shapeProps.fontSize * ((scaleX + scaleY) / 2) : 16
    });
  };

  return (
    <Group>
      <KonvaEllipse
        ref={shapeRef}
        x={shapeProps.x}
        y={shapeProps.y}
        radiusX={shapeProps.radiusX}
        radiusY={shapeProps.radiusY}
        fill={shapeProps.fill}
        stroke={shapeProps.stroke}
        strokeWidth={shapeProps.strokeWidth}
        opacity={shapeProps.opacity ?? 1}
        draggable
        onClick={handleSelect}
        onTap={handleSelect}
        onDblClick={handleDblClick}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        onMouseEnter={(e) => {
          const stage = e.target.getStage();
          if (stage) stage.container().style.cursor = 'move';
        }}
        onMouseLeave={(e) => {
          const stage = e.target.getStage();
          if (stage) stage.container().style.cursor = 'default';
        }}
      />
      {shapeProps.text && !isEditing && (
        <KonvaText
          ref={textRef}
          x={shapeProps.x - shapeProps.radiusX}
          y={shapeProps.y - (shapeProps.fontSize || 16) / 2}
          width={shapeProps.radiusX * 2}
          text={shapeProps.text}
          fontSize={shapeProps.fontSize || 16}
          fill={shapeProps.textColor || '#000000'}
          align="center"
          onDblClick={handleDblClick}
          listening={false}
        />
      )}
      {isSelected && !isEditing && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) return oldBox;
            return newBox;
          }}
          rotateEnabled={false}
          keepRatio={false}
          enabledAnchors={[
            'top-left', 'top-center', 'top-right',
            'middle-left', 'middle-right',
            'bottom-left', 'bottom-center', 'bottom-right',
          ]}
        />
      )}
    </Group>
  );
};

export default Ellipse;