import { GestureRecognizer, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

let gestureRecognizer: any = null;
let runningMode = "IMAGE";

// Model URL from the reference project
const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";

// Initialize the GestureRecognizer with progress tracking
export const createGestureRecognizer = async () => {
  try {
    console.log('Loading MediaPipe vision module...');
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );
    
    console.log('Creating GestureRecognizer with model...');
    gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: MODEL_URL,
        delegate: "CPU"
      },
      runningMode: runningMode,
      numHands: 1
    });
    
    console.log('MediaPipe GestureRecognizer model loaded successfully!');
    return gestureRecognizer;
  } catch (error) {
    console.error('Failed to load MediaPipe GestureRecognizer model:', error);
    throw error;
  }
};

// Recognize gestures from video
export const recognizeGesture = (video: HTMLVideoElement, timestamp: number) => {
  if (!gestureRecognizer) {
    console.error('GestureRecognizer not initialized');
    return null;
  }
  
  // Switch to VIDEO mode if currently in IMAGE mode
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    gestureRecognizer.setOptions({ runningMode: "VIDEO" });
  }
  
  try {
    // Perform gesture recognition
    const results = gestureRecognizer.recognizeForVideo(video, timestamp);
    return results;
  } catch (error) {
    console.error('Error during gesture recognition:', error);
    return null;
  }
};

// Get gesture name and confidence from results
export const getGestureResult = (results: any) => {
  if (!results || !results.gestures || results.gestures.length === 0) {
    return { gesture: null, confidence: 0 };
  }
  
  const gesture = results.gestures[0][0];
  return {
    gesture: gesture.categoryName,
    confidence: parseFloat((gesture.score * 100).toFixed(2))
  };
};

// Export DrawingUtils for use in App.tsx
export { DrawingUtils, GestureRecognizer };