import React from 'react';
import { Wheel } from '@uiw/react-color';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  onClose: () => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, onClose }) => {
  return (
    <div 
      className="fixed z-50 p-4 bg-white rounded-lg shadow-xl border border-gray-200"
      style={{ 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)' 
      }}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Choose Color</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      <Wheel
        color={color}
        onChange={(color) => onChange(color.hex)}
      />
      <div className="mt-4 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Done
        </button>
      </div>
    </div>
  );
}

export default ColorPicker;