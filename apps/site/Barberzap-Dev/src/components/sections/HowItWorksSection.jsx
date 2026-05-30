import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';

const steps = [
    { img: "/icons/conexao-ia.svg", alt: "Conecte seu WhatsApp", title: "01. Conecte seu WhatsApp", desc: "Escaneie o QR Code e nossa inteligência se conecta ao seu WhatsApp. É rápido, seguro e usa o seu número atual." },
    { img: "/icons/configuracao-regras.svg", alt: "Configure suas Regras", title: "02. Configure suas Regras", desc: "Defina seus horários, serviços e preços. Você escolhe se a IA deve ser amigável ou formal. Ela aprende o seu estilo." },
    { img: "/icons/foco-corte.svg", alt: "Atenda com Foco Total", title: "03. Atenda com Foco Total", desc: "Relaxe e foque na tesoura. Enquanto você trabalha, a IA atende, agenda e confirma horários sem te interromper." }
];

const HowItWorksSection = () => {
    return (
        <section className="py-24 bg-background overflow-hidden relative">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent hidden md:block -translate-y-24" />
            <div className="container mx-auto px-4 relative z-10">
                <SectionHeading
                    badge="PASSO A PASSO"
                    title={<>Simples como <span className="text-gradient-gold italic">1, 2, 3</span></>}
                    subtitle="Em menos de 10 minutos você profissionaliza todo o seu atendimento."
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
                    {steps.map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ delay: i * 0.2 }}
                            className="relative text-center group"
                        >
                            <div className="w-32 h-32 bg-card border-2 border-primary/30 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl relative z-10 bg-background group-hover:border-primary group-hover:scale-105 transition-all">
                                <img src={step.img} alt={step.alt} className="w-20 h-20" />
                            </div>
                            {i < 2 && (
                                <div className="md:absolute md:-right-6 md:top-16 hidden md:block text-primary/30">
                                    <ArrowRight size={24} />
                                </div>
                            )}
                            <h4 className="text-xl font-black italic uppercase mb-4">{step.title}</h4>
                            <p className="text-muted-foreground text-sm leading-relaxed px-4">{step.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorksSection;
