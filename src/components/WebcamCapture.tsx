import React, { useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';

interface WebcamCaptureProps {
  onFrame: (videoElement: HTMLVideoElement) => void;
  width?: number;
  height?: number;
  frameRate?: number;
}

const WebcamCapture = React.forwardRef<Webcam, WebcamCaptureProps>(
  ({ onFrame, width = 640, height = 480, frameRate = 30 }, ref) => {
    const webcamRef = useRef<Webcam | null>(null);
    const localRef = ref as React.MutableRefObject<Webcam | null> || webcamRef;

    const capture = useCallback(() => {
      const webcam = localRef.current;
      if (webcam) {
        const video = webcam.video;
        if (video) {
          onFrame(video);
        }
      }
      
      // Request next frame
      requestAnimationFrame(capture);
    }, [localRef, onFrame]);

    useEffect(() => {
      // Start capturing frames when component mounts
      requestAnimationFrame(capture);
    }, [capture]);

    return (
      <Webcam
        ref={localRef}
        audio={false}
        width={width}
        height={height}
        screenshotFormat="image/jpeg"
        videoConstraints={{
          width: width,
          height: height,
          facingMode: "user",
          frameRate: frameRate
        }}
        className="webcam"
      />
    );
  }
);

WebcamCapture.displayName = 'WebcamCapture';

export default WebcamCapture;