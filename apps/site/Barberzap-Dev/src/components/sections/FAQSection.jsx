import React from 'react';
import SectionHeading from '../ui/SectionHeading';
import AccordionItem from '../ui/AccordionItem';

const faqs = [
    { q: "Preciso contratar um número novo?", a: "Não, você pode conectar o seu número atual da barbearia normalmente via QR Code." },
    { q: "É difícil de configurar?", a: "De forma alguma. O sistema é ideal para quem não tem tempo a perder. Em 10 minutos está tudo pronto." },
    { q: "Posso cancelar se não gostar?", a: "Sim, é uma assinatura mensal sem fidelidade. Você cancela quando quiser, sem burocracia." },
    { q: "A IA fala igual robô?", a: "A IA é treinada para conversar de forma natural e educada, seguindo o estilo da sua barbearia." },
    { q: "Minha barbearia tem mais de um barbeiro, funciona para todos?", a: "Com certeza! O BarberZap suporta múltiplos profissionais. Você pode cadastrar cada barbeiro da sua equipe com sua própria agenda, horários e serviços específicos. A IA organiza tudo de forma inteligente." }
];

const FAQSection = () => {
    return (
        <section className="py-24 bg-gradient-dark">
            <div className="container mx-auto px-4 max-w-3xl">
                <SectionHeading badge="DÚVIDAS" title="Perguntas Frequentes" />
                <div className="space-y-2 text-left">
                    {faqs.map((faq, i) => (
                        <AccordionItem key={i} question={faq.q} answer={faq.a} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQSection;
