import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, ShieldCheck } from 'lucide-react';
import Button from '../ui/Button';

const LeadModal = ({ isOpen, onClose, leadData, setLeadData, isSubmitting, onSubmit }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="bg-card border-t-4 border-primary w-full max-w-md rounded-[2.5rem] p-8 md:p-10 relative shadow-2xl"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 text-muted-foreground hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
                                <Zap size={32} />
                            </div>
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Vincule seu Desconto 🚀</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Para garantir o valor promocional de <span className="text-white font-bold italic">R$ 49,90</span> e seus 7 dias grátis, informe o WhatsApp onde sua IA será instalada.
                            </p>
                        </div>

                        <form onSubmit={onSubmit} className="space-y-5">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 block">Nome da Barbearia</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Ex: Barbearia do João"
                                    className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm focus:border-primary outline-none transition-all"
                                    value={leadData.name}
                                    onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2 block">WhatsApp (Instalação)</label>
                                <input
                                    required
                                    type="tel"
                                    placeholder="(11) 99999-9999"
                                    className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-sm focus:border-primary outline-none transition-all"
                                    value={leadData.whatsapp}
                                    onChange={(e) => setLeadData({ ...leadData, whatsapp: e.target.value })}
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                variant="hero"
                                size="xl"
                                className="w-full py-4 uppercase italic tracking-tighter"
                            >
                                {isSubmitting ? "Vinculando..." : "Vincular Desconto e Assinar"}
                            </Button>

                            <div className="flex items-center justify-center gap-4 pt-2">
                                <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-muted-foreground tracking-widest">
                                    <ShieldCheck size={12} className="text-primary" /> Dados Protegidos
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-muted-foreground tracking-widest">
                                    <Zap size={12} className="text-primary" /> Ativação Imediata
                                </div>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default LeadModal;
