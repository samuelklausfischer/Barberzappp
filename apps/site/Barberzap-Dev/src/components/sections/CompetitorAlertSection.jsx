import React from 'react';
import { motion } from 'framer-motion';
import { TriangleAlert, AlertCircle, X } from 'lucide-react';

const CompetitorAlertSection = () => {
    return (
        <section className="py-24 bg-background relative overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        className="relative bg-destructive/5 border border-destructive/20 rounded-[3rem] p-8 md:p-16 overflow-hidden shadow-2xl"
                    >
                        <div className="absolute -bottom-10 -right-10 opacity-5">
                            <AlertCircle size={300} className="text-destructive" />
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
                            <div className="lg:col-span-7 text-left">
                                <div className="inline-flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-full px-4 py-1.5 mb-8">
                                    <TriangleAlert className="w-4 h-4 text-destructive" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-destructive italic">Alerta de Segurança Comercial</span>
                                </div>
                                <h3 className="text-3xl md:text-5xl font-black italic uppercase mb-8 leading-tight">
                                    Ainda usa apps que <span className="text-destructive">enviam seu cliente</span> para um site externo?
                                </h3>
                                <div className="space-y-6 text-muted-foreground text-base md:text-lg leading-relaxed font-medium">
                                    <p>Cuidado: Ao mandar seu cliente para um portal de agendamentos, <span className="text-white font-bold">você está entregando ele para a concorrência.</span></p>
                                    <p>Se ele não encontrar o horário que quer em sua agenda, o próprio portal sugere outras barbearias próximas. <span className="text-destructive font-bold italic">"Ah, o barbeiro X não tem vaga? Veja estas outras 10 barbearias aqui..."</span></p>
                                    <p className="text-white font-black italic uppercase tracking-tighter text-xl md:text-2xl border-l-4 border-primary pl-6 py-2 bg-primary/5">Com o Barberzap, você blinda seu negócio.</p>
                                    <p className="text-sm md:text-base">O cliente resolve tudo dentro do <span className="text-primary font-bold">SEU WhatsApp</span>. Ele é seu, e nossa inteligência garante que ele continue sendo seu, sempre puxando-o de volta para a sua cadeira.</p>
                                </div>
                            </div>
                            <div className="lg:col-span-5 relative">
                                <div className="relative rounded-[2rem] overflow-hidden border border-border bg-card shadow-2xl">
                                    <div className="p-4 border-b border-border bg-secondary/50 flex items-center justify-between">
                                        <div className="flex gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-destructive/50" />
                                            <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                            <div className="w-3 h-3 rounded-full bg-green-500/50" />
                                        </div>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Alerta de Perda de Cliente</span>
                                    </div>
                                    <div className="p-8 space-y-6">
                                        <div className="flex items-center gap-4 bg-destructive/10 p-4 rounded-xl border border-destructive/20 animate-pulse">
                                            <X className="text-destructive shrink-0" size={24} />
                                            <p className="text-xs font-bold text-destructive uppercase tracking-tight">Cliente visualizou sua concorrência no app externo</p>
                                        </div>
                                        <div className="space-y-3 opacity-40">
                                            <div className="h-4 bg-secondary rounded w-3/4" />
                                            <div className="h-4 bg-secondary rounded w-1/2" />
                                            <div className="h-20 bg-secondary rounded w-full" />
                                        </div>
                                        <div className="pt-4 border-t border-border mt-4">
                                            <p className="text-[10px] text-center text-muted-foreground italic font-medium">Não deixe sua agenda virar um cardápio para os outros.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default CompetitorAlertSection;
