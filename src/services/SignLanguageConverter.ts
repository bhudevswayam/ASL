interface GestureResult {
  currentGesture: string;
  currentWord: string;
  text: string;
  isWordComplete: boolean;
}

interface TextResult {
  currentWord: string;
  text: string;
}

/**
 * Service for converting sign language gestures to text
 */
export class SignLanguageConverter {
  private currentGesture: string = '';
  private previousGesture: string = '';
  private gestureHistory: string[] = [];
  private currentWord: string = '';
  private text: string = '';
  private lastGestureTime: number = 0;
  private gestureDebounceTime: number = 500; // ms
  private isWordComplete: boolean = false;
  private spaceAdded: boolean = false;
  
  constructor() {
    this.reset();
  }
  
  /**
   * Reset the converter state
   */
  public reset(): void {
    this.currentGesture = '';
    this.previousGesture = '';
    this.gestureHistory = [];
    this.currentWord = '';
    this.text = '';
    this.lastGestureTime = 0;
    this.isWordComplete = false;
    this.spaceAdded = false;
  }
  
  /**
   * Process a new gesture
   */
  public processGesture(gesture: string): GestureResult {
    const currentTime = Date.now();
    
    // Debounce rapid gesture changes
    if (gesture !== this.currentGesture && 
        currentTime - this.lastGestureTime > this.gestureDebounceTime) {
      
      this.previousGesture = this.currentGesture;
      this.currentGesture = gesture;
      this.lastGestureTime = currentTime;
      
      // Add to gesture history
      this.gestureHistory.push(gesture);
      if (this.gestureHistory.length > 10) {
        this.gestureHistory.shift();
      }
      
      // Process the gesture
      this.updateText();
    }
    
    return {
      currentGesture: this.currentGesture,
      currentWord: this.currentWord,
      text: this.text,
      isWordComplete: this.isWordComplete
    };
  }
  
  /**
   * Update the text based on the current gesture
   */
  private updateText(): void {
    // Handle special gestures
    if (this.currentGesture === 'space') {
      if (!this.spaceAdded) {
        this.text += ' ';
        this.currentWord = '';
        this.spaceAdded = true;
        this.isWordComplete = true;
      }
      return;
    }
    
    // Reset space flag when a non-space gesture is detected
    this.spaceAdded = false;
    
    // Handle letter gestures
    if (this.currentGesture && this.currentGesture !== 'none') {
      this.currentWord += this.currentGesture;
      this.isWordComplete = false;
    }
    
    // Update the full text
    this.text = this.text.trim();
    if (this.text.length > 0 && !this.text.endsWith(' ')) {
      this.text += ' ';
    }
    this.text += this.currentWord;
  }
  
  /**
   * Complete the current word
   */
  public completeWord(): string {
    if (this.currentWord) {
      this.text = this.text.trim() + ' ';
      this.currentWord = '';
      this.isWordComplete = true;
    }
    return this.text;
  }
  
  /**
   * Get the current text
   */
  public getText(): string {
    return this.text;
  }
  
  /**
   * Delete the last character or word
   */
  public deleteLastCharacter(): TextResult {
    if (this.currentWord.length > 0) {
      // Delete last character from current word
      this.currentWord = this.currentWord.slice(0, -1);
    } else if (this.text.length > 0) {
      // Delete last character from text
      this.text = this.text.slice(0, -1);
    }
    
    return {
      currentWord: this.currentWord,
      text: this.text
    };
  }
  
  /**
   * Delete the last word
   */
  public deleteLastWord(): TextResult {
    if (this.currentWord.length > 0) {
      // Clear current word
      this.currentWord = '';
    } else {
      // Remove last word from text
      const words = this.text.trim().split(' ');
      if (words.length > 0) {
        words.pop();
        this.text = words.join(' ');
        if (this.text.length > 0) {
          this.text += ' ';
        }
      }
    }
    
    return {
      currentWord: this.currentWord,
      text: this.text
    };
  }
}