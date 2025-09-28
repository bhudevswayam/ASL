/**
 * Simple Gesture Recognizer
 * A more reliable approach to recognize hand gestures for ASL
 */

/**
 * Recognize hand gestures from landmarks
 * @param landmarks - Array of 3D coordinates for hand landmarks
 * @returns The recognized gesture as a string
 */
export const recognizeGesture = (landmarks: number[][]): string => {
  if (!landmarks || landmarks.length < 21) return "";
  
  // Extract key points
  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];
  
  // Get finger bases (MCP joints)
  const indexBase = landmarks[5];
  const middleBase = landmarks[9];
  const ringBase = landmarks[13];
  const pinkyBase = landmarks[17];
  
  // Calculate hand size for normalization
  const handSize = getHandSize(landmarks);
  
  // Determine finger states using vertical position relative to their bases
  const thumbExtended = isThumbExtended(landmarks, handSize);
  const indexExtended = isFingerExtended(indexTip, indexBase, wrist, handSize);
  const middleExtended = isFingerExtended(middleTip, middleBase, wrist, handSize);
  const ringExtended = isFingerExtended(ringTip, ringBase, wrist, handSize);
  const pinkyExtended = isFingerExtended(pinkyTip, pinkyBase, wrist, handSize);
  
  // Log finger states for debugging
  console.log("Simple Recognizer - Finger states:", {
    thumb: thumbExtended,
    index: indexExtended,
    middle: middleExtended,
    ring: ringExtended,
    pinky: pinkyExtended
  });
  
  // Recognize gestures based on finger states
  
  // A - Thumb out, all fingers closed
  if (thumbExtended && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    return "A";
  }
  
  // B - All fingers extended except thumb
  if (!thumbExtended && indexExtended && middleExtended && ringExtended && pinkyExtended) {
    return "B";
  }
  
  // C - Curved hand shape (check distance between thumb and other fingers)
  if (isCShape(landmarks, handSize)) {
    return "C";
  }
  
  // I - Only pinky extended
  if (!thumbExtended && !indexExtended && !middleExtended && !ringExtended && pinkyExtended) {
    // Check if pinky is vertical (not angled outward like Y)
    if (isPinkyVertical(landmarks)) {
      return "I";
    }
  }
  
  // L - Thumb and index extended, others closed
  if (thumbExtended && indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
    return "L";
  }
  
  // Y - Thumb and pinky extended, others closed
  if (thumbExtended && !indexExtended && !middleExtended && !ringExtended && pinkyExtended) {
    // Check if pinky is angled outward (not vertical like I)
    if (!isPinkyVertical(landmarks)) {
      return "Y";
    }
  }
  
  // Space - All fingers extended
  if (thumbExtended && indexExtended && middleExtended && ringExtended && pinkyExtended) {
    return " ";
  }
  
  // No recognized gesture
  return "";
};

/**
 * Calculate the size of the hand based on landmarks
 */
const getHandSize = (landmarks: number[][]): number => {
  if (!landmarks || landmarks.length < 21) return 0;
  
  // Use distance between wrist and middle finger MCP as hand size
  const wrist = landmarks[0];
  const middleMCP = landmarks[9];
  
  return distance(wrist, middleMCP);
};

/**
 * Calculate Euclidean distance between two points
 */
const distance = (a: number[], b: number[]): number => {
  return Math.sqrt(
    Math.pow(b[0] - a[0], 2) + 
    Math.pow(b[1] - a[1], 2) + 
    (a.length > 2 && b.length > 2 ? Math.pow(b[2] - a[2], 2) : 0)
  );
};

/**
 * Check if thumb is extended
 */
const isThumbExtended = (landmarks: number[][], handSize: number): boolean => {
  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const thumbIp = landmarks[3];
  
  // Check if thumb tip is far enough from wrist
  const thumbWristDist = distance(thumbTip, wrist);
  
  return thumbWristDist > handSize * 0.25;
};

/**
 * Check if a finger is extended
 */
const isFingerExtended = (
  fingerTip: number[], 
  fingerBase: number[], 
  wrist: number[],
  handSize: number
): boolean => {
  // Calculate distances
  const tipToWrist = distance(fingerTip, wrist);
  const baseToWrist = distance(fingerBase, wrist);
  
  // If tip is significantly further from wrist than base, finger is extended
  return tipToWrist > baseToWrist * 1.2;
};

/**
 * Check if hand forms a C shape
 */
const isCShape = (landmarks: number[][], handSize: number): boolean => {
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];
  
  // For C shape, thumb and fingers should form a curved shape
  // Check distances between adjacent fingertips
  const thumbToIndex = distance(thumbTip, indexTip);
  const indexToMiddle = distance(indexTip, middleTip);
  const middleToRing = distance(middleTip, ringTip);
  const ringToPinky = distance(ringTip, pinkyTip);
  
  // Check if thumb and pinky are at appropriate distance for C shape
  const thumbToPinky = distance(thumbTip, pinkyTip);
  
  // Fingers should be curved (close to each other)
  const fingersCurved = 
    thumbToIndex < handSize * 0.4 &&
    indexToMiddle < handSize * 0.3 &&
    middleToRing < handSize * 0.3 &&
    ringToPinky < handSize * 0.3;
  
  // Thumb and pinky should be at medium distance (not too close, not too far)
  const cShape = thumbToPinky < handSize * 0.7 && thumbToPinky > handSize * 0.3;
  
  return fingersCurved && cShape;
};

/**
 * Check if pinky is vertical (for distinguishing I from Y)
 */
const isPinkyVertical = (landmarks: number[][]): boolean => {
  const wrist = landmarks[0];
  const pinkyMcp = landmarks[17]; // Base of pinky
  const pinkyTip = landmarks[20];
  
  // Calculate angle between pinky and vertical axis
  const dx = pinkyTip[0] - pinkyMcp[0];
  const dy = pinkyTip[1] - pinkyMcp[1];
  
  // Calculate angle in degrees (0 is vertical up, 90 is horizontal)
  const angle = Math.abs(Math.atan2(dx, -dy) * (180 / Math.PI));
  
  // For I, pinky should be more vertical (smaller angle with vertical axis)
  return angle < 25; // Less than 25 degrees from vertical
};