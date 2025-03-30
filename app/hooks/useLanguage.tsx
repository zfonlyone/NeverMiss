import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { I18nManager, NativeModules, Platform } from 'react-native';
import zhTranslations from '../locales/zh';
import enTranslations from '../locales/en';

// Available languages
export type Language = 'en' | 'zh';

// Get device language
const getDeviceLanguage = (): Language => {
  const deviceLanguage =
    Platform.OS === 'ios'
      ? NativeModules.SettingsManager.settings.AppleLocale || 
        NativeModules.SettingsManager.settings.AppleLanguages[0] || 'en'
      : NativeModules.I18nManager.localeIdentifier || 'en';

  // Extract the language code (e.g., "en" from "en_US")
  const languageCode = deviceLanguage.split('_')[0];
  
  return languageCode === 'zh' ? 'zh' : 'en';
};

// Load translations for a specific language
const loadTranslations = (language: Language) => {
  switch (language) {
    case 'zh':
      return zhTranslations;
    case 'en':
    default:
      return enTranslations;
  }
};

// Context
interface LanguageContextType {
  language: Language;
  t: typeof enTranslations; // Type of translations
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  t: enTranslations,
  setLanguage: () => {},
});

// Provider component
interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(getDeviceLanguage());
  const [translations, setTranslations] = useState(loadTranslations(language));

  // Update translations when language changes
  useEffect(() => {
    // Load translations for the selected language
    const newTranslations = loadTranslations(language);
    setTranslations(newTranslations);

    // Update RTL layout direction if needed
    I18nManager.forceRTL(false); // We're not supporting RTL languages at the moment
  }, [language]);

  // Function to change language
  const handleSetLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        t: translations,
        setLanguage: handleSetLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

// Hook to use the language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 