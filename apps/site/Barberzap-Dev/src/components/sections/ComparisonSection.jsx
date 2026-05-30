import React from 'react';
import { X, CheckCircle, TriangleAlert } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';
import ScrollCard from '../ui/ScrollCard';

const amateurItems = [
    "Agenda na caderneta ou mensagens soltas",
    "Cliente esperando resposta por horas",
    "Furos na agenda e clientes que esquecem",
    "Estresse e interrupções durante o corte"
];

const proItems = [
    "Agenda digital e inteligente 24h",
    "Atendimento instantâneo e educado",
    "Lembretes automáticos via WhatsApp",
    "Foco 100% na tesoura e paz mental"
];

const ComparisonSection = () => {
    return (
        <section className="py-24 bg-background border-y border-border overflow-hidden">
            <div className="container mx-auto px-4">
                <SectionHeading
                    badge="O CONTRASTE"
                    title={<>Decida qual tipo de <span className="text-primary italic">negócio</span> você quer ter</>}
                    subtitle="O amadorismo custa caro. A profissionalização se paga sozinha."
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto items-stretch">
                    {/* Lado Amador */}
                    <ScrollCard className="group bg-secondary/10 border border-border rounded-[3rem] p-8 md:p-12 relative flex flex-col h-full hover:border-destructive/30 transition-all duration-500">
                        <div className="relative mb-10 mx-auto w-full max-w-[320px]">
                            <div className="absolute inset-0 bg-destructive/10 blur-[60px] rounded-full opacity-50" />
                            <div className="relative rounded-[2rem] overflow-hidden border border-white/5 shadow-2xl grayscale group-hover:grayscale-0 transition-all duration-700">
                                <img src="/jeito-amador.png" alt="O Jeito Amador" className="w-full h-auto" />
                            </div>
                            <div className="absolute top-4 left-4">
                                <span className="bg-destructive text-white text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full shadow-lg">O Caos</span>
                            </div>
                        </div>
                        <div className="flex-grow flex flex-col items-center text-center">
                            <h4 className="text-2xl font-black italic uppercase mb-8 text-muted-foreground flex items-center gap-3">
                                <TriangleAlert className="text-destructive" size={26} /> O Jeito Amador
                            </h4>
                            <ul className="space-y-6 text-left w-full max-w-sm">
                                {amateurItems.map((item, i) => (
                                    <li key={i} className="flex items-start gap-4 text-muted-foreground/80 font-medium">
                                        <div className="w-6 h-6 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                                            <X className="text-destructive" size={14} />
                                        </div>
                                        <span className="text-sm md:text-base">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </ScrollCard>

                    {/* Lado Profissional */}
                    <ScrollCard className="group bg-primary/5 border-2 border-primary/20 rounded-[3rem] p-8 md:p-12 relative flex flex-col h-full hover:border-primary/50 transition-all duration-500 shadow-[0_0_50px_rgba(234,179,8,0.05)]">
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-[0.3em] px-6 py-2 rounded-full shadow-xl z-20 border-2 border-background">
                            Recomendado
                        </div>
                        <div className="relative mb-10 mx-auto w-full max-w-[320px]">
                            <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full opacity-60" />
                            <div className="relative rounded-[2rem] overflow-hidden border border-primary/20 shadow-[0_20px_50px_rgba(234,179,8,0.2)] transition-transform duration-700">
                                <img src="/jeito-barberzap-2.png" alt="O Jeito Barberzap" className="w-full h-auto" />
                            </div>
                            <div className="absolute top-4 left-4">
                                <span className="bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full shadow-lg">A Solução</span>
                            </div>
                        </div>
                        <div className="flex-grow flex flex-col items-center text-center">
                            <h4 className="text-2xl font-black italic uppercase mb-8 text-primary flex items-center gap-3">
                                <CheckCircle className="text-primary" size={26} /> O Jeito Barberzap
                            </h4>
                            <ul className="space-y-6 text-left w-full max-w-sm">
                                {proItems.map((item, i) => (
                                    <li key={i} className="flex items-start gap-4 text-white font-bold italic">
                                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_15px_rgba(234,179,8,0.4)]">
                                            <CheckCircle className="text-primary-foreground" size={14} />
                                        </div>
                                        <span className="text-sm md:text-base">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="absolute -inset-0.5 bg-gradient-to-b from-primary/20 to-transparent rounded-[3rem] -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </ScrollCard>
                </div>
            </div>
        </section>
    );
};

export default ComparisonSection;
