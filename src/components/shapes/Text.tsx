import React, { useRef, useEffect, useState } from 'react';
import { Text as KonvaText, Transformer } from 'react-konva';
import { TextConfig } from '../../types';
import { useDrawing } from '../../context/DrawingContext';

interface TextProps {
  shapeProps: TextConfig;
  isSelected: boolean;
}

const Text: React.FC<TextProps> = ({ shapeProps, isSelected }) => {
  const { selectShape, updateShape, activeTool } = useDrawing();
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isSelectingText = useRef(false);

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected, isEditing]);

  const handleSelect = (e: any) => {
    e.cancelBubble = true;
    selectShape(shapeProps.id);
  };

  const handleDblClick = (e: any) => {
    e.cancelBubble = true;
    if (!isEditing && activeTool === 'select') {
      setIsEditing(true);
      const textNode = shapeRef.current;
      const stage = textNode.getStage();
      const textPosition = textNode.absolutePosition();
      const stageBox = stage.container().getBoundingClientRect();
      const scale = stage.scaleX();

      const textarea = document.createElement('textarea');
      textareaRef.current = textarea;
      document.body.appendChild(textarea);

      textarea.value = textNode.text();
      textarea.style.position = 'absolute';
      textarea.style.top = `${stageBox.top + textPosition.y}px`;
      textarea.style.left = `${stageBox.left + textPosition.x}px`;
      textarea.style.width = `${textNode.width() * scale}px`;
      textarea.style.height = `${textNode.height() * scale + 20}px`;
      textarea.style.fontSize = `${textNode.fontSize() * scale}px`;
      textarea.style.border = '2px solid #2970F2';
      textarea.style.borderRadius = '4px';
      textarea.style.padding = '8px';
      textarea.style.margin = '0px';
      textarea.style.background = 'rgba(255,255,255,0.9)';
      textarea.style.outline = 'none';
      textarea.style.resize = 'none';
      textarea.style.lineHeight = `${textNode.lineHeight()}`;
      textarea.style.fontFamily = textNode.fontFamily();
      textarea.style.fontWeight = textNode.fontStyle().includes('bold') ? 'bold' : 'normal';
      textarea.style.textAlign = textNode.align();
      textarea.style.whiteSpace = 'pre';
      textarea.style.wordBreak = 'normal';
      textarea.style.overflow = 'hidden';
      textarea.style.boxShadow = '0 0 5px rgba(0,0,0,0.2)';
      textarea.style.zIndex = '1000';

      if (isSelected) {
        textarea.style.border = '2px solid #2970F2';
        textarea.style.boxShadow = '0 0 5px rgba(41, 112, 242, 0.5)';
      }

      textarea.focus();

      const measureText = (text: string, font: string) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return { width: 0, height: 0 };

        context.font = font;
        const lines = text.split('\n');
        let maxWidth = 0;

        lines.forEach(line => {
          const width = context.measureText(line).width;
          if (width > maxWidth) maxWidth = width;
        });

        return {
          width: maxWidth,
          height: lines.length * parseInt(font) * 1.2,
        };
      };

      const adjustTextareaSize = () => {
        const fontSize = textarea.style.fontSize;
        const fontFamily = textarea.style.fontFamily;
        const font = `${fontSize} ${fontFamily}`;

        const { width: textWidth, height: textHeight } = measureText(textarea.value, font);

        return {
          width: Math.max(50, (textWidth + 32) / scale),
          height: Math.max(30, (textHeight + 20) / scale),
        };
      };

      const handleInput = () => {
        const { width, height } = adjustTextareaSize();
        textarea.style.width = `${width * scale}px`;
        textarea.style.height = `${height * scale}px`;
        updateShape({
          ...shapeProps,
          text: textarea.value,
          width,
          height,
          autoWidth: false,
        });
      };

      textarea.addEventListener('input', handleInput);

      const handleOutsideClick = (e: MouseEvent) => {
        if (e.target !== textarea && !isSelectingText.current) {
          document.body.removeChild(textarea);
          textareaRef.current = null;
          window.removeEventListener('click', handleOutsideClick);
          setIsEditing(false);
          const { width, height } = adjustTextareaSize();
          updateShape({
            ...shapeProps,
            text: textarea.value,
            width,
            height,
            autoWidth: false,
          });
        }
      };

      setTimeout(() => {
        window.addEventListener('click', handleOutsideClick);
      });

      handleInput();
    }
  };

  const handleDragEnd = (e: any) => {
    updateShape({
      ...shapeProps,
      x: e.target.x(),
      y: e.target.y(),
    });
  };

  const handleTransformEnd = (e: any) => {
    const node = shapeRef.current;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    updateShape({
      ...shapeProps,
      x: node.x(),
      y: node.y(),
      width: Math.max(50, node.width() * scaleX),
      height: Math.max(30, node.height() * scaleY),
      autoWidth: false,
    });
  };

  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    const textNode = shapeRef.current;
    if (!stage || !textNode) return;

    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const box = textNode.getClientRect();
    const borderPadding = 8;

    const isNearBorder =
      pointer.x < box.x + borderPadding ||
      pointer.x > box.x + box.width - borderPadding ||
      pointer.y < box.y + borderPadding ||
      pointer.y > box.y + box.height - borderPadding;

    if (isNearBorder && isSelected) {
      stage.container().style.cursor = 'move';
    } else {
      stage.container().style.cursor = 'text';
    }
  };

  return (
    <>
      <KonvaText
        ref={shapeRef}
        {...shapeProps}
        draggable={activeTool === 'select'}
        onClick={handleSelect}
        onTap={handleSelect}
        onDblClick={handleDblClick}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        width={shapeProps.width}
        height={shapeProps.height}
        align={shapeProps.align || 'left'}
        verticalAlign="top"
        fontSize={shapeProps.fontSize || 16}
        fontFamily={shapeProps.fontFamily || 'Inter'}
        fontStyle={shapeProps.fontWeight ? `${shapeProps.fontWeight}` : 'normal'}
        lineHeight={shapeProps.lineHeight || 1.5}
        padding={10}
        fill={isSelected ? '#2970F2' : shapeProps.fill || '#000000'}
        onMouseEnter={handleMouseMove}
        onMouseMove={handleMouseMove}
        onMouseLeave={(e) => {
          const stage = e.target.getStage();
          if (stage) {
            stage.container().style.cursor = 'default';
          }
        }}
        onMouseDown={(e) => {
          const stage = e.target.getStage();
          if (stage) {
            stage.container().style.cursor = 'move';
          }
        }}
        onMouseUp={(e) => {
          const stage = e.target.getStage();
          if (stage) {
            stage.container().style.cursor = 'text';
          }
        }}
      />

      {isSelected && (
        <Transformer
          ref={transformerRef}
          anchorSize={8}
          borderEnabled={false}
          anchorCornerRadius={4}
          anchorStroke="#2970F2"
          anchorFill="#FFFFFF"
          anchorStrokeWidth={2}
          enabledAnchors={[
            'top-left', 'top-center', 'top-right',
            'middle-left', 'middle-right',
            'bottom-left', 'bottom-center', 'bottom-right',
          ]}
          boundBoxFunc={(oldBox, newBox) => {
            newBox.width = Math.max(50, newBox.width);
            newBox.height = Math.max(30, newBox.height);
            return newBox;
          }}
        />
      )}
    </>
  );
};

export default Text;
