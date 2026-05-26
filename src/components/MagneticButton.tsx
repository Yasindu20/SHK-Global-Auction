import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  onClick?: () => void;
  as?: 'button' | 'a' | 'div';
  href?: string;
}

export default function MagneticButton({
  children,
  className = '',
  strength = 0.35,
  onClick,
  as: Tag = 'div',
  href
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 300, mass: 0.5 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distX = (e.clientX - centerX) * strength;
    const distY = (e.clientY - centerY) * strength;
    x.set(distX);
    y.set(distY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  const innerProps = {
    onClick,
    className,
    animate: { scale: isHovered ? 1.04 : 1 },
    whileTap: { scale: 0.96 },
    transition: { type: 'spring' as const, stiffness: 400, damping: 25 },
  };

  const renderInner = () => {
    if (Tag === 'a') {
      return <motion.a href={href} {...innerProps}>{children}</motion.a>;
    }
    if (Tag === 'button') {
      return <motion.button type="button" {...innerProps}>{children}</motion.button>;
    }
    return <motion.div {...innerProps}>{children}</motion.div>;
  };

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="inline-block"
    >
      {renderInner()}
    </motion.div>
  );
}