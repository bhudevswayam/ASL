# Sign Language to Text Converter

A real-time sign language to text converter application built with React, TypeScript, and TensorFlow.js.

## Features

- Real-time webcam access and video processing
- Hand tracking and landmark detection using TensorFlow.js and Handpose model
- Sign language gesture recognition for ASL letters
- Text conversion from recognized gestures
- Dataset collection for custom gesture training
- Model training capabilities

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```
git clone <repository-url>
cd SignLanguage
```

2. Install dependencies:
```
npm install
```

3. Start the development server:
```
npm run dev
```

4. Open your browser and navigate to the URL shown in the terminal (typically http://localhost:5173)

## Usage

### Basic Usage

1. Allow webcam access when prompted
2. Position your hand in front of the camera
3. Make ASL letter gestures to see them converted to text
4. Use the space gesture (all fingers spread) to add spaces between words

### Dataset Collection

1. Click on "Collect Data" to open the data collection interface
2. Enter a label for the gesture you want to collect
3. Click "Start Collection" and perform the gesture multiple times
4. Click "Stop Collection" when finished
5. Repeat for other gestures
6. Click "Save Dataset" to save your collected data

### Model Training

1. After collecting data, click on "Train Model"
2. Wait for the training process to complete
3. Once trained, the model will automatically be used for recognition

## Supported Gestures

The application comes with built-in recognition for the following ASL letters:
- A
- B
- C
- I
- L
- Y
- Space (all fingers spread)

## Technologies Used

- React
- TypeScript
- TensorFlow.js
- Handpose model
- Vite

## License

This project is licensed under the MIT License - see the LICENSE file for details.# SignLanguageconverter
