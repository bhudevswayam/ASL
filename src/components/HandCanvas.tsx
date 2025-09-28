import React, { useRef, useEffect } from 'react';
import { drawHand } from '../utilities/drawHand';

interface HandCanvasProps {
  handPredictions: Array<{
    landmarks: number[][];
    gesture?: string;
  }>;
  width: number;
  height: number;
}

const HandCanvas: React.FC<HandCanvasProps> = ({ 
  handPredictions, 
  width, 
  height 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && handPredictions.length > 0) {
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw hand landmarks
        drawHand(handPredictions, ctx);
        
        // Optionally display gesture name
        if (handPredictions[0].gesture) {
          ctx.font = '24px Arial';
          ctx.fillStyle = 'white';
          ctx.fillText(handPredictions[0].gesture, 10, 30);
        }
      }
    }
  }, [handPredictions, width, height]);
  
  return (
    <canvas 
      ref={canvasRef}
      className="hand-canvas"
      width={width}
      height={height}
    />
  );
};

export default HandCanvas;