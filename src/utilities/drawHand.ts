/**
 * Draw hand landmarks on canvas
 */
export const drawHand = (
  predictions: any,
  ctx: CanvasRenderingContext2D
): void => {
  if (!predictions || !ctx) return;

  // Check if we have landmarks
  if (predictions.landmarks) {
    // Draw hand landmarks
    for (let i = 0; i < predictions.landmarks.length; i++) {
      const point = predictions.landmarks[i];
      drawPoint(ctx, point[0], point[1], 5, 'rgb(255, 0, 0)');
    }
    
    // Draw connections
    drawConnections(ctx, predictions.landmarks);
  }
};

/**
 * Draw a point on canvas
 */
const drawPoint = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string
): void => {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
};

/**
 * Draw connections between landmarks
 */
const drawConnections = (
  ctx: CanvasRenderingContext2D,
  landmarks: number[][]
): void => {
  // Draw thumb connections
  drawPath(ctx, [0, 1, 2, 3, 4], landmarks, 'rgb(255, 0, 0)');
  
  // Draw index finger connections
  drawPath(ctx, [0, 5, 6, 7, 8], landmarks, 'rgb(0, 255, 0)');
  
  // Draw middle finger connections
  drawPath(ctx, [0, 9, 10, 11, 12], landmarks, 'rgb(0, 0, 255)');
  
  // Draw ring finger connections
  drawPath(ctx, [0, 13, 14, 15, 16], landmarks, 'rgb(255, 255, 0)');
  
  // Draw pinky finger connections
  drawPath(ctx, [0, 17, 18, 19, 20], landmarks, 'rgb(255, 0, 255)');
  
  // Draw palm base
  drawPath(ctx, [0, 5, 9, 13, 17, 0], landmarks, 'rgb(255, 255, 255)');
};

/**
 * Draw a path connecting landmarks
 */
const drawPath = (
  ctx: CanvasRenderingContext2D,
  points: number[],
  landmarks: number[][],
  color: string
): void => {
  ctx.beginPath();
  ctx.moveTo(landmarks[points[0]][0], landmarks[points[0]][1]);
  
  for (let i = 1; i < points.length; i++) {
    const point = landmarks[points[i]];
    ctx.lineTo(point[0], point[1]);
  }
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
};