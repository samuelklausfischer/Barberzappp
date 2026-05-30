import React from 'react';
import { Zap, Clock, ShieldCheck } from 'lucide-react';
import ScrollCard from '../ui/ScrollCard';

const benefits = [
    { icon: Zap, title: "Agilidade", desc: "Seus clientes são atendidos na hora, sem espera." },
    { icon: Clock, title: "Mais Foco", desc: "Chega de parar o corte para responder mensagens." },
    { icon: ShieldCheck, title: "Organização", desc: "Sua agenda centralizada e sem confusão." }
];

const BenefitsSection = () => {
    return (
        <section className="py-20 bg-background border-y border-border">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
                    {benefits.map((b, i) => (
                        <ScrollCard key={i} className="flex flex-col items-center text-center space-y-4 p-6 rounded-3xl">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary transition-transform"><b.icon size={32} /></div>
                            <h4 className="text-xl font-black italic uppercase tracking-tighter">{b.title}</h4>
                            <p className="text-muted-foreground text-sm">{b.desc}</p>
                        </ScrollCard>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default BenefitsSection;
