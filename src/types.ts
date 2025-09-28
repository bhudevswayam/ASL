// Type definitions for MediaPipe tasks-vision
export interface DrawingOptions {
  color: string;
  lineWidth: number;
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface GestureRecognizerResult {
  landmarks?: Landmark[][];
  gestures?: {
    categoryName: string;
    score: number;
  }[][];
}

export interface GestureRecognizerOptions {
  baseOptions: {
    modelAssetPath: string;
    delegate: "GPU" | "CPU";
  };
  runningMode: string;
  numHands: number;
}

// These are just type declarations for the global objects loaded from the CDN
declare global {
  interface Window {
    GestureRecognizer: {
      createFromOptions(vision: any, options: GestureRecognizerOptions): Promise<any>;
      HAND_CONNECTIONS: number[][];
    };
    FilesetResolver: {
      forVisionTasks(wasmFilesPath: string): Promise<any>;
    };
    DrawingUtils: new (ctx: CanvasRenderingContext2D) => {
      drawConnectors(landmarks: Landmark[], connections: number[][], options: DrawingOptions): void;
      drawLandmarks(landmarks: Landmark[], options: DrawingOptions): void;
    };
  }
}