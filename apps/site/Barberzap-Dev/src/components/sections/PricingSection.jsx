import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Zap, Users, Gift, ShieldCheck, RefreshCcw } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';
import Button from '../ui/Button';

const PricingSection = ({ vagas, priceRef, openLeadModal }) => {
    return (
        <section id="oferta" className="py-24 bg-background">
            <div className="container mx-auto px-4 text-center">
                <SectionHeading badge="PLANO ÚNICO" title={<>Assine o <span className="text-gradient-gold italic">Barberzap</span></>} />

                <div className="max-w-md mx-auto mb-12 px-4">
                    <p className="text-lg font-bold italic mb-6 text-white">Oferta de Lançamento para os Próximos 50 Barbeiros</p>
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">Vagas Promocionais</span>
                        <span className="text-xs font-black text-white italic">Restam apenas {vagas}</span>
                    </div>
                    <div className="w-full h-3 bg-secondary rounded-full overflow-hidden border border-white/5 p-[2px] mb-4">
                        <motion.div
                            initial={{ width: '66%' }}
                            animate={{ width: `${(vagas / 50) * 100}%` }}
                            className="h-full bg-gradient-to-r from-yellow-600 to-primary rounded-full shadow-[0_0_15px_rgba(234,179,8,0.5)] transition-all duration-1000"
                        />
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                        ⚠️ Após o preenchimento das vagas, o valor retornará para <span className="text-white">R$ 99,90/mês</span>. <br />
                        <span className="text-primary italic">Assinando agora, você garante este valor promocional para sempre.</span>
                    </p>
                </div>

                <div className="max-w-xl mx-auto relative px-4 mb-20">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -inset-4 bg-primary/30 rounded-[3rem] blur-3xl z-0"
                    />
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                        transition={{ duration: 4, delay: 1, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -inset-8 bg-yellow-600/20 rounded-[4rem] blur-3xl z-0"
                    />

                    <div ref={priceRef} className="relative bg-card border-4 border-primary rounded-[3rem] p-8 md:p-12 shadow-2xl overflow-hidden">
                        <div className="bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-[0.3em] py-2 absolute top-8 -right-12 w-48 rotate-45">OFERTA LIMITADA</div>
                        <span className="text-muted-foreground line-through text-2xl mb-4 block">De R$ 99,90/mês</span>
                        <div className="flex items-center justify-center gap-2 mb-8">
                            <span className="text-4xl font-bold italic">R$</span>
                            <span className="text-8xl md:text-9xl font-black text-gradient-gold italic">49</span>
                            <div className="text-left font-bold">
                                <span className="text-4xl text-primary italic">,90</span>
                                <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">/mês</p>
                            </div>
                        </div>

                        <Button
                            variant="hero"
                            size="xl"
                            className="w-full h-auto py-4 sm:h-14 mb-8 uppercase italic tracking-tighter shadow-primary/40 whitespace-normal text-sm sm:text-lg px-4"
                            onClick={openLeadModal}
                        >
                            Quero Profissionalizar Minha Barbearia
                        </Button>

                        <div className="space-y-5 bg-black/20 p-4 rounded-2xl border border-white/5">
                            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-primary tracking-widest">
                                    <ShieldCheck size={14} className="text-primary" /> Compra Segura
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-primary tracking-widest">
                                    <RefreshCcw size={14} className="text-primary" /> 7 Dias de Garantia
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-3">
                                <div className="flex gap-2">
                                    <div className="px-2 py-1 bg-white/10 rounded border border-white/10 text-[8px] font-black text-white">VISA</div>
                                    <div className="px-2 py-1 bg-white/10 rounded border border-white/10 text-[8px] font-black text-white">MASTERCARD</div>
                                    <div className="px-2 py-1 bg-white/10 rounded border border-white/10 text-[8px] font-black text-white">PIX</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Inclusões */}
                <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} className="bg-card/30 border border-border p-8 rounded-[2rem] text-left group hover:border-primary/30 transition-colors">
                        <h4 className="text-primary font-black italic uppercase mb-6 flex items-center gap-2"><Zap size={20} /> Automação Total</h4>
                        <ul className="space-y-4">
                            {["IA que atende 24h por dia", "Agenda automática ilimitada", "Confirmação e lembretes"].map((f, i) => (
                                <li key={i} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    <CheckCircle className="text-primary shrink-0" size={14} /> {f}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: 0.1 }} className="bg-card/30 border border-border p-8 rounded-[2rem] text-left group hover:border-primary/30 transition-colors">
                        <h4 className="text-primary font-black italic uppercase mb-6 flex items-center gap-2"><Users size={20} /> Gestão de Clientes</h4>
                        <ul className="space-y-4">
                            {["Dashboard de organização", "Histórico de agendamentos", "Relatórios de faturamento"].map((f, i) => (
                                <li key={i} className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    <CheckCircle className="text-primary shrink-0" size={14} /> {f}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: 0.2 }} className="bg-primary/5 border border-primary/20 p-8 rounded-[2rem] text-left relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-primary/20 text-primary text-[8px] font-black uppercase px-3 py-1 rounded-bl-xl">Bônus Especial</div>
                        <h4 className="text-primary font-black italic uppercase mb-6 flex items-center gap-2"><Gift size={20} /> Bônus Exclusivo</h4>
                        <p className="text-[11px] text-white font-bold leading-relaxed mb-4 italic">Configuração Guiada Premium</p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">Nossa equipe configura seu WhatsApp e suas primeiras mensagens para você já começar organizado.</p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default PricingSection;
