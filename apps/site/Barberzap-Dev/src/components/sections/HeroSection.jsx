import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';

const HeroSection = ({ heroY, openLeadModal }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-primary/10 to-transparent opacity-40" />
      <div className="container mx-auto px-4 relative z-10 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 bg-secondary/80 border border-primary/30 rounded-full px-4 py-2 mb-8 backdrop-blur-sm">
          <Smartphone className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest">Organização do Atendimento no WhatsApp</span>
        </motion.div>
        
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-7xl font-black leading-[1.1] mb-6 italic tracking-tighter uppercase">
          Deixe de ser o <br className="hidden md:block" />"Barbeiro do Zap". <br className="hidden md:block" /> <span className="text-gradient-gold">Profissionalize seu atendimento.</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg md:text-2xl text-muted-foreground max-w-4xl mx-auto mb-10 px-4">
          O Barberzap é a secretária virtual que agenda e confirma horários 24h por dia. Para que você tenha <span className="text-foreground font-black italic">foco total na tesoura</span>, e não no celular.
        </motion.p>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="px-4">
          <Button variant="hero" size="xl" onClick={openLeadModal} className="w-full sm:w-auto uppercase italic tracking-tighter">
            Quero organizar minha barbearia <ArrowRight className="ml-2" />
          </Button>
          <p className="mt-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">⚡ Teste gratuito de 7 dias disponível</p>
        </motion.div>

        <motion.div 
          style={{ y: heroY }}
          initial={{ opacity: 0, y: 60 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.5, duration: 0.8 }} 
          className="mt-20 max-w-5xl mx-auto relative px-4 group"
        >
           <div className="absolute -inset-4 bg-primary/10 rounded-[2.5rem] blur-3xl opacity-50" />
           <div className="relative border border-border rounded-[2.5rem] overflow-hidden shadow-2xl bg-card">
              <img src="/home.png" alt="Sistema Barberzap" className="w-full h-auto scale-[1.03] origin-center" />
           </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
