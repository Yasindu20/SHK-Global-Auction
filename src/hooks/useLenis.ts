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
      syncTouch: false,
      touchMultiplier: 1,
    });

    lenisInstance = lenis;

    // THE FIX: store the ticker function in a variable so we can remove the
    // exact same reference later. The original code passed a new arrow
    // function to gsap.ticker.remove(), which is a different object in
    // memory — so the original callback was never removed, and each page
    // mount stacked another ticker on top of the last one.
    const tickerFn = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerFn);

    // Prevents GSAP from skipping frames after a tab loses focus and
    // regains it, which would cause a jarring scroll jump.
    gsap.ticker.lagSmoothing(0);

    // Keep ScrollTrigger in sync with every Lenis scroll tick
    lenis.on('scroll', ScrollTrigger.update);

    return () => {
      // Remove the exact same function reference — now it actually works
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