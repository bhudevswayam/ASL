import './styles.css';

// This is a simplified TypeScript implementation of the ASL sign language detector
class ASLDetector {
  private gestureRecognizer: any;
  private runningMode: string = "IMAGE";
  private webcamRunning: boolean = false;
  private modelLoading: boolean = false;
  private lastVideoTime: number = -1;
  private results: any;
  
  // DOM elements
  private video: HTMLVideoElement;
  private canvasElement: HTMLCanvasElement;
  private canvasCtx: CanvasRenderingContext2D;
  private gestureOutput: HTMLElement;
  private enableWebcamButton: HTMLButtonElement;
  
  // Constants
  private readonly MODEL_URL: string = "https://rgxalrnmnlbmskupyhcm.supabase.co/storage/v1/object/public/signlanguage/letters.task";
  
  constructor() {
    // Initialize DOM elements
    this.video = document.getElementById("webcam") as HTMLVideoElement;
    this.canvasElement = document.getElementById("output_canvas") as HTMLCanvasElement;
    this.canvasCtx = this.canvasElement.getContext("2d") as CanvasRenderingContext2D;
    this.gestureOutput = document.getElementById("gesture_output") as HTMLElement;
    this.enableWebcamButton = document.getElementById("webcamButton") as HTMLButtonElement;
    
    // Check for getUserMedia support
    if (this.hasGetUserMedia()) {
      this.enableWebcamButton.addEventListener("click", () => this.enableCam());
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
      const stream = this.video.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      this.video.srcObject = null;
    } else {
      this.webcamRunning = true;
      this.enableWebcamButton.textContent = "Disable Camera";
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
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ASLDetector();
});