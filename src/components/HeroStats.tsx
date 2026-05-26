import { useEffect, useRef } from 'react';
import { motion, type Variants } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface StatItem {
  value: number;
  suffix: string;
  prefix?: string;
  label: string;
  decimals?: number;
}

const stats: StatItem[] = [
  { value: 500, suffix: '+', label: 'Vehicles', decimals: 0 },
  { value: 2.4, suffix: 'B', prefix: '$', label: 'Total Sales', decimals: 1 },
  { value: 40, suffix: '+', label: 'Countries', decimals: 0 }
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 20,
      duration: 0.8
    }
  }
};

export default function HeroStats() {
  const containerRef = useRef<HTMLDivElement>(null);
  const numbersRef = useRef<(HTMLSpanElement | null)[]>([]);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      numbersRef.current.forEach((el, index) => {
        if (!el || hasAnimated.current) return;
        const stat = stats[index];
        const obj = { val: 0 };

        gsap.to(obj, {
          val: stat.value,
          duration: 2.5,
          ease: 'power2.out',
          delay: 1.2 + index * 0.15,
          snap: stat.decimals === 0 ? { val: 1 } : undefined,
          onUpdate: () => {
            if (!el) return;
            const formatted = stat.decimals && stat.decimals > 0
              ? obj.val.toFixed(stat.decimals)
              : Math.round(obj.val).toString();
            el.textContent = `${stat.prefix || ''}${formatted}${stat.suffix}`;
          }
        });
      });
      hasAnimated.current = true;
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <motion.div
      ref={containerRef}
      className="grid grid-cols-3 gap-6 md:gap-16 mt-12 md:mt-20 max-w-3xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
    >
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          className="hero-stat-item text-center relative"
          variants={itemVariants}
        >
          <motion.div
            className="text-3xl md:text-5xl font-bold text-[var(--text-primary)] tracking-tight"
            whileHover={{ scale: 1.05, color: 'var(--amber)' }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <span ref={el => { numbersRef.current[i] = el; }}>0{stat.suffix}</span>
          </motion.div>
          <div className="text-label text-[var(--text-secondary)] mt-3 tracking-widest">
            {stat.label}
          </div>
          {i < stats.length - 1 && (
            <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 h-12 w-px bg-[var(--border-subtle)]" />
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}