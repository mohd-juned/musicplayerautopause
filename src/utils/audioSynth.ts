/**
 * Utility to generate procedural chill audio using Web Audio API
 * Generates playable audio Blob URLs for seamless offline audio playback!
 */

export async function createProceduralTrackUrl(theme: 'lofi' | 'ambient' | 'chill'): Promise<string> {
  const sampleRate = 44100;
  const durationInSeconds = 30; // 30 second looping track
  const numFrames = sampleRate * durationInSeconds;
  
  const offlineCtx = new OfflineAudioContext(2, numFrames, sampleRate);

  // Chord progression (e.g., Cmaj7 - Am7 - Fmaj7 - G7)
  const chords = [
    [261.63, 329.63, 392.00, 493.88], // Cmaj7
    [220.00, 261.63, 329.63, 392.00], // Am7
    [174.61, 220.00, 261.63, 329.63], // Fmaj7
    [196.00, 246.94, 293.66, 349.23]  // G7
  ];

  const chordDuration = 7.5; // Each chord played for 7.5s

  chords.forEach((chord, i) => {
    const startTime = i * chordDuration;
    
    // Soft pad synth
    chord.forEach((freq) => {
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();
      
      osc.type = theme === 'lofi' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      
      // Soft envelope
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.08, startTime + 1.0);
      gain.gain.setValueAtTime(0.08, startTime + chordDuration - 1.0);
      gain.gain.linearRampToValueAtTime(0, startTime + chordDuration);

      osc.connect(gain);
      gain.connect(offlineCtx.destination);
      osc.start(startTime);
      osc.stop(startTime + chordDuration);
    });

    // Gentle rhythmic beat
    for (let b = 0; b < 8; b++) {
      const beatTime = startTime + b * (chordDuration / 8);
      
      // Kick drum sound
      const kickOsc = offlineCtx.createOscillator();
      const kickGain = offlineCtx.createGain();
      kickOsc.frequency.setValueAtTime(120, beatTime);
      kickOsc.frequency.exponentialRampToValueAtTime(30, beatTime + 0.15);
      kickGain.gain.setValueAtTime(0.2, beatTime);
      kickGain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.2);
      
      kickOsc.connect(kickGain);
      kickGain.connect(offlineCtx.destination);
      kickOsc.start(beatTime);
      kickOsc.stop(beatTime + 0.2);
    }
  });

  // Render to audio buffer
  try {
    const renderedBuffer = await offlineCtx.startRendering();
    const wavBlob = audioBufferToWav(renderedBuffer);
    return URL.createObjectURL(wavBlob);
  } catch (e) {
    console.error('Audio synth error:', e);
    return '';
  }
}

// Convert AudioBuffer to WAV format Blob
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  
  let result: Float32Array;
  if (numChannels === 2) {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    result = new Float32Array(left.length + right.length);
    for (let i = 0; i < left.length; i++) {
      result[i * 2] = left[i];
      result[i * 2 + 1] = right[i];
    }
  } else {
    result = buffer.getChannelData(0);
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const bufferLength = 44 + result.length * bytesPerSample;
  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + result.length * bytesPerSample, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * blockAlign, true);
  /* block align */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, result.length * bytesPerSample, true);

  // Write PCM audio data
  let offset = 44;
  for (let i = 0; i < result.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
