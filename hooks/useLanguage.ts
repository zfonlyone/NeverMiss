import { useCallback } from 'react';
import { useMMKVString } from 'react-native-mmkv';
import { STORAGE_KEYS } from '../constants/storage';
import en from '../locales/en';
import zh from '../locales/zh';

type Language = 'en' | 'zh';
type Translations = typeof en;

export function useLanguage() {
  const [language, setLanguage] = useMMKVString(STORAGE_KEYS.LANGUAGE);

  const t = language === 'zh' ? zh : en;

  const changeLanguage = useCallback((newLanguage: Language) => {
    setLanguage(newLanguage);
  }, [setLanguage]);

  return {
    language: (language || 'en') as Language,
    t,
    changeLanguage,
  };
} 