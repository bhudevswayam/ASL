/**
 * Recognize finger gestures from hand landmarks
 * @param landmarks - Array of 3D coordinates for hand landmarks
 * @returns The recognized gesture as a string
 */
export const fingerGestures = (landmarks: number[][]): string => {
  if (!landmarks || landmarks.length < 21) return "";
  
  // Calculate hand size for normalization
  const handSize = calculateHandSize(landmarks);
  
  // Calculate finger positions with improved thresholds
  const thumbIsOpen = isThumbOpen(landmarks);
  const indexIsOpen = isFingerOpen(landmarks, 8, 5, 0.3);
  const middleIsOpen = isFingerOpen(landmarks, 12, 9, 0.3);
  const ringIsOpen = isFingerOpen(landmarks, 16, 13, 0.3);
  const pinkyIsOpen = isFingerOpen(landmarks, 20, 17, 0.3);

  console.log("Finger states:", {
    thumb: thumbIsOpen,
    index: indexIsOpen,
    middle: middleIsOpen,
    ring: ringIsOpen,
    pinky: pinkyIsOpen
  });

  // Recognize common ASL gestures with improved tolerance
  
  // A - Fist with thumb on the side
  if (!indexIsOpen && !middleIsOpen && !ringIsOpen && !pinkyIsOpen && thumbIsOpen) {
    return "A";
  }
  
  // B - All fingers up and together
  if (indexIsOpen && middleIsOpen && ringIsOpen && pinkyIsOpen && !thumbIsOpen) {
    return "B";
  }
  
  // C - Curved hand
  if (calculateCShape(landmarks)) {
    return "C";
  }
  
  // I - Pinky up, others closed
  if (!indexIsOpen && !middleIsOpen && !ringIsOpen && pinkyIsOpen && !thumbIsOpen) {
    // Additional check to distinguish I from Y
    const pinkyTip = landmarks[20];
    const pinkyBase = landmarks[17];
    const wrist = landmarks[0];
    
    // Calculate angle between pinky and hand
    const pinkyAngle = calculateAngle(pinkyTip, pinkyBase, wrist);
    
    // For I, pinky should be more vertical (smaller angle with vertical axis)
    if (pinkyAngle < 30) {
      return "I";
    }
  }
  
  // L - L shape with thumb and index finger
  if (thumbIsOpen && indexIsOpen && !middleIsOpen && !ringIsOpen && !pinkyIsOpen) {
    return "L";
  }
  
  // Y - Thumb and pinky up
  if ((thumbIsOpen || isThumbPartiallyOpen(landmarks)) && !indexIsOpen && !middleIsOpen && !ringIsOpen && pinkyIsOpen) {
    // Additional check for Y
    const pinkyTip = landmarks[20];
    const pinkyBase = landmarks[17];
    const wrist = landmarks[0];
    
    // Calculate angle between pinky and hand
    const pinkyAngle = calculateAngle(pinkyTip, pinkyBase, wrist);
    
    // For Y, pinky should be more angled outward (larger angle with vertical axis)
    if (pinkyAngle >= 30) {
      return "Y";
    }
  }
  
  // Space - Open palm
  if (thumbIsOpen && indexIsOpen && middleIsOpen && ringIsOpen && pinkyIsOpen) {
    return " ";
  }

  // Default - No recognized gesture
  return "";
};

/**
 * Check if a finger is open based on landmarks
 */
export const isFingerOpen = (
  landmarks: number[][],
  tipIndex: number,
  baseIndex: number,
  threshold: number = 0.1
): boolean => {
  if (!landmarks || landmarks.length < 21) return false;
  
  const wristPoint = landmarks[0];
  const basePoint = landmarks[baseIndex];
  const tipPoint = landmarks[tipIndex];
  
  // Calculate distance between wrist and tip
  const wristToTip = calculateDistance(wristPoint, tipPoint);
  
  // Calculate distance between wrist and base
  const wristToBase = calculateDistance(wristPoint, basePoint);
  
  // If tip is further from wrist than base, finger is likely extended
  return wristToTip > wristToBase * 1.2;
};

/**
 * Calculate the size of the hand based on landmarks
 */
export const calculateHandSize = (landmarks: number[][]): number => {
  if (!landmarks || landmarks.length < 21) return 0;
  
  // Use distance between wrist and middle finger MCP as hand size
  const wrist = landmarks[0];
  const middleMCP = landmarks[9];
  
  return Math.sqrt(
    Math.pow(middleMCP[0] - wrist[0], 2) + 
    Math.pow(middleMCP[1] - wrist[1], 2)
  );
};

/**
 * Calculate distance between two landmarks
 * Can be called with either:
 * 1. landmarks array and two indices
 * 2. two direct points
 */
export const calculateDistance = (
  landmarksOrPoint1: number[][] | number[],
  index1OrPoint2: number | number[],
  index2?: number
): number => {
  // Case 1: Called with landmarks array and two indices
  if (Array.isArray(landmarksOrPoint1[0]) && typeof index1OrPoint2 === 'number' && typeof index2 === 'number') {
    const landmarks = landmarksOrPoint1 as number[][];
    if (!landmarks || landmarks.length <= Math.max(index1OrPoint2, index2)) return 0;
    
    const point1 = landmarks[index1OrPoint2];
    const point2 = landmarks[index2];
    
    return Math.sqrt(
      Math.pow(point2[0] - point1[0], 2) + 
      Math.pow(point2[1] - point1[1], 2)
    );
  }
  // Case 2: Called with two direct points
  else {
    const point1 = landmarksOrPoint1 as number[];
    const point2 = index1OrPoint2 as number[];
    
    return Math.sqrt(
      Math.pow(point2[0] - point1[0], 2) + 
      Math.pow(point2[1] - point1[1], 2)
    );
  }
};

/**
 * Calculate Euclidean distance between two points
 */
const distance = (a: number[], b: number[]): number => {
  return Math.sqrt(
    Math.pow(a[0] - b[0], 2) + 
    Math.pow(a[1] - b[1], 2) + 
    Math.pow(a[2] - b[2], 2)
  );
};

/**
 * Calculate angle between three points
 */
const calculateAngle = (a: number[], b: number[], c: number[]): number => {
  const ab = [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cb = [c[0] - b[0], c[1] - b[1], c[2] - b[2]];
  
  // Calculate dot product
  const dot = ab[0] * cb[0] + ab[1] * cb[1] + ab[2] * cb[2];
  
  // Calculate magnitudes
  const magAB = Math.sqrt(ab[0] * ab[0] + ab[1] * ab[1] + ab[2] * ab[2]);
  const magCB = Math.sqrt(cb[0] * cb[0] + cb[1] * cb[1] + cb[2] * cb[2]);
  
  // Calculate angle in degrees
  const angle = Math.acos(dot / (magAB * magCB)) * (180 / Math.PI);
  
  return angle;
};

/**
 * Check if thumb is open based on landmarks
 */
export const isThumbOpen = (landmarks: number[][]): boolean => {
  if (!landmarks || landmarks.length < 21) return false;
  
  // Calculate distance between thumb tip and wrist
  const thumbTip = landmarks[4];
  const wrist = landmarks[0];
  
  const distance = Math.sqrt(
    Math.pow(thumbTip[0] - wrist[0], 2) + 
    Math.pow(thumbTip[1] - wrist[1], 2)
  );
  
  // Calculate threshold based on hand size
  const handSize = calculateHandSize(landmarks);
  const threshold = handSize * 0.3; // Adjust threshold as needed
  
  return distance > threshold;
};

/**
 * Check if thumb is partially open (less strict than isThumbOpen)
 */
export const isThumbPartiallyOpen = (landmarks: number[][]): boolean => {
  if (!landmarks || landmarks.length < 21) return false;
  
  // Calculate distance between thumb tip and wrist
  const thumbTip = landmarks[4];
  const wrist = landmarks[0];
  
  const distance = Math.sqrt(
    Math.pow(thumbTip[0] - wrist[0], 2) + 
    Math.pow(thumbTip[1] - wrist[1], 2)
  );
  
  // Calculate threshold based on hand size
  const handSize = calculateHandSize(landmarks);
  const threshold = handSize * 0.2; // Lower threshold than isThumbOpen
  
  return distance > threshold;
};

/**
 * Check if hand forms a C shape
 */
export const calculateCShape = (landmarks: number[][]): boolean => {
  if (!landmarks || landmarks.length < 21) return false;
  
  // For C shape, we check if thumb and fingers form a curved shape
  // This is a simplified implementation
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];
  
  // Calculate distances between adjacent fingertips
  const thumbToIndex = calculateDistance(landmarks, 4, 8);
  const indexToMiddle = calculateDistance(landmarks, 8, 12);
  const middleToRing = calculateDistance(landmarks, 12, 16);
  const ringToPinky = calculateDistance(landmarks, 16, 20);
  
  // Calculate hand size for normalization
  const handSize = calculateHandSize(landmarks);
  
  // Check if fingers are curved and positioned in a C shape
  // This is a simplified check that can be improved
  const isFingersCurved = 
    thumbToIndex < handSize * 0.4 &&
    indexToMiddle < handSize * 0.3 &&
    middleToRing < handSize * 0.3 &&
    ringToPinky < handSize * 0.3;
  
  // Check if thumb and pinky are at appropriate distance for C shape
  const thumbToPinky = calculateDistance(landmarks, 4, 20);
  const isCShape = thumbToPinky < handSize * 0.7 && thumbToPinky > handSize * 0.3;
  
  return isFingersCurved && isCShape;
};

/**
 * Recognize A gesture
 */
export const recognizeA = (landmarks: number[][]): boolean => {
  if (!landmarks || landmarks.length < 21) return false;
  
  const thumbIsOpen = isThumbOpen(landmarks);
  const indexIsOpen = isFingerOpen(landmarks, 8, 5);
  const middleIsOpen = isFingerOpen(landmarks, 12, 9);
  const ringIsOpen = isFingerOpen(landmarks, 16, 13);
  const pinkyIsOpen = isFingerOpen(landmarks, 20, 17);
  
  return thumbIsOpen && !indexIsOpen && !middleIsOpen && !ringIsOpen && !pinkyIsOpen;
};

/**
 * Recognize B gesture
 */
export const recognizeB = (landmarks: number[][]): boolean => {
  if (!landmarks || landmarks.length < 21) return false;
  
  const thumbIsOpen = isThumbOpen(landmarks);
  const indexIsOpen = isFingerOpen(landmarks, 8, 5);
  const middleIsOpen = isFingerOpen(landmarks, 12, 9);
  const ringIsOpen = isFingerOpen(landmarks, 16, 13);
  const pinkyIsOpen = isFingerOpen(landmarks, 20, 17);
  
  return !thumbIsOpen && indexIsOpen && middleIsOpen && ringIsOpen && pinkyIsOpen;
};

/**
 * Recognize C gesture
 */
export const recognizeC = (landmarks: number[][]): boolean => {
  return calculateCShape(landmarks);
};

/**
 * Recognize I gesture
 */
export const recognizeI = (landmarks: number[][]): boolean => {
  if (!landmarks || landmarks.length < 21) return false;
  
  const thumbIsOpen = isThumbOpen(landmarks);
  const indexIsOpen = isFingerOpen(landmarks, 8, 5);
  const middleIsOpen = isFingerOpen(landmarks, 12, 9);
  const ringIsOpen = isFingerOpen(landmarks, 16, 13);
  const pinkyIsOpen = isFingerOpen(landmarks, 20, 17);
  
  return !thumbIsOpen && !indexIsOpen && !middleIsOpen && !ringIsOpen && pinkyIsOpen;
};

/**
 * Recognize L gesture
 */
export const recognizeL = (landmarks: number[][]): boolean => {
  if (!landmarks || landmarks.length < 21) return false;
  
  const thumbIsOpen = isThumbOpen(landmarks);
  const indexIsOpen = isFingerOpen(landmarks, 8, 5);
  const middleIsOpen = isFingerOpen(landmarks, 12, 9);
  const ringIsOpen = isFingerOpen(landmarks, 16, 13);
  const pinkyIsOpen = isFingerOpen(landmarks, 20, 17);
  
  return thumbIsOpen && indexIsOpen && !middleIsOpen && !ringIsOpen && !pinkyIsOpen;
};

/**
 * Recognize Y gesture
 */
export const recognizeY = (landmarks: number[][]): boolean => {
  if (!landmarks || landmarks.length < 21) return false;
  
  const thumbIsOpen = isThumbOpen(landmarks);
  const indexIsOpen = isFingerOpen(landmarks, 8, 5);
  const middleIsOpen = isFingerOpen(landmarks, 12, 9);
  const ringIsOpen = isFingerOpen(landmarks, 16, 13);
  const pinkyIsOpen = isFingerOpen(landmarks, 20, 17);
  
  return thumbIsOpen && !indexIsOpen && !middleIsOpen && !ringIsOpen && pinkyIsOpen;
};

/**
 * Recognize Space gesture (open palm)
 */
export const recognizeSpace = (landmarks: number[][]): boolean => {
  if (!landmarks || landmarks.length < 21) return false;
  
  const thumbIsOpen = isThumbOpen(landmarks);
  const indexIsOpen = isFingerOpen(landmarks, 8, 5);
  const middleIsOpen = isFingerOpen(landmarks, 12, 9);
  const ringIsOpen = isFingerOpen(landmarks, 16, 13);
  const pinkyIsOpen = isFingerOpen(landmarks, 20, 17);
  
  return thumbIsOpen && indexIsOpen && middleIsOpen && ringIsOpen && pinkyIsOpen;
};