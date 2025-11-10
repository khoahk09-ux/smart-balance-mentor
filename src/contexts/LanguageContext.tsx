import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import translations from '@/lib/translations';

type Language = 'vi' | 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isChanging: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as Language) || 'vi';
  });
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    localStorage.setItem('app-language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    if (lang === language) return;
    
    // Trigger fade out
    setIsChanging(true);
    
    // Wait for fade animation then change language
    setTimeout(() => {
      setLanguageState(lang);
      // Trigger fade in
      setTimeout(() => {
        setIsChanging(false);
      }, 50);
    }, 300);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isChanging }}>
      <div className={`transition-opacity duration-300 ${isChanging ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
