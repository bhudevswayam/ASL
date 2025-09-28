import * as tf from '@tensorflow/tfjs';
import * as handpose from '@tensorflow-models/handpose';
import { DatasetManager } from '../services/DatasetManager';
import { recognizeA, recognizeB, recognizeC, recognizeI, recognizeL, recognizeY, recognizeSpace } from '../utilities/fingerGestures';

export interface SignPrediction {
  gesture: string;
  confidence: number;
}

export class SignModel {
  private model: tf.LayersModel | null = null;
  private labels: string[] = [];
  private isLoaded: boolean = false;
  public datasetManager: DatasetManager;
  private handposeModel: handpose.HandPose | null = null;

  constructor() {
    this.datasetManager = new DatasetManager();
    this.initialize();
  }

  /**
   * Initialize the model
   */
  async initialize(): Promise<void> {
    try {
      // For now, we'll use a pre-trained model
      // In a real application, you would load a custom trained model
      await tf.ready();
      console.log('TensorFlow.js is ready');
      
      // Set default labels for basic ASL gestures
      this.labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 
                    'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'SPACE'];
      
      this.isLoaded = true;
    } catch (error) {
      console.error('Failed to initialize model:', error);
    }
  }

  /**
   * Load a custom model from URL
   */
  async loadModel(modelUrl: string): Promise<boolean> {
    try {
      this.model = await tf.loadLayersModel(modelUrl);
      console.log('Custom model loaded successfully');
      return true;
    } catch (error) {
      console.error('Error loading custom model:', error);
      return false;
    }
  }

  /**
   * Load custom labels
   */
  setLabels(labels: string[]): void {
    this.labels = labels;
  }

  /**
   * Get current labels
   */
  getLabels(): string[] {
    return this.labels;
  }

  /**
   * Check if model is loaded
   */
  isModelLoaded(): boolean {
    return this.isLoaded && (this.model !== null);
  }

  /**
   * Create a new model for training
   */
  public async createModel(numClasses: number): Promise<tf.LayersModel> {
    // Create a simple model for hand gesture recognition
    const model = tf.sequential();
    
    // Input shape: 21 landmarks with 3 coordinates (x, y, z)
    model.add(tf.layers.flatten({ inputShape: [21, 3] }));
    
    // Hidden layers
    model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    
    // Output layer
    model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }));
    
    // Compile the model
    model.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
    
    this.model = model;
    return model;
  }

  /**
   * Preprocess landmarks for prediction
   */
  preprocessLandmarks(landmarks: number[][]): tf.Tensor {
    // For model-based prediction, reshape to [1, 21, 3]
    if (this.model) {
      const tensor = tf.tensor(landmarks);
      return tensor.reshape([1, 21, 3]);
    }
    
    // For rule-based prediction, flatten landmarks into a 1D array
    const flattenedLandmarks = landmarks.flat();
    
    // Normalize coordinates
    const normalizedLandmarks = flattenedLandmarks.map(coord => coord / 640);
    
    // Convert to tensor
    return tf.tensor2d([normalizedLandmarks], [1, normalizedLandmarks.length]);
  }

  /**
   * Predict gesture from landmarks
   */
  async predict(landmarks: number[][]): Promise<SignPrediction | null> {
    if (!this.model) {
      // If no custom model is loaded, use rule-based recognition
      return this.ruleBasedRecognition(landmarks);
    }
    
    try {
      // Preprocess landmarks
      const input = this.preprocessLandmarks(landmarks);
      
      // Make prediction
      const prediction = this.model.predict(input) as tf.Tensor;
      
      // Get highest confidence class
      const scores = await prediction.data();
      const maxScore = Math.max(...Array.from(scores));
      const maxScoreIndex = scores.indexOf(maxScore);
      
      // Cleanup tensors
      tf.dispose([input, prediction]);
      
      // Return prediction if confidence is high enough
      if (maxScore > 0.7) {
        return {
          gesture: this.labels[maxScoreIndex],
          confidence: maxScore
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error during prediction:', error);
      return null;
    }
  }

  /**
   * Rule-based recognition when no model is loaded
   */
  private ruleBasedRecognition(landmarks: number[][]): SignPrediction | null {
    // Simple rule-based recognition based on finger positions
    // This is a placeholder for actual model prediction
    
    // Calculate finger states
    const thumbIsOpen = this.isThumbOpen(landmarks);
    const indexIsOpen = this.isFingerOpen(landmarks, 8, 5);
    const middleIsOpen = this.isFingerOpen(landmarks, 12, 9);
    const ringIsOpen = this.isFingerOpen(landmarks, 16, 13);
    const pinkyIsOpen = this.isFingerOpen(landmarks, 20, 17);
    
    // Recognize common ASL gestures
    if (!indexIsOpen && !middleIsOpen && !ringIsOpen && !pinkyIsOpen && thumbIsOpen) {
      return { gesture: 'A', confidence: 0.9 };
    } else if (indexIsOpen && middleIsOpen && ringIsOpen && pinkyIsOpen && !thumbIsOpen) {
      return { gesture: 'B', confidence: 0.9 };
    } else if (thumbIsOpen && indexIsOpen && !middleIsOpen && !ringIsOpen && !pinkyIsOpen) {
      return { gesture: 'L', confidence: 0.9 };
    } else if (thumbIsOpen && !indexIsOpen && !middleIsOpen && !ringIsOpen && pinkyIsOpen) {
      return { gesture: 'Y', confidence: 0.9 };
    } else if (thumbIsOpen && indexIsOpen && middleIsOpen && ringIsOpen && pinkyIsOpen) {
      return { gesture: 'SPACE', confidence: 0.9 };
    }
    
    return null;
  }

  /**
   * Check if thumb is open
   */
  private isThumbOpen(landmarks: number[][]): boolean {
    const thumbTip = landmarks[4];
    const thumbIp = landmarks[3];
    const thumbMp = landmarks[2];
    
    // Calculate the angle between thumb segments
    const angle = this.calculateAngle(thumbTip, thumbIp, thumbMp);
    
    // Thumb is considered open if the angle is greater than 150 degrees
    return angle > 150;
  }

  /**
   * Check if a finger is open
   */
  private isFingerOpen(landmarks: number[][], tipIdx: number, baseIdx: number): boolean {
    const fingerTip = landmarks[tipIdx];
    const fingerBase = landmarks[baseIdx];
    const wrist = landmarks[0];
    
    // Calculate distances
    const tipToWristDistance = this.distance(fingerTip, wrist);
    const baseToWristDistance = this.distance(fingerBase, wrist);
    
    // Finger is considered open if the tip is further from the wrist than the base
    return tipToWristDistance > baseToWristDistance;
  }

  /**
   * Calculate Euclidean distance between two points
   */
  private distance(a: number[], b: number[]): number {
    return Math.sqrt(
      Math.pow(a[0] - b[0], 2) + 
      Math.pow(a[1] - b[1], 2) + 
      Math.pow(a[2] - b[2], 2)
    );
  }

  /**
   * Calculate angle between three points
   */
  private calculateAngle(a: number[], b: number[], c: number[]): number {
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
  }
}