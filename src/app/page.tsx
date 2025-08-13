'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

function usePreload(paths: string[]) {
  useEffect(() => {
    paths.forEach((p) => { const i = new window.Image(); i.src = p; });
  }, [paths]);
}
function useTypewriter(opts: {
  text: string;
  speed?: number;
  start: boolean;
}) {
  const { text, speed = 22, start } = opts;
  const [out, setOut] = useState('');
  const [done, setDone] = useState(false);
  const idxRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const lastTextRef = useRef(text);
  const startedRef = useRef(false);

  useEffect(() => {
    const textChanged = text !== lastTextRef.current;
    if (textChanged || !start) {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
      lastTextRef.current = text;
      idxRef.current = 0;
      startedRef.current = false;
      setOut('');
      setDone(false);
    }
  }, [text, start]);

  useEffect(() => {
    if (!start || done) return;

    if (!startedRef.current) {
      startedRef.current = true;
    }

    const tick = () => {
      const i = idxRef.current;
      if (i < text.length) {
        setOut((s) => s + text[i]);
        idxRef.current = i + 1;
        timerRef.current = window.setTimeout(tick, speed);
      } else {
        setDone(true);
      }
    };

    timerRef.current = window.setTimeout(tick, speed);
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, [start, text, speed, done]);

  return { out, done };
}

type Phase = 'idle' | 'loading' | 'typing' | 'ending' | 'showing_tip';

export default function Home() {
  const frames = useMemo(
    () => Array.from({ length: 5 }, (_, i) => `/akali/${i + 1}.png`),
    []
  );
  usePreload(frames);

  const F1 = 0, F2 = 1, F3 = 2, F4 = 3, F5 = 4;

  const [phase, setPhase] = useState<Phase>('idle');
  const [tip, setTip] = useState('');
  const [display, setDisplay] = useState('');
  const [frameIdx, setFrameIdx] = useState(F5);

  useEffect(() => {
    if (phase !== 'loading') return;
    setFrameIdx(F1);
    let dots = 0;
    const id = window.setInterval(() => {
      dots = (dots + 1) % 4;
      setDisplay('.'.repeat(dots));
    }, 350);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'typing') return;
    let cur = F2;
    setFrameIdx(cur);
    const id = window.setInterval(() => {
      cur = cur === F2 ? F3 : F2;
      setFrameIdx(cur);
    }, 120);
    return () => window.clearInterval(id);
  }, [phase]);

 useEffect(() => {
    if (phase !== 'showing_tip') return;
    setFrameIdx(F4);
  }, [phase]);

  const { out, done } = useTypewriter({
    text: tip,
    start: phase === 'typing' && tip.length > 0,
    speed: 22
  });

  useEffect(() => {
    if (phase === 'typing') setDisplay(out);
  }, [out, phase]);

  useEffect(() => {
    if (phase === 'typing' && done) {
      setPhase('ending');
    }
  }, [done, phase]);

  const handleAdvice = useCallback(async () => {
    setPhase('loading');
    setTip('');
    setDisplay('');

    let text = 'Miau… pense com calma.';
    try {
      const res = await fetch('/api/advice', { cache: 'no-store' });
      const data = await res.json();
      text = data?.tip ?? text;
    } catch {
      text = 'Sem internet? Sem pânico: respire e tente de novo.';
    }
    setTip(text);

    window.setTimeout(() => {
      setPhase('typing'); 
    }, 600);
  }, []);

  useEffect(() => {
  if (typeof window !== 'undefined') {
    const alreadyShown = localStorage.getItem('akali_intro_shown');
    if (!alreadyShown) {
      setDisplay('Oi, eu sou Akali!');
      localStorage.setItem('akali_intro_shown', 'true');
      setPhase('idle'); 
      setFrameIdx(F5);  
    }
  }
}, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-between px-4 pb-8 md:pb-16">
      <Image src="/logo.png" alt="akali" width={180} height={180} className='size-28 md:size-48' />

      <div className="relative">
        {(phase !== 'idle' || display) && (
            <div className="absolute -top-20 md:-top-14 left-4 md:left-80 w-56 md:w-[280px]">
    <div className="relative rounded-xl bg-white p-3 text-sm shadow">
      {display}
      <div className="absolute left-4 -bottom-2 w-0 h-0 
                      border-l-[8px] border-l-transparent
                      border-r-[8px] border-r-transparent
                      border-t-[8px] border-t-white"></div>
    </div>
  </div>
        )}

        <Image
          src={frames[frameIdx]}
          alt="Gatinha Akali"
          width={100}
          height={100}
          priority
          quality={100}
          className="select-none size-60 md:size-96"
        />
      </div>

      <button
        onClick={handleAdvice}
        className="mt-4 rounded-md bg-app-blue p-3 text-white font-medium hover:opacity-90 active:scale-[.98] transition cursor-pointer"
      >
        Me dê um conselho
      </button>
    </main>
  );
}
