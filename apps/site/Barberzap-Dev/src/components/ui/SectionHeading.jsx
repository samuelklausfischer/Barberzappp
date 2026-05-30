import React from 'react';
import { motion } from 'framer-motion';

const SectionHeading = ({ badge, title, subtitle }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.6 }}
    className="text-center max-w-3xl mx-auto mb-16 px-4"
  >
    {badge && <span className="inline-block text-primary font-bold mb-4 uppercase tracking-[0.2em] text-[10px] px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20">{badge}</span>}
    <h2 className="text-3xl md:text-5xl font-black mb-6 italic leading-tight uppercase">{title}</h2>
    {subtitle && <p className="text-muted-foreground text-lg leading-relaxed">{subtitle}</p>}
  </motion.div>
);

export default SectionHeading;
