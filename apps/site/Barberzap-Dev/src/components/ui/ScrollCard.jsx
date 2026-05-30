import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const ScrollCard = ({ children, className = "" }) => {
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center", "end start"]
  });

  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 1.05, 0.9]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.5, 0.8, 1], [0.5, 0.8, 1, 0.8, 0.5]);
  const glow = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [
      "0px 0px 0px rgba(234,179,8,0)",
      "0px 0px 40px rgba(234,179,8,0.25)",
      "0px 0px 0px rgba(234,179,8,0)"
    ]
  );

  return (
    <motion.div
      ref={ref}
      style={{ scale, opacity, boxShadow: glow }}
      className={`transition-shadow duration-500 $\{className}`}
    >
      {children}
    </motion.div>
  );
};

export default ScrollCard;
