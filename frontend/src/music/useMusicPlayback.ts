import { useEffect, useRef, useState } from 'react';
import { MusicAudio } from './audio';
import type { Score, Tone } from './model';

export function useMusicPlayback(id: string, tempo: number, tone: Tone) {
  const [playing, setPlaying] = useState('');
  const [step, setStep] = useState(-1);
  const [level, setLevel] = useState(0);
  const [sampleLoading, setSampleLoading] = useState('');
  const [volume, setVolume] = useState(0.65);
  const [metro, setMetro] = useState(id === 'brahms-meter');
  const [error, setError] = useState('');
  const engine = useRef<MusicAudio | null>(null);
  const request = useRef(0);

  function stop() {
    request.current++;
    engine.current?.stop();
    setPlaying('');
    setStep(-1);
    setLevel(0);
    setSampleLoading('');
  }

  useEffect(() => {
    const audio = new MusicAudio();
    engine.current = audio;
    const handleVisibility = () => {
      if (document.hidden) stop();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      request.current++;
      document.removeEventListener('visibilitychange', handleVisibility);
      audio.dispose();
    };
  }, []);

  async function play(score: Score, label: string, onDone?: () => void, preview = false) {
    const currentRequest = ++request.current;
    setError('');
    setPlaying(label);
    setStep(-1);
    setLevel(0);
    let lastUpdate = 0;
    try {
      await engine.current!.play(
        score,
        tempo,
        tone,
        volume,
        preview ? false : metro,
        (nextStep, nextLevel) => {
          if (currentRequest !== request.current) return;
          if (performance.now() - lastUpdate > 60 || nextStep === -1) {
            lastUpdate = performance.now();
            setStep(nextStep);
            setLevel(nextLevel);
          }
        },
        () => {
          if (currentRequest !== request.current) return;
          setPlaying('');
          setStep(-1);
          setLevel(0);
          onDone?.();
        },
        id === 'brahms-meter' ? 3 : 4,
        (loaded, total) => {
          if (currentRequest === request.current) {
            setSampleLoading(loaded < total ? `Загружаем фортепиано ${loaded}/${total}` : '');
          }
        },
      );
    } catch {
      if (currentRequest !== request.current) return;
      stop();
      setError(
        'Не удалось загрузить фортепиано. Проверьте соединение и нажмите «Слушать» ещё раз.',
      );
    }
  }

  function changeVolume(value: number) {
    setVolume(value);
    engine.current?.volume(value);
  }

  return {
    playing,
    step,
    level,
    sampleLoading,
    volume,
    setVolume: changeVolume,
    metro,
    setMetro,
    error,
    stop,
    play,
  };
}
