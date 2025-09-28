import * as tf from '@tensorflow/tfjs';

interface Sample {
  landmarks: number[][];
  label: string;
}

interface Dataset {
  [label: string]: {
    samples: number[][][];
    count: number;
  };
}

export class DatasetManager {
  private dataset: Dataset;
  
  constructor() {
    this.dataset = {};
  }
  
  /**
   * Add a sample to the dataset
   */
  public addSample(label: string, landmarks: number[][]): void {
    if (!this.dataset[label]) {
      this.dataset[label] = {
        samples: [],
        count: 0
      };
    }
    
    this.dataset[label].samples.push(landmarks);
    this.dataset[label].count += 1;
  }
  
  /**
   * Get samples for a specific label
   */
  public getSamples(label: string): number[][][] | null {
    if (this.dataset[label]) {
      return this.dataset[label].samples;
    }
    return null;
  }
  
  /**
   * Get all labels in the dataset
   */
  public getLabels(): string[] {
    return Object.keys(this.dataset);
  }
  
  /**
   * Get the number of samples for a specific label
   */
  public getSampleCount(label: string): number {
    if (this.dataset[label]) {
      return this.dataset[label].count;
    }
    return 0;
  }
  
  /**
   * Get the total number of samples in the dataset
   */
  public getTotalSampleCount(): number {
    let total = 0;
    for (const label in this.dataset) {
      total += this.dataset[label].count;
    }
    return total;
  }
  
  /**
   * Clear all samples for a specific label
   */
  public clearLabel(label: string): void {
    if (this.dataset[label]) {
      delete this.dataset[label];
    }
  }
  
  /**
   * Clear all samples in the dataset
   */
  public clearDataset(): void {
    this.dataset = {};
  }
  
  /**
   * Save the dataset to a JSON file
   */
  public saveDataset(): string {
    const datasetJSON = JSON.stringify(this.dataset);
    return datasetJSON;
  }
  
  /**
   * Load a dataset from a JSON string
   */
  public loadDataset(datasetJSON: string): void {
    try {
      this.dataset = JSON.parse(datasetJSON);
    } catch (error) {
      console.error('Error loading dataset:', error);
      throw new Error('Failed to load dataset');
    }
  }
  
  /**
   * Prepare data for training
   */
  public prepareTrainingData(): {
    xs: tf.Tensor,
    ys: tf.Tensor,
    numClasses: number
  } {
    const labels = this.getLabels();
    const numClasses = labels.length;
    
    if (numClasses === 0) {
      throw new Error('No data available for training');
    }
    
    // Collect all samples and their one-hot encoded labels
    const samples: number[][][] = [];
    const labelIndices: number[] = [];
    
    labels.forEach((label, index) => {
      const labelSamples = this.getSamples(label);
      if (labelSamples) {
        samples.push(...labelSamples);
        labelSamples.forEach(() => labelIndices.push(index));
      }
    });
    
    // Convert to tensors
    const xs = tf.tensor(samples);
    
    // Create one-hot encoded labels
    const ys = tf.oneHot(tf.tensor1d(labelIndices, 'int32'), numClasses);
    
    return {
      xs,
      ys,
      numClasses
    };
  }
  
  /**
   * Train a model on the dataset
   */
  public async trainModel(model: tf.LayersModel, epochs: number = 50): Promise<tf.History> {
    const { xs, ys } = this.prepareTrainingData();
    
    // Train the model
    const history = await model.fit(xs, ys, {
      epochs,
      callbacks: {
        onEpochEnd: (epoch: number, logs: any) => {
          console.log(`Epoch ${epoch}: loss = ${logs.loss}, accuracy = ${logs.acc}`);
        }
      }
    });
    
    // Clean up tensors
    xs.dispose();
    ys.dispose();
    
    return history;
  }
  
  /**
   * Save a trained model
   */
  public async saveModel(model: tf.LayersModel, path: string): Promise<void> {
    try {
      await model.save(path);
      console.log('Model saved successfully');
    } catch (error) {
      console.error('Error saving model:', error);
      throw new Error('Failed to save model');
    }
  }
}