import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useMemo } from 'react';

// Ciclo de direções embaralhadas
let directionCycle = [];
let directionIndex = 0;

function getNextDirection() {
  if (directionIndex >= directionCycle.length) {
    directionCycle = shuffle(['left', 'right', 'bottom']);
    directionIndex = 0;
  }
  return directionCycle[directionIndex++];
}

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

export default function FadeInWhenVisible({
  children,
  delay = 0.1,
  duration = .3,
}) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const direction = useMemo(() => getNextDirection(), []);

  const initialPosition = useMemo(() => {
    switch (direction) {
      case 'left':
        return { x: -100, y: 0 };
      case 'right':
        return { x: 100, y: 0 };
      case 'bottom':
        return { x: 0, y: 100 };
      default:
        return { x: 0, y: 20 };
    }
  }, [direction]);

  const randomOpacity = useMemo(() => Math.random() * (0.3 - 0.15) + 0.3, []);
  const randomRotation = useMemo(() => Math.random() * 10 - 5, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: randomOpacity, rotate: randomRotation, ...initialPosition }}
      animate={
        inView
          ? { opacity: 1, x: 0, y: 0, rotate: 0 }
          : { opacity: randomOpacity, rotate: randomRotation, ...initialPosition }
      }
      transition={{ duration, delay }}
      className="grid grid-cols-12 col-span-12"
    >
      {children}
    </motion.div>
  );
}