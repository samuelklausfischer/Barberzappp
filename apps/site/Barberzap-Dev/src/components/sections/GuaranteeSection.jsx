import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap } from 'lucide-react';

const GuaranteeSection = () => {
    return (
        <section className="py-20 bg-background relative overflow-hidden">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto relative group"
                >
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 rounded-[3rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
                    <div className="relative bg-card border border-primary/30 rounded-[3rem] p-8 md:p-16 overflow-hidden shadow-2xl">
                        <div className="absolute -top-10 -right-10 md:top-12 md:right-12 opacity-10 md:opacity-20 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
                            <ShieldCheck size={200} className="text-primary" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
                            <div className="md:col-span-8 text-left">
                                <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
                                    <Zap className="w-4 h-4 text-primary" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">Acesso Instantâneo</span>
                                </div>
                                <h3 className="text-2xl md:text-4xl font-black italic uppercase mb-6 leading-tight">
                                    Use o Barberzap <span className="text-primary">GRÁTIS por 7 dias</span> e profissionalize sua agenda hoje
                                </h3>
                                <div className="space-y-4 text-muted-foreground text-sm md:text-base leading-relaxed font-medium">
                                    <p>Não queremos o seu dinheiro se o sistema não mudar sua vida. Você terá <span className="text-white font-bold italic">acesso total</span> a todas as funcionalidades durante 7 dias.</p>
                                    <p>Configure sua IA, conecte seu WhatsApp e veja os agendamentos caindo sozinhos. Se não gostar, basta não continuar. <span className="text-white">Sem contratos, sem burocracia e sem perguntas.</span></p>
                                    <p className="text-primary font-black italic uppercase tracking-tighter text-lg md:text-xl">Comece seu teste agora, pague apenas se aprovar.</p>
                                </div>
                            </div>
                            <div className="md:col-span-4 flex justify-center md:justify-end">
                                <div className="relative">
                                    <div className="w-32 h-32 md:w-40 md:h-40 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/30 animate-pulse-gold">
                                        <div className="text-center">
                                            <span className="block text-4xl md:text-5xl font-black text-primary italic leading-none">7</span>
                                            <span className="block text-[10px] md:text-xs font-black uppercase text-primary tracking-widest mt-1">Dias de</span>
                                            <span className="block text-[10px] md:text-xs font-black uppercase text-primary tracking-widest">Teste Grátis</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default GuaranteeSection;
