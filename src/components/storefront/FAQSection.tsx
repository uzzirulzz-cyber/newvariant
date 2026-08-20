import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react';

export const FAQSection: React.FC = () => {
  const { content, setIsWhatsAppModalOpen } = useStore();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="w-full py-16 px-4 sm:px-6 bg-[#0A0A0A] border-b border-white/10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 uppercase tracking-[0.2em] font-mono">
            <HelpCircle className="w-4 h-4 text-red-500" />
            <span>Buyer Assurance & FAQs</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-display">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-zinc-300 max-w-md mx-auto">
            Everything you need to know regarding digital delivery, projector shipping warranties, and license verification.
          </p>
        </div>

        <div className="space-y-3">
          {content.faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl modern-card overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-5 flex items-center justify-between text-left gap-4"
                >
                  <span className="text-sm sm:text-base font-bold text-white font-display leading-snug">
                    {faq.question}
                  </span>
                  <div className={`p-2 rounded-xl bg-white/[0.05] border border-white/10 text-zinc-300 transition-transform duration-200 ${isOpen ? 'rotate-180 text-red-400 bg-red-600/20 border-red-500/30' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-zinc-300 leading-relaxed border-t border-white/10 pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Support Callout */}
        <div className="p-6 rounded-2xl modern-card flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-white font-display">Have a question not answered here?</div>
            <div className="text-xs text-zinc-300 mt-0.5">Our VIP specialists are available 24/7 on WhatsApp.</div>
          </div>

          <button
            onClick={() => setIsWhatsAppModalOpen(true)}
            className="px-5 py-2.5 rounded-xl btn-secondary text-xs font-bold uppercase tracking-widest flex items-center gap-2 shrink-0"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>Chat on WhatsApp</span>
          </button>
        </div>
      </div>
    </section>
  );
};
