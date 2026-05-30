import React from 'react';
import { motion } from 'framer-motion';
import { Star, CheckCircle } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';
import ScrollCard from '../ui/ScrollCard';

const testimonials = [
    { name: "Ricardo 'Bigode' Silva", shop: "Barbearia Roots Premium", content: "Eu perdia muito tempo respondendo preço e horário. Hoje eu foco no degradê e quando olho o sistema, o dia já está todo preenchido. Mudou meu jogo.", avatar: "R" },
    { name: "Carlos Mendes", shop: "Studio M. Gentleman", content: "O que eu mais gosto é o lembrete automático. O índice de 'bolo' aqui na barbearia caiu quase pra zero. A IA conversa melhor que muito atendente por aí.", avatar: "C" },
    { name: "André Santos", shop: "Viking Barber Shop", content: "Pensei que os clientes iam estranhar o robô, mas eles amaram a rapidez. Em 30 segundos o cara marca o horário dele e já recebe a confirmação.", avatar: "A" }
];

const featureTags = [
    "Confirmações automáticas em tempo real",
    "Follow up de clientes",
    "Agendamentos automático e manual",
    "Lista de todos os clientes",
    "Lista de disparo em massa",
    "E muito mais..."
];

const TestimonialsSection = ({ galleryImages, setSelectedImgIndex }) => {
    return (
        <section className="py-24 bg-background overflow-hidden">
            <div className="container mx-auto px-4">
                <SectionHeading
                    badge="PROVA REAL"
                    title={<>Quem vive do corte <span className="text-primary italic">já aprovou</span></>}
                    subtitle="Não somos apenas um software. Somos a ferramenta de confiança de barbearias que decidiram profissionalizar seu atendimento."
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
                    {testimonials.map((testi, i) => (
                        <ScrollCard key={i} className="bg-card border border-border p-8 rounded-[2.5rem] relative group hover:border-primary/50 transition-all shadow-xl flex flex-col h-full">
                            <div className="flex gap-1 mb-6 text-primary">
                                {[...Array(5)].map((_, j) => <Star key={j} size={14} fill="currentColor" />)}
                            </div>
                            <p className="text-white italic mb-8 leading-relaxed">"{testi.content}"</p>
                            <div className="flex items-center gap-4 mt-auto">
                                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center font-black text-primary border border-primary/30">
                                    {testi.avatar}
                                </div>
                                <div className="text-left">
                                    <p className="font-black text-sm uppercase italic leading-none mb-1">{testi.name}</p>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{testi.shop}</p>
                                </div>
                            </div>
                        </ScrollCard>
                    ))}
                </div>

                {/* Galeria de Resultados */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    className="bg-gradient-dark border border-white/5 rounded-[3rem] p-6 md:p-16"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="text-left">
                            <h3 className="text-2xl md:text-4xl font-black italic uppercase mb-6 leading-tight">Nosso painel <br /> <span className="text-gradient-gold">super moderno</span></h3>
                            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                                Veja agora como nossa interface transforma a gestão da sua barbearia. Clique nas fotos para abrir o visualizador e ver cada detalhe.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {featureTags.map((tag, i) => (
                                    <div key={i} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                                        <CheckCircle className="text-primary shrink-0" size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-widest leading-tight">{tag}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative overflow-hidden w-full">
                            <div className="flex gap-3 infinite-marquee">
                                {[...galleryImages, ...galleryImages].map((img, idx) => (
                                    <motion.div
                                        key={idx}
                                        whileHover={{ scale: 1.05 }}
                                        className="rounded-lg border border-border overflow-hidden shadow-lg cursor-pointer bg-card aspect-video w-[68vw] sm:w-52 lg:w-[350px] shrink-0"
                                        onClick={() => setSelectedImgIndex(idx % galleryImages.length)}
                                    >
                                        <img src={img} className="w-full h-full object-cover" />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default TestimonialsSection;
