import React, { useRef, useEffect, useState } from 'react';
import { Text as KonvaText, Transformer } from 'react-konva';
import { TextConfig } from '../../types';
import { useDrawing } from '../../context/DrawingContext';

interface TextProps {
  shapeProps: TextConfig;
  isSelected: boolean;
}

const Text: React.FC<TextProps> = ({ shapeProps, isSelected }) => {
  const { selectShape, updateShape, activeTool, setActiveTool } = useDrawing();
  const shapeRef = useRef<any>(null);
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
  };
  
  const handleDblClick = () => {
    if (!isEditing) {
      setIsEditing(true);
      const textNode = shapeRef.current;
      const stage = textNode.getStage();
      const textPosition = textNode.getAbsolutePosition();
      const stageBox = stage.container().getBoundingClientRect();
      const scale = stage.scaleX();
      
      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      
      textarea.value = textNode.text();
      textarea.style.position = 'absolute';
      textarea.style.top = `${stageBox.top + textPosition.y}px`;
      textarea.style.left = `${stageBox.left + textPosition.x}px`;
      textarea.style.width = `${(shapeProps.width || 200) * scale}px`;
      textarea.style.height = `${(shapeProps.height || 30) * scale}px`;
      textarea.style.fontSize = `${shapeProps.fontSize * scale}px`;
      textarea.style.border = '2px solid #3886F6';
      textarea.style.borderRadius = '4px';
      textarea.style.padding = '8px';
      textarea.style.margin = '0px';
      textarea.style.overflow = 'hidden';
      textarea.style.background = '#ffffff';
      textarea.style.outline = 'none';
      textarea.style.resize = 'both';
      textarea.style.lineHeight = '1.5';
      textarea.style.fontFamily = 'sans-serif';
      textarea.style.transformOrigin = 'left top';
      textarea.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      textarea.style.whiteSpace = 'pre-wrap';
      textarea.style.wordBreak = 'break-word';
      
      textarea.focus();

      const adjustTextareaSize = () => {
        const minWidth = 200;
        const minHeight = 30;
        
        // Auto-adjust height
        textarea.style.height = 'auto';
        const newHeight = Math.max(minHeight, textarea.scrollHeight / scale);
        textarea.style.height = `${newHeight * scale}px`;
        
        // Auto-adjust width based on content
        const tempSpan = document.createElement('span');
        tempSpan.style.visibility = 'hidden';
        tempSpan.style.whiteSpace = 'pre-wrap';
        tempSpan.style.wordBreak = 'break-word';
        tempSpan.style.fontSize = `${shapeProps.fontSize}px`;
        tempSpan.style.fontFamily = 'sans-serif';
        tempSpan.style.padding = '8px';
        tempSpan.innerText = textarea.value;
        document.body.appendChild(tempSpan);
        
        const newWidth = Math.max(minWidth, (tempSpan.offsetWidth + 16) / scale);
        textarea.style.width = `${newWidth * scale}px`;
        
        document.body.removeChild(tempSpan);
        
        return { width: newWidth, height: newHeight };
      };

      const handleInput = () => {
        const { width, height } = adjustTextareaSize();
        updateShape({
          ...shapeProps,
          width,
          height,
          text: textarea.value
        });
      };

      textarea.addEventListener('input', handleInput);
      
      const handleOutsideClick = (e: MouseEvent) => {
        if (e.target !== textarea) {
          const { width, height } = adjustTextareaSize();
          document.body.removeChild(textarea);
          window.removeEventListener('click', handleOutsideClick);
          setIsEditing(false);
          
          updateShape({
            ...shapeProps,
            text: textarea.value,
            width,
            height
          });
        }
      };
      
      setTimeout(() => {
        window.addEventListener('click', handleOutsideClick);
      });
      
      textarea.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          const cursorPosition = textarea.selectionStart;
          const textBeforeCursor = textarea.value.substring(0, cursorPosition);
          const textAfterCursor = textarea.value.substring(cursorPosition);
          textarea.value = textBeforeCursor + '\n' + textAfterCursor;
          textarea.selectionStart = cursorPosition + 1;
          textarea.selectionEnd = cursorPosition + 1;
          handleInput();
        }
      });
      
      adjustTextareaSize();
    }
  };
  
  const handleDragEnd = (e: any) => {
    updateShape({
      ...shapeProps,
      x: e.target.x(),
      y: e.target.y()
    });
  };
  
  const handleTransformEnd = (e: any) => {
    const node = shapeRef.current;
    const scaleX = node.scaleX();
    
    node.scaleX(1);
    node.scaleY(1);
    
    updateShape({
      ...shapeProps,
      x: node.x(),
      y: node.y(),
      width: Math.max(200, node.width() * scaleX),
      fontSize: shapeProps.fontSize
    });
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
        padding={shapeProps.padding || 8}
        fontFamily={shapeProps.fontFamily || 'sans-serif'}
        lineHeight={shapeProps.lineHeight || 1.5}
        onMouseEnter={(e) => {
          if (activeTool === 'select') {
            const stage = e.target.getStage();
            if (stage) stage.container().style.cursor = 'move';
          }
        }}
        onMouseLeave={(e) => {
          const stage = e.target.getStage();
          if (stage) stage.container().style.cursor = 'default';
        }}
      />
      {isSelected && !isEditing && (
        <Transformer
          ref={transformerRef}
          enabledAnchors={['middle-left', 'middle-right']}
          boundBoxFunc={(oldBox, newBox) => {
            newBox.width = Math.max(200, newBox.width);
            return newBox;
          }}
        />
      )}
    </>
  );
};

export default Text;