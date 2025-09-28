import React, { useState } from 'react';
import { DatasetManager } from '../services/DatasetManager';

interface Sample {
  landmarks: number[][];
  label: string;
}

interface DatasetCollectorProps {
  onSampleCollected: (sample: Sample) => void;
  datasetManager: DatasetManager;
}

const DatasetCollector: React.FC<DatasetCollectorProps> = ({ 
  onSampleCollected,
  datasetManager
}) => {
  const [currentLabel, setCurrentLabel] = useState<string>('');
  const [sampleCount, setSampleCount] = useState<number>(0);
  const [isCollecting, setIsCollecting] = useState<boolean>(false);
  const [collectionInterval, setCollectionInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Common ASL letters
  const commonLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 
                        'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'SPACE'];
  
  // Start collecting samples for a label
  const startCollection = (label: string) => {
    setCurrentLabel(label);
    setIsCollecting(true);
    setSampleCount(0);
    
    // Clear any existing interval
    if (collectionInterval) {
      clearInterval(collectionInterval);
    }
    
    // Set up collection interval
    const interval = setInterval(() => {
      // This will be called by the parent component
      // which will provide the hand landmarks
      setSampleCount(prev => prev + 1);
      
      // Stop after collecting 30 samples
      if (sampleCount >= 30) {
        stopCollection();
      }
    }, 500); // Collect a sample every 500ms
    
    setCollectionInterval(interval);
  };
  
  // Stop collecting samples
  const stopCollection = () => {
    setIsCollecting(false);
    if (collectionInterval) {
      clearInterval(collectionInterval);
      setCollectionInterval(null);
    }
  };
  
  // Save the current dataset
  const saveDataset = () => {
    const dataUri = datasetManager.saveDataset();
    
    // Create a download link
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = 'sign_language_dataset.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Load a dataset from file
  const loadDataset = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        try {
          datasetManager.loadDataset(content);
          alert(`Dataset loaded with ${datasetManager.getTotalSampleCount()} samples`);
        } catch (error) {
          alert('Failed to load dataset');
        }
      }
    };
    reader.readAsText(file);
  };
  
  return (
    <div className="dataset-collector">
      <h3>Dataset Collection</h3>
      
      <div className="dataset-stats">
        <p>Total samples: {datasetManager.getTotalSampleCount()}</p>
        <p>Labels: {datasetManager.getLabels().join(', ')}</p>
      </div>
      
      {isCollecting && (
        <div className="collection-status">
          <h4>Collecting samples for: {currentLabel}</h4>
          <p>Samples collected: {sampleCount}/30</p>
          <button onClick={stopCollection}>Stop Collection</button>
        </div>
      )}
      
      <div className="label-buttons">
        <h4>Select a label to collect:</h4>
        <div className="label-grid">
          {commonLabels.map(label => (
            <button 
              key={label}
              onClick={() => startCollection(label)}
              disabled={isCollecting}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="dataset-actions">
        <button onClick={saveDataset}>Save Dataset</button>
        <label className="file-input-label">
          Load Dataset
          <input 
            type="file" 
            accept=".json" 
            onChange={loadDataset}
            style={{ display: 'none' }}
          />
        </label>
        <button onClick={() => datasetManager.clearDataset()}>Clear Dataset</button>
      </div>
    </div>
  );
};

export default DatasetCollector;