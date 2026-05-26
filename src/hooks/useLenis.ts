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
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Disable touch smoothing — native momentum on mobile is faster
      syncTouch: false,
      touchMultiplier: 1,
    });

    lenisInstance = lenis;

    // CRITICAL FIX: Drive Lenis via GSAP's ticker instead of its own RAF loop.
    // This prevents the two loop conflict that causes scroll jank and page-stuck.
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    // GSAP ticker lag smoothing — prevents dropped frames on heavy paint
    gsap.ticker.lagSmoothing(0);

    // Sync ScrollTrigger positions with every Lenis scroll tick
    lenis.on('scroll', ScrollTrigger.update);

    return () => {
      // Remove the specific ticker callback
      gsap.ticker.remove((time) => lenis.raf(time * 1000));
      lenis.off('scroll', ScrollTrigger.update);
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);
}

export function getLenis() {
  return lenisInstance;
}