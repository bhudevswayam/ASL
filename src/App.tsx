import React, { useState, useRef, useEffect } from 'react'
import Webcam from 'react-webcam'
import './App.css'

// Import directly from CDN like the reference project
const visionURL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";
let GestureRecognizer: any;
let FilesetResolver: any;
let DrawingUtils: any;

function App() {
  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gestureRecognizerRef = useRef<any>(null)
  
  const [text, setText] = useState<string>('')
  const [isDetecting, setIsDetecting] = useState<boolean>(false)
  const [lastGesture, setLastGesture] = useState<string>('None')
  const [gestureHistory, setGestureHistory] = useState<string[]>([])
  const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false)
  const [lastVideoTime, setLastVideoTime] = useState<number>(-1)
  const requestRef = useRef<number>(0)

  // Model URL from the reference project
  const MODEL_URL = "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task";
  let runningMode = "IMAGE";

  // Load MediaPipe modules dynamically
  useEffect(() => {
    const loadMediaPipeModules = async () => {
      try {
        // Dynamically import the modules
        const vision = await import(`${visionURL}/index.js`);
        GestureRecognizer = vision.GestureRecognizer;
        FilesetResolver = vision.FilesetResolver;
        DrawingUtils = vision.DrawingUtils;
        
        // Now load the model
        loadGestureRecognizerModel();
      } catch (error) {
        console.error('Error loading MediaPipe modules:', error);
      }
    };
    
    loadMediaPipeModules();
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  // Load MediaPipe GestureRecognizer model
  const loadGestureRecognizerModel = async () => {
    try {
      console.log('Loading MediaPipe vision module...');
      const vision = await FilesetResolver.forVisionTasks(
        `${visionURL}/wasm`
      );
      
      console.log('Creating GestureRecognizer with model...');
      const recognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: "GPU" // Use GPU like reference project
        },
        runningMode: runningMode,
        numHands: 1
      });
      
      gestureRecognizerRef.current = recognizer;
      setIsModelLoaded(true);
      console.log('MediaPipe GestureRecognizer model loaded successfully');
    } catch (error) {
      console.error('Error loading MediaPipe GestureRecognizer model:', error);
    }
  }
  
  // Convert gesture history to text
  const convertGesturesToText = (gestures: string[]): string => {
    return gestures.join('');
  }
  
  // Process video frame for gesture recognition
  const predictWebcam = () => {
    if (!webcamRef.current || !webcamRef.current.video || !canvasRef.current || !gestureRecognizerRef.current) {
      requestRef.current = requestAnimationFrame(predictWebcam);
      return;
    }
    
    const video = webcamRef.current.video;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    // Set canvas dimensions to match video
    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;
    
    const canvasCtx = canvasRef.current.getContext('2d');
    if (!canvasCtx) {
      requestRef.current = requestAnimationFrame(predictWebcam);
      return;
    }
    
    // Clear canvas
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, videoWidth, videoHeight);
    
    // Only process if video time has changed
    let nowInMs = Date.now();
    if (video.currentTime !== lastVideoTime) {
      setLastVideoTime(video.currentTime);
      
      // Switch to VIDEO mode if currently in IMAGE mode
      if (runningMode === "IMAGE") {
        runningMode = "VIDEO";
        gestureRecognizerRef.current.setOptions({ runningMode: "VIDEO" });
      }
      
      try {
        // Perform gesture recognition
        const results = gestureRecognizerRef.current.recognizeForVideo(video, nowInMs);
        
        if (results) {
          // Draw landmarks if available
          if (results.landmarks) {
            const drawingUtils = new DrawingUtils(canvasCtx);
            
            for (const landmarks of results.landmarks) {
              drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, {
                color: "#00FF00",
                lineWidth: 5
              });
              drawingUtils.drawLandmarks(landmarks, {
                color: "#FF0000",
                lineWidth: 2
              });
            }
          }
          
          // Process gesture results
          if (results.gestures && results.gestures.length > 0) {
            const gesture = results.gestures[0][0].categoryName;
            const confidence = parseFloat((results.gestures[0][0].score * 100).toFixed(2));
            
            console.log(`Detected gesture: ${gesture}, confidence: ${confidence}%`);
            setLastGesture(`${gesture} (${confidence}%)`);
            
            // Only add to history if it's a new gesture
            if (gestureHistory.length === 0 || gestureHistory[gestureHistory.length - 1] !== gesture) {
              setGestureHistory(prev => [...prev, gesture]);
              
              // Convert gesture history to text
              const newText = convertGesturesToText([...gestureHistory, gesture]);
              setText(newText);
            }
          } else {
            setLastGesture('None');
          }
        }
      } catch (error) {
        console.error('Error during gesture recognition:', error);
      }
    }
    
    canvasCtx.restore();
    
    // Continue the animation loop if detection is active
    if (isDetecting) {
      requestRef.current = requestAnimationFrame(predictWebcam);
    }
  }
  
  // Start hand detection
  const startDetection = () => {
    if (!webcamRef.current || !webcamRef.current.video || !gestureRecognizerRef.current) {
      console.error("Webcam or GestureRecognizer model not ready");
      return;
    }
    
    setIsDetecting(true);
    requestRef.current = requestAnimationFrame(predictWebcam);
  }

  // Stop hand detection
  const stopDetection = () => {
    setIsDetecting(false);
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
  }

  // Clear text output
  const clearText = () => {
    setText('');
    setGestureHistory([]);
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>ASL Sign Language Detector</h1>
        
        <div className="webcam-container">
          <Webcam
            ref={webcamRef}
            mirrored={true}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
          />
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              position: 'absolute',
              top: 0,
              left: 0,
              display: 'block'
            }}
          />
        </div>
        
        <div className="controls">
          <button 
            onClick={isDetecting ? stopDetection : startDetection}
            disabled={!isModelLoaded}
            className={isDetecting ? 'stop' : 'start'}
          >
            {isModelLoaded ? (isDetecting ? 'Stop Detection' : 'Start Detection') : 'Loading Model...'}
          </button>
          
          <button onClick={clearText} className="clear">
            Clear Text
          </button>
        </div>
        
        <div className="output">
          <div className="gesture-display">
            <h3>Last Detected Gesture:</h3>
            <div className="gesture">{lastGesture}</div>
          </div>
          
          <div className="text-display">
            <h3>Text Output:</h3>
            <div className="text">{text || 'None'}</div>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;