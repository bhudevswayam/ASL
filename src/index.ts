import './styles.css';

// This is a simplified TypeScript implementation of the ASL sign language detector
class ASLDetector {
  private gestureRecognizer: any;
  private runningMode: string = "IMAGE";
  private webcamRunning: boolean = false;
  private modelLoading: boolean = false;
  private lastVideoTime: number = -1;
  private results: any;
  
  // Sentence formation properties
  private isRecording: boolean = false;
  private currentSentence: string = '';
  private lastDetectedSign: string = '';
  private signBuffer: string[] = [];
  private signConfidence: number = 0;
  private signStabilityCounter: number = 0;
  private lastSignChangeTime: number = 0;
  private lastAddedSign: string = '';
  private lastAddedTime: number = 0;
  private lastNoDetectionTime: number = 0;
  private readonly SIGN_STABILITY_THRESHOLD: number = 10; // Number of consecutive frames to consider a sign stable (increased)
  private readonly SIGN_CONFIDENCE_THRESHOLD: number = 0.85; // Minimum confidence level to accept a sign (increased)
  private readonly SIGN_PAUSE_THRESHOLD: number = 1500; // Time in ms to consider a pause between signs (increased)
  private readonly LETTER_COOLDOWN_PERIOD: number = 3500; // Time in ms before the same letter can be added again (increased)
  private readonly NO_DETECTION_RESET_TIME: number = 2000; // Time in ms after which to reset detection if no gesture is detected
  
  // DOM elements
  private video: HTMLVideoElement;
  private canvasElement: HTMLCanvasElement;
  private canvasCtx: CanvasRenderingContext2D;
  private gestureOutput: HTMLElement;
  private enableWebcamButton: HTMLButtonElement;
  private recordButton: HTMLButtonElement;
  private sentenceOutput: HTMLElement;
  private clearButton: HTMLButtonElement;
  private backspaceButton: HTMLButtonElement;
  private addSpaceButton: HTMLButtonElement;
  
  // Constants
  private readonly MODEL_URL: string = "https://rgxalrnmnlbmskupyhcm.supabase.co/storage/v1/object/public/signlanguage/letters.task";
  
  constructor() {
    // Initialize DOM elements
    this.video = document.getElementById("webcam") as HTMLVideoElement;
    this.canvasElement = document.getElementById("output_canvas") as HTMLCanvasElement;
    this.canvasCtx = this.canvasElement.getContext("2d") as CanvasRenderingContext2D;
    this.gestureOutput = document.getElementById("gesture_output") as HTMLElement;
    this.enableWebcamButton = document.getElementById("webcamButton") as HTMLButtonElement;
    this.recordButton = document.getElementById("recordButton") as HTMLButtonElement;
    this.sentenceOutput = document.getElementById("sentence_output") as HTMLElement;
    this.clearButton = document.getElementById("clearButton") as HTMLButtonElement;
    this.backspaceButton = document.getElementById("backspaceButton") as HTMLButtonElement;
    this.addSpaceButton = document.getElementById("addSpaceButton") as HTMLButtonElement;
    
    // Check for getUserMedia support
    if (this.hasGetUserMedia()) {
      this.enableWebcamButton.addEventListener("click", () => this.enableCam());
      this.recordButton.addEventListener("click", () => this.toggleRecording());
      this.clearButton.addEventListener("click", () => this.clearSentence());
      this.backspaceButton.addEventListener("click", () => this.backspace());
      this.addSpaceButton.addEventListener("click", () => this.addSpace());
    } else {
      console.warn("getUserMedia() is not supported by your browser");
      this.enableWebcamButton.textContent = "Webcam Not Supported";
      this.enableWebcamButton.disabled = true;
      this.updateLoadingProgress(0, "Webcam not supported by your browser");
    }
    
    // Load MediaPipe script dynamically
    this.loadMediaPipeScript().then(() => {
      this.createGestureRecognizer();
    }).catch(error => {
      console.error('Failed to load MediaPipe script:', error);
      this.updateLoadingProgress(0, "Failed to load MediaPipe. Please refresh the page.");
    });
  }
  
  // Sentence formation methods
  private toggleRecording(): void {
    if (!this.webcamRunning) {
      alert("Please enable the camera first");
      return;
    }
    
    this.isRecording = !this.isRecording;
    
    if (this.isRecording) {
      this.recordButton.textContent = "Stop Recording";
      this.recordButton.classList.add("recording");
      this.clearButton.disabled = false;
      this.backspaceButton.disabled = false;
      this.addSpaceButton.disabled = false;
      // Reset sign detection variables
      this.signStabilityCounter = 0;
      this.lastDetectedSign = "";
      this.lastSignChangeTime = Date.now();
    } else {
      this.recordButton.textContent = "Start Recording";
      this.recordButton.classList.remove("recording");
    }
  }
  
  private clearSentence(): void {
    this.currentSentence = "";
    this.updateSentenceDisplay();
  }
  
  private backspace(): void {
    if (this.currentSentence.length > 0) {
      this.currentSentence = this.currentSentence.slice(0, -1);
      this.updateSentenceDisplay();
    }
  }
  
  private addSpace(): void {
    this.currentSentence += " ";
    this.updateSentenceDisplay();
  }
  
  private updateSentenceDisplay(): void {
    this.sentenceOutput.textContent = this.currentSentence || "Your sentence will appear here...";
  }
  
  private loadMediaPipeScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";
      script.type = "module";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load MediaPipe script'));
      document.head.appendChild(script);
    });
  }
  
  private hasGetUserMedia(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }
  
  private updateLoadingProgress(percent: number, text: string): void {
    const loadingProgress = document.getElementById("loading_progress") as HTMLElement;
    const loadingText = document.getElementById("loading_text") as HTMLElement;
    
    loadingProgress.style.width = `${percent}%`;
    loadingText.textContent = text;
  }
  
  private async createGestureRecognizer(): Promise<void> {
    if (this.modelLoading) return;
    
    try {
      this.modelLoading = true;
      this.updateLoadingProgress(10, "Loading MediaPipe vision module...");
      
      // Add a delay to ensure MediaPipe is fully loaded
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // @ts-ignore - Using window object with dynamically loaded MediaPipe
      const vision = await window.FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );
      
      this.updateLoadingProgress(40, "Creating GestureRecognizer with model...");
      
      // Try with CPU first for better compatibility across browsers
      try {
        // @ts-ignore - Using window object with dynamically loaded MediaPipe
        this.gestureRecognizer = await window.GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: this.MODEL_URL,
            delegate: "CPU"
          },
          runningMode: this.runningMode,
          numHands: 1
        });
        
        this.modelLoading = false;
        this.updateLoadingProgress(100, "Model loaded successfully with CPU!");
        
        // Enable the webcam button
        this.enableWebcamButton.disabled = false;
        
        // Hide loading bar after a delay
        setTimeout(() => {
          const loadingText = document.getElementById("loading_text") as HTMLElement;
          const loadingBar = document.querySelector(".loading-bar") as HTMLElement;
          
          loadingText.style.display = "none";
          loadingBar.style.display = "none";
        }, 2000);
        
        console.log('Model loaded successfully with CPU!');
      } catch (cpuError) {
        console.warn('CPU delegate failed, trying GPU:', cpuError);
        
        // If CPU fails, try with GPU
        try {
          this.updateLoadingProgress(50, "Trying with GPU delegate...");
          
          // @ts-ignore - Using window object with dynamically loaded MediaPipe
          this.gestureRecognizer = await window.GestureRecognizer.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: this.MODEL_URL,
              delegate: "GPU"
            },
            runningMode: this.runningMode,
            numHands: 1
          });
          
          this.modelLoading = false;
          this.updateLoadingProgress(100, "Model loaded successfully with GPU!");
          
          // Enable the webcam button
          this.enableWebcamButton.disabled = false;
          
          // Hide loading bar after a delay
          setTimeout(() => {
            const loadingText = document.getElementById("loading_text") as HTMLElement;
            const loadingBar = document.querySelector(".loading-bar") as HTMLElement;
            
            loadingText.style.display = "none";
            loadingBar.style.display = "none";
          }, 2000);
          
          console.log('Model loaded successfully with GPU!');
        } catch (gpuError) {
          this.modelLoading = false;
          this.updateLoadingProgress(0, "Failed to load model. Please check console for details.");
          console.error('Failed to load model with GPU:', gpuError);
          alert("There was an issue loading the model. Please check that your browser supports WebGL and try refreshing the page.");
        }
      }
    } catch (error) {
      this.modelLoading = false;
      this.updateLoadingProgress(0, "Failed to load MediaPipe. Please refresh and try again.");
      console.error('Failed to load MediaPipe:', error);
      alert("Failed to load MediaPipe. Please make sure you're using a modern browser with JavaScript enabled and try refreshing the page.");
    }
  }
  
  private async enableCam(): Promise<void> {
    if (this.modelLoading) {
      alert("Please wait for the AI model to finish loading...");
      return;
    }
    
    if (!this.gestureRecognizer) {
      alert("AI model is not loaded yet. Please wait and try again.");
      return;
    }

    if (this.webcamRunning) {
      this.webcamRunning = false;
      this.enableWebcamButton.textContent = "Enable Camera";
      this.recordButton.disabled = true;
      this.clearButton.disabled = true;
      this.backspaceButton.disabled = true;
      this.addSpaceButton.disabled = true;
      
      // If recording was active, stop it
      if (this.isRecording) {
        this.toggleRecording();
      }
      
      const stream = this.video.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      this.video.srcObject = null;
    } else {
      this.webcamRunning = true;
      this.enableWebcamButton.textContent = "Disable Camera";
      this.recordButton.disabled = false;
      
      try {
        const constraints = {
          video: {
            width: 640,
            height: 480
          }
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.video.srcObject = stream;
        this.video.addEventListener("loadeddata", () => this.predictWebcam());
        
        // Initialize the sentence display
        this.updateSentenceDisplay();
      } catch (err) {
        console.error("Error accessing webcam:", err);
        alert("Error accessing webcam. Please make sure you have granted camera permissions.");
      }
    }
  }
  
  private async predictWebcam(): Promise<void> {
    // Make sure the canvas is setup with the video's actual dimensions
    this.canvasElement.width = this.video.videoWidth;
    this.canvasElement.height = this.video.videoHeight;
    
    if (this.runningMode === "IMAGE") {
      this.runningMode = "VIDEO";
      await this.gestureRecognizer.setOptions({ runningMode: "VIDEO" });
    }

    let nowInMs = Date.now();
    if (this.video.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = this.video.currentTime;
      try {
        this.results = this.gestureRecognizer.recognizeForVideo(this.video, nowInMs);
        
        // Process the detected gestures for sentence formation
        this.processGestureResults();
      } catch (error) {
        console.error("Error in gesture recognition:", error);
        this.gestureOutput.innerText = "Error in recognition. Please try again.";
        if (this.webcamRunning) {
          window.requestAnimationFrame(() => this.predictWebcam());
        }
        return;
      }
    }

    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    
    // @ts-ignore - Using window object with dynamically loaded MediaPipe
    const drawingUtils = new window.DrawingUtils(this.canvasCtx);

    if (this.results && this.results.landmarks) {
      for (const landmarks of this.results.landmarks) {
        // @ts-ignore - Using window object with dynamically loaded MediaPipe
        drawingUtils.drawConnectors(landmarks, window.GestureRecognizer.HAND_CONNECTIONS, {
          color: "#00FF00",
          lineWidth: 2
        });
        drawingUtils.drawLandmarks(landmarks, {
          color: "#FF0000",
          lineWidth: 1
        });
      }
    }

    this.canvasCtx.restore();

    if (this.results && this.results.gestures && this.results.gestures.length > 0) {
      const categoryName = this.results.gestures[0][0].categoryName;
      const categoryScore = parseFloat((this.results.gestures[0][0].score * 100).toString()).toFixed(2);
      this.gestureOutput.innerText = `${categoryName} (${categoryScore}%)`;
    } else {
      this.gestureOutput.innerText = "No gesture detected";
    }

    if (this.webcamRunning) {
      window.requestAnimationFrame(() => this.predictWebcam());
    }
  }
  
  // Process the detected gestures for sentence formation
  private processGestureResults(): void {
    const currentTime = Date.now();
    
    if (!this.results || !this.results.gestures || this.results.gestures.length === 0) {
      // Track when we last had no detection
      if (this.lastNoDetectionTime === 0) {
        this.lastNoDetectionTime = currentTime;
      }
      
      // Reset detection if no gesture has been detected for a while
      if (this.isRecording && (currentTime - this.lastNoDetectionTime) > this.NO_DETECTION_RESET_TIME) {
        this.signStabilityCounter = 0;
        this.lastDetectedSign = '';
      }
      return;
    }
    
    // Reset the no detection timer since we have a detection now
    this.lastNoDetectionTime = 0;
    
    const gesture = this.results.gestures[0][0];
    const category = gesture.categoryName;
    const score = gesture.score;
    
    // Process for sentence formation if recording is active
    if (this.isRecording && score >= this.SIGN_CONFIDENCE_THRESHOLD) {
      this.processSignForSentence(category, score);
    }
  }
  
  private processSignForSentence(sign: string, confidence: number): void {
    const currentTime = Date.now();
    
    // If this is the same sign as last time, increment the stability counter
    if (sign === this.lastDetectedSign) {
      this.signStabilityCounter++;
      
      // If we've seen the same sign consistently enough, add it to the sentence
      if (this.signStabilityCounter === this.SIGN_STABILITY_THRESHOLD) {
        this.addSignToSentence(sign);
      }
    } else {
      // Different sign detected, reset the counter and update the last detected sign
      this.signStabilityCounter = 1;
      this.lastDetectedSign = sign;
      this.lastSignChangeTime = currentTime;
    }
  }
  
  private addSignToSentence(sign: string): void {
    const currentTime = Date.now();
    
    // Check if this is the same sign as the last added one and if we're still in cooldown period
    if (sign === this.lastAddedSign && (currentTime - this.lastAddedTime) < this.LETTER_COOLDOWN_PERIOD) {
      // Skip adding this sign as we're still in cooldown period
      return;
    }
    
    // Add the sign to the current sentence
    this.currentSentence += sign;
    
    // Update the display
    this.updateSentenceDisplay();
    
    // Store the sign and time for cooldown checking
    this.lastAddedSign = sign;
    this.lastAddedTime = currentTime;
    
    // Reset stability counter to avoid adding the same sign repeatedly
    this.signStabilityCounter = 0;
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ASLDetector();
});