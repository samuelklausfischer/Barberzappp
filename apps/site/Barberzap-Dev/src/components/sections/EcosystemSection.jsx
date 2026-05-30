import React from 'react';
import { Users, DollarSign, TrendingUp } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';
import ScrollCard from '../ui/ScrollCard';

const features = [
    { icon: Users, title: "Recuperação Ativa", desc: <>O sistema monitora seus clientes. Se alguém sumir por mais de <span className="text-white font-bold">15 dias</span>, ele entra automaticamente em uma lista de recuperação. Envie mensagens diretas e traga-os de volta para a cadeira.</>, badge: null },
    { icon: DollarSign, title: "Controle Financeiro", desc: "Saiba exatamente quanto entrou no caixa. Descubra quais serviços são os mais lucrativos e quais os dias de maior movimento para otimizar sua equipe e seus lucros.", badge: null },
    { icon: TrendingUp, title: "Inovação Constante", desc: <>O Barberzap nunca para. Você recebe atualizações constantes sem custo adicional. Em breve: <span className="text-white font-bold italic text-xs uppercase tracking-widest">Gestão de Estoque e Venda de Produtos</span> integrada.</>, badge: "Sempre Evoluindo" }
];

const EcosystemSection = () => {
    return (
        <section className="py-24 bg-gradient-dark relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <div className="container mx-auto px-4">
                <SectionHeading
                    badge="ECOSSISTEMA COMPLETO"
                    title={<>O Barberzap é muito mais que uma <span className="text-primary italic">IA no WhatsApp</span></>}
                    subtitle="Você ganha um centro de comando completo para dominar todos os números e clientes da sua barbearia."
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {features.map((f, i) => (
                        <ScrollCard key={i} className={`${f.badge ? 'bg-primary/5 border border-primary/20' : 'bg-card border border-border'} p-8 rounded-[2.5rem] relative group ${f.badge ? 'overflow-hidden' : 'hover:border-primary/50'} transition-all flex flex-col h-full`}>
                            {f.badge && <div className="absolute top-0 right-0 bg-primary/20 text-primary text-[8px] font-black uppercase px-3 py-1 rounded-bl-xl">{f.badge}</div>}
                            <div className={`w-14 h-14 ${f.badge ? 'bg-primary' : 'bg-primary/10'} rounded-2xl flex items-center justify-center ${f.badge ? 'text-primary-foreground shadow-lg shadow-primary/20' : 'text-primary'} mb-6 transition-transform`}>
                                <f.icon size={28} />
                            </div>
                            <h4 className="text-xl font-black italic uppercase mb-4">{f.title}</h4>
                            <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                        </ScrollCard>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default EcosystemSection;
