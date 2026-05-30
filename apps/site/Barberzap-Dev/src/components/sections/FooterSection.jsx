import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Scissors } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';
import Button from '../ui/Button';

const FinalCTASection = ({ openLeadModal }) => {
    return (
        <section className="py-24 bg-background">
            <div className="container mx-auto px-4 text-center">
                <SectionHeading
                    title={<>Tenha mais foco no que importa: <span className="text-primary italic">o seu corte</span></>}
                    subtitle="Junte-se a barbeiros que já organizaram o atendimento e pararam de perder clientes por falta de resposta."
                />
                <Button variant="hero" size="xl" onClick={openLeadModal} className="uppercase italic tracking-tighter">Conhecer o Barberzap <ArrowRight className="ml-2" /></Button>
            </div>
        </section>
    );
};

const Footer = () => {
    return (
        <footer className="py-16 border-t border-border bg-card">
            <div className="container mx-auto px-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20"><Scissors className="w-5 h-5 text-primary-foreground" /></div>
                    <span className="text-2xl font-black italic uppercase tracking-tighter">Barber<span className="text-primary">Zap</span></span>
                </div>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto italic text-sm font-medium">A secretária virtual que organiza o WhatsApp da sua barbearia.</p>
                <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-10 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-primary transition-colors">Política de Privacidade</a>
                    <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-primary transition-colors">Termos de Uso</a>
                    <span className="cursor-default">Contato: suporte@fluxoficial.com.br</span>
                </div>
                <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase mb-8">© 2026 BARBERZAP. TODOS OS DIREITOS RESERVADOS.</p>
                <div className="max-w-4xl mx-auto border-t border-white/5 pt-8 px-4">
                    <p className="text-[9px] leading-relaxed text-muted-foreground/60 text-center uppercase tracking-tighter">
                        Este site não faz parte do site do Facebook ou da Meta Platforms, Inc. Além disso, este site NÃO é endossado pelo Facebook de nenhuma maneira. FACEBOOK é uma marca comercial da META PLATFORMS, Inc.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export { FinalCTASection, Footer };
