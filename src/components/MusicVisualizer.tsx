import React, { useEffect, useRef } from 'react';

interface MusicVisualizerProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
}

export const MusicVisualizer: React.FC<MusicVisualizerProps> = ({
  analyserNode,
  isPlaying,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (analyserNode && isPlaying) {
        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserNode.getByteFrequencyData(dataArray);

        const barWidth = (width / bufferLength) * 2;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * height;

          // Gradient bar styling
          const gradient = ctx.createLinearGradient(0, height, 0, 0);
          gradient.addColorStop(0, '#10b981'); // Emerald
          gradient.addColorStop(0.6, '#06b6d4'); // Cyan
          gradient.addColorStop(1, '#3b82f6'); // Blue

          ctx.fillStyle = gradient;
          ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);

          x += barWidth;
        }
      } else {
        // Subtle ambient resting wave
        const numBars = 32;
        const barWidth = width / numBars;
        for (let i = 0; i < numBars; i++) {
          const barHeight = 4 + Math.sin(Date.now() / 400 + i) * 3;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.fillRect(i * barWidth, height - barHeight, barWidth - 2, barHeight);
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [analyserNode, isPlaying]);

  return (
    <div className="w-full h-12 bg-black/40 rounded-xl overflow-hidden border border-white/5 relative flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={300}
        height={48}
        className="w-full h-full object-cover"
      />
    </div>
  );
};
