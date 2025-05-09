import React, { useRef, useEffect } from 'react';
import { Image as KonvaImage, Transformer } from 'react-konva';
import { ImageConfig } from '../../types';
import { useDrawing } from '../../context/DrawingContext';
import useImage from 'use-image';

interface ImageProps {
  shapeProps: ImageConfig;
  isSelected: boolean;
}

const Image: React.FC<ImageProps> = ({ shapeProps, isSelected }) => {
  const { selectShape, updateShape, activeTool, setActiveTool } = useDrawing();
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const [image] = useImage(shapeProps.src);
  
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
    const scaleY = node.scaleY();
    
    node.scaleX(1);
    node.scaleY(1);
    
    updateShape({
      ...shapeProps,
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY)
    });
  };
  
  return (
    <>
      <KonvaImage
        ref={shapeRef}
        {...shapeProps}
        image={image}
        draggable={true}
        onClick={handleSelect}
        onTap={handleSelect}
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
      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
          rotateEnabled={false}
          keepRatio={false}
          enabledAnchors={[
            'top-left', 'top-center', 'top-right',
            'middle-left', 'middle-right',
            'bottom-left', 'bottom-center', 'bottom-right'
          ]}
        />
      )}
    </>
  );
};

export default Image;