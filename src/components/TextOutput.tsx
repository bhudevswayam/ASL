import React from 'react';

interface TextOutputProps {
  text: string;
}

const TextOutput: React.FC<TextOutputProps> = ({ text }) => {
  return (
    <div className="text-output">
      <h3>Detected Text:</h3>
      <p>{text || 'No text detected yet'}</p>
    </div>
  );
};

export default TextOutput;