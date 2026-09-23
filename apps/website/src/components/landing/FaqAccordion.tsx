import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { faqs } from '../../data/landing';
import { landingI18n } from '../../i18n/landing';

export const FaqAccordion: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [lang, setLang] = useState<'en' | 'es'>('en');

  React.useEffect(() => {
    // Initialize from localStorage
    try {
      const stored = localStorage.getItem('landing-lang') as 'en' | 'es';
      if (stored === 'es') setLang('es');
    } catch(e) {}

    // Listen to custom event from Navbar
    const handleLangChange = (e: any) => {
      if (e.detail === 'es' || e.detail === 'en') {
        setLang(e.detail);
      }
    };
    window.addEventListener('languagechange', handleLangChange);
    return () => window.removeEventListener('languagechange', handleLangChange);
  }, []);

  const dict = landingI18n[lang];


  return (
    <div className="w-full max-w-3xl mx-auto">
      {faqs.map((faq, index) => (
        <div key={index} className="border-b border-[#30353b]">
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full py-6 flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-sm"
          >
            <span className="text-[18px] font-semibold text-white tracking-[-0.72px]">
              {dict[`faq.q${index + 1}` as keyof typeof dict] || faq.question}
            </span>
            <ChevronDown 
              className={`w-5 h-5 text-[#9ba0a6] transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}
            />
          </button>
          
          <AnimatePresence initial={false}>
            {openIndex === index && (
              <motion.div
                initial="collapsed"
                animate="open"
                exit="collapsed"
                variants={{
                  open: { opacity: 1, height: "auto", marginBottom: "24px" },
                  collapsed: { opacity: 0, height: 0, marginBottom: "0px" }
                }}
                transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                className="overflow-hidden"
              >
                <p className="text-[16px] text-[#9ba0a6] leading-[1.6]">
                  {dict[`faq.a${index + 1}` as keyof typeof dict] || faq.answer}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};
