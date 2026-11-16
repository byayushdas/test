import React, { createContext, useContext, useState, useEffect } from 'react';

// The 22 Scheduled Languages of India + English
export const INDIAN_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'bn', label: 'Bengali' },
  { code: 'te', label: 'Telugu' },
  { code: 'mr', label: 'Marathi' },
  { code: 'ta', label: 'Tamil' },
  { code: 'ur', label: 'Urdu' },
  { code: 'gu', label: 'Gujarati' },
  { code: 'kn', label: 'Kannada' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'or', label: 'Odia' },
  { code: 'pa', label: 'Punjabi' },
  { code: 'as', label: 'Assamese' },
  { code: 'mai', label: 'Maithili' },
  { code: 'sat', label: 'Santali' },
  { code: 'ks', label: 'Kashmiri' },
  { code: 'ne', label: 'Nepali' },
  { code: 'sd', label: 'Sindhi' },
  { code: 'kok', label: 'Konkani' },
  { code: 'doi', label: 'Dogri' },
  { code: 'mni', label: 'Manipuri' },
  { code: 'brx', label: 'Bodo' },
  { code: 'sa', label: 'Sanskrit' }
];

interface LanguageContextType {
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  translateText: (text: string, targetLang?: string) => Promise<string>;
}

const LanguageContext = createContext<LanguageContextType>({
  selectedLanguage: 'en',
  setSelectedLanguage: () => {},
  translateText: async (text) => text,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  // Load language from localStorage if available
  useEffect(() => {
    const savedLang = localStorage.getItem('s2s_language');
    if (savedLang) {
      setSelectedLanguage(savedLang);
    }
  }, []);

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    localStorage.setItem('s2s_language', lang);
    
    // Set googtrans cookie for Google Translate
    if (lang === 'en') {
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
    } else {
      document.cookie = `googtrans=/en/${lang}; path=/`;
      document.cookie = `googtrans=/en/${lang}; path=/; domain=${window.location.hostname}`;
    }
    
    // Reload page to apply translation
    window.location.reload();
  };

  // Mock translation function for now. Real implementation could use an API.
  // The user requested: "if a user says आम instead of mango it should detect even typed should show the mango etc"
  // For free, we can use the MyMemory API for lightweight client-side translation.
  const translateText = async (text: string, targetLang = 'en'): Promise<string> => {
    if (!text) return text;
    if (selectedLanguage === 'en' && targetLang === 'en') return text;
    
    try {
      const sourceLang = selectedLanguage;
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`);
      const data = await response.json();
      if (data && data.responseData && data.responseData.translatedText) {
        return data.responseData.translatedText;
      }
      return text;
    } catch (err) {
      console.error("Translation error", err);
      return text;
    }
  };

  return (
    <LanguageContext.Provider value={{ selectedLanguage, setSelectedLanguage: handleLanguageChange, translateText }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
