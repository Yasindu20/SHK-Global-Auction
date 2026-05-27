import { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let lenisInstance: Lenis | null = null;

export function useLenis() {
  useEffect(() => {
    // Destroy any existing instance first
    if (lenisInstance) {
      lenisInstance.destroy();
      lenisInstance = null;
    }

    const lenis = new Lenis({
      duration: 1.0,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.5,
      infinite: false,
    });

    lenisInstance = lenis;

    const tickerFn = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerFn);
    // Prevents GSAP from skipping frames after a tab loses focus
    gsap.ticker.lagSmoothing(0);

    // Keep ScrollTrigger in sync with every Lenis scroll tick
    lenis.on('scroll', ScrollTrigger.update);

    // Double-RAF: first frame lets Lenis attach to the scroll container,
    // second frame lets the browser finish its first Lenis-driven layout pass,
    // then ScrollTrigger measures correct trigger positions.
    let raf1: number;
    let raf2: number;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        ScrollTrigger.refresh();
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      gsap.ticker.remove(tickerFn);
      lenis.off('scroll', ScrollTrigger.update);
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);
}

export function getLenis() {
  return lenisInstance;
}