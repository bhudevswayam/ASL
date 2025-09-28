/**
 * Basic Gesture Recognizer
 * A very simple position-based approach to recognize hand gestures
 */

/**
 * Recognize hand gestures using basic position analysis
 * @param landmarks - Array of 3D coordinates for hand landmarks
 * @returns The recognized gesture as a string
 */
export const recognizeBasicGesture = (landmarks: number[][]): string => {
  if (!landmarks || landmarks.length < 21) return "";
  
  // Get key points
  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];
  
  // Calculate relative positions
  const fingerHeights = [
    thumbTip[1] - wrist[1],   // Thumb height relative to wrist
    indexTip[1] - wrist[1],   // Index height
    middleTip[1] - wrist[1],  // Middle height
    ringTip[1] - wrist[1],    // Ring height
    pinkyTip[1] - wrist[1]    // Pinky height
  ];
  
  // Calculate horizontal positions
  const fingerX = [
    thumbTip[0] - wrist[0],   // Thumb x-position relative to wrist
    indexTip[0] - wrist[0],   // Index x-position
    middleTip[0] - wrist[0],  // Middle x-position
    ringTip[0] - wrist[0],    // Ring x-position
    pinkyTip[0] - wrist[0]    // Pinky x-position
  ];
  
  // Log positions for debugging
  console.log("Finger heights:", fingerHeights);
  console.log("Finger X positions:", fingerX);
  
  // Simple pattern matching for ASL letters
  
  // A - Thumb sticking out to side, fingers closed
  if (isThumbOut(fingerX, fingerHeights) && areFingersClosed(fingerHeights)) {
    return "A";
  }
  
  // B - All fingers up and together
  if (areFingersUp(fingerHeights) && areFingersClose(fingerX)) {
    return "B";
  }
  
  // C - Curved hand shape
  if (isCurvedShape(fingerX, fingerHeights)) {
    return "C";
  }
  
  // I - Only pinky up
  if (isPinkyUp(fingerHeights) && !areOtherFingersUp(fingerHeights, 4)) {
    return "I";
  }
  
  // L - Thumb and index form L shape
  if (isThumbOut(fingerX, fingerHeights) && isIndexUp(fingerHeights) && 
      !areOtherFingersUp(fingerHeights, 1)) {
    return "L";
  }
  
  // Y - Thumb and pinky out
  if (isThumbOut(fingerX, fingerHeights) && isPinkyUp(fingerHeights) && 
      !areMiddleFingersUp(fingerHeights)) {
    return "Y";
  }
  
  // Space - Open palm
  if (areFingersUp(fingerHeights)) {
    return " ";
  }
  
  // No recognized gesture
  return "";
};

// Helper functions for basic position analysis

/**
 * Check if thumb is sticking out to the side
 */
const isThumbOut = (fingerX: number[], fingerHeights: number[]): boolean => {
  // Thumb should be significantly to the side compared to other fingers
  return Math.abs(fingerX[0]) > 0.1 && fingerHeights[0] > -0.1;
};

/**
 * Check if all fingers are in closed position
 */
const areFingersClosed = (fingerHeights: number[]): boolean => {
  // Fingers should be close to wrist height (not extended upward)
  return fingerHeights[1] > -0.1 && 
         fingerHeights[2] > -0.1 && 
         fingerHeights[3] > -0.1 && 
         fingerHeights[4] > -0.1;
};

/**
 * Check if all fingers are extended upward
 */
const areFingersUp = (fingerHeights: number[]): boolean => {
  // All fingers should be significantly above wrist
  return fingerHeights[1] < -0.1 && 
         fingerHeights[2] < -0.1 && 
         fingerHeights[3] < -0.1 && 
         fingerHeights[4] < -0.1;
};

/**
 * Check if fingers are close together horizontally
 */
const areFingersClose = (fingerX: number[]): boolean => {
  // Fingers should be close to each other horizontally
  const maxDiff = Math.max(
    Math.abs(fingerX[1] - fingerX[2]),
    Math.abs(fingerX[2] - fingerX[3]),
    Math.abs(fingerX[3] - fingerX[4])
  );
  return maxDiff < 0.1;
};

/**
 * Check if hand forms a C shape
 */
const isCurvedShape = (fingerX: number[], fingerHeights: number[]): boolean => {
  // For C shape, fingers should form a curved pattern
  // Thumb and pinky should be closer in height
  const thumbPinkyHeightDiff = Math.abs(fingerHeights[0] - fingerHeights[4]);
  
  // Fingers should have a gradual change in height
  const isGradualHeight = 
    fingerHeights[1] < fingerHeights[0] &&
    fingerHeights[2] < fingerHeights[1] &&
    fingerHeights[3] < fingerHeights[2] &&
    fingerHeights[4] < fingerHeights[3];
  
  // Horizontal positions should form a curve
  const isCurvedX = 
    fingerX[0] < fingerX[1] &&
    fingerX[1] < fingerX[2] &&
    fingerX[2] > fingerX[3] &&
    fingerX[3] > fingerX[4];
  
  return thumbPinkyHeightDiff < 0.15 && (isGradualHeight || isCurvedX);
};

/**
 * Check if only pinky is up
 */
const isPinkyUp = (fingerHeights: number[]): boolean => {
  // Pinky should be significantly above wrist
  return fingerHeights[4] < -0.1;
};

/**
 * Check if index finger is up
 */
const isIndexUp = (fingerHeights: number[]): boolean => {
  // Index should be significantly above wrist
  return fingerHeights[1] < -0.1;
};

/**
 * Check if other fingers (except the specified one) are not up
 */
const areOtherFingersUp = (fingerHeights: number[], excludeIndex: number): boolean => {
  for (let i = 1; i < fingerHeights.length; i++) {
    if (i !== excludeIndex && fingerHeights[i] < -0.1) {
      return true;
    }
  }
  return false;
};

/**
 * Check if middle fingers (index, middle, ring) are up
 */
const areMiddleFingersUp = (fingerHeights: number[]): boolean => {
  // Check if any of the middle fingers are up
  return fingerHeights[1] < -0.1 || 
         fingerHeights[2] < -0.1 || 
         fingerHeights[3] < -0.1;
};