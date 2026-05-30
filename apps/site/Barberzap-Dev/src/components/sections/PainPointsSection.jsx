import React from 'react';
import SectionHeading from '../ui/SectionHeading';
import ScrollCard from '../ui/ScrollCard';

const painPoints = [
    { img: "/icons/icone-perda.svg", title: "O som do dinheiro indo embora", desc: "Você está focado no degradê perfeito, e o celular não para de apitar. Cada notificação pode ser um cliente novo... ou um que você está prestes a perder porque não consegue responder a tempo." },
    { img: "/icons/icone-cadeira.svg", title: "A cadeira vazia que custa caro", desc: "Você chega na barbearia, olha a agenda de papel ou as mensagens soltas e vê o primeiro horário... vazio. O cliente 'esqueceu'. Um simples lembrete automático teria enchido essa cadeira." },
    { img: "/icons/icone-malabarista.svg", title: "Barbeiro ou atendente?", desc: "Seu cliente na cadeira merece 100% da sua atenção. Mas você se pega respondendo dúvidas básicas entre uma tesourada e outra. Isso passa uma imagem de desorganização." }
];

const PainPointsSection = () => {
    return (
        <section className="py-24 bg-gradient-dark">
            <div className="container mx-auto px-4">
                <SectionHeading
                    badge="IDENTIFICAÇÃO"
                    title={<>Esse caos parece <span className="text-primary italic">familiar?</span></>}
                    subtitle="Barbeiro, sua mão foi feita para segurar a tesoura, não para ser escravo de notificações o dia todo."
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {painPoints.map((item, i) => (
                        <ScrollCard key={i} className="bg-card/40 border border-border p-8 rounded-[2rem] hover:border-primary/30 transition-all text-left flex flex-col h-full group">
                            <div className="w-20 h-20 bg-primary/5 rounded-2xl flex items-center justify-center mb-8 shrink-0 transition-transform duration-500">
                                <img src={item.img} className="w-14 h-14" alt={item.title} />
                            </div>
                            <h4 className="text-xl font-black italic uppercase mb-4 leading-tight">{item.title}</h4>
                            <p className="text-muted-foreground text-sm leading-relaxed flex-grow">{item.desc}</p>
                        </ScrollCard>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PainPointsSection;
