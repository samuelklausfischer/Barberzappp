import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, X, ChevronLeft, ChevronRight } from 'lucide-react';

const SocialProofNotification = ({ notification }) => {
    return (
        <AnimatePresence>
            {notification && (
                <motion.div
                    initial={{ opacity: 0, x: -100 }}
                    animate={{ opacity: 1, x: 20 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="fixed bottom-6 left-0 z-[100] px-4 w-full max-w-[320px] pointer-events-none"
                >
                    <div className="bg-card/90 backdrop-blur-lg border border-primary/30 p-4 rounded-2xl shadow-2xl flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                            <Users className="text-primary-foreground" size={20} />
                        </div>
                        <div className="text-left">
                            <p className="text-[11px] font-black uppercase text-primary tracking-widest leading-tight mb-1">Novo Assinante!</p>
                            <p className="text-[13px] text-white font-bold leading-tight">
                                <span className="text-primary">{notification.name}</span> de {notification.city} acabou de assinar na promoção!
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const ImageLightbox = ({ selectedImgIndex, setSelectedImgIndex, galleryImages }) => {
    return (
        <AnimatePresence>
            {selectedImgIndex !== null && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
                    onClick={() => setSelectedImgIndex(null)}
                >
                    <button
                        className="absolute top-6 right-6 z-[210] text-white/70 hover:text-white p-2 bg-white/10 rounded-full transition-colors"
                        onClick={() => setSelectedImgIndex(null)}
                    >
                        <X size={32} />
                    </button>

                    <button
                        className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 z-[210] text-white/50 hover:text-primary p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all hidden md:block"
                        onClick={(e) => { e.stopPropagation(); setSelectedImgIndex(prev => (prev === 0 ? galleryImages.length - 1 : prev - 1)); }}
                    >
                        <ChevronLeft size={40} />
                    </button>

                    <motion.div
                        key={selectedImgIndex}
                        initial={{ opacity: 0, scale: 0.9, x: 50 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, x: -50 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="relative max-w-5xl w-full max-h-[85vh] flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={galleryImages[selectedImgIndex]}
                            alt="Resultado Barberzap"
                            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-white/10"
                        />
                        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-white/10 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-white/70">
                            {selectedImgIndex + 1} / {galleryImages.length}
                        </div>
                    </motion.div>

                    <button
                        className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 z-[210] text-white/50 hover:text-primary p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all hidden md:block"
                        onClick={(e) => { e.stopPropagation(); setSelectedImgIndex(prev => (prev === galleryImages.length - 1 ? 0 : prev + 1)); }}
                    >
                        <ChevronRight size={40} />
                    </button>

                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/30 text-[10px] font-bold uppercase tracking-widest md:hidden">
                        Toque fora para fechar
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export { SocialProofNotification, ImageLightbox };
