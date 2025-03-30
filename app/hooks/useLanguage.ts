import { useCallback, useEffect, useState } from 'react';
import { STORAGE_KEYS } from '../utils/storage';
import en from '../locales/en';
import zh from '../locales/zh';
import { getItem, setItem } from '../utils/storage';

type Language = 'en' | 'zh';
type Translations = typeof en;

export function useLanguage() {
  const [language, setLanguage] = useState<Language>('en');

  // 从存储加载语言设置
  useEffect(() => {
    let isMounted = true;
    
    const loadLanguage = async () => {
      try {
        const storedLanguage = await getItem(STORAGE_KEYS.LANGUAGE);
        // 只在组件仍然挂载时更新状态
        if (isMounted && storedLanguage && (storedLanguage === 'en' || storedLanguage === 'zh')) {
          setLanguage(storedLanguage as Language);
        }
      } catch (error) {
        console.error('加载语言设置失败:', error);
      }
    };

    loadLanguage();
    
    // 清理函数，防止组件卸载后设置状态
    return () => {
      isMounted = false;
    };
  }, []);

  const t = language === 'zh' ? zh : en;

  const changeLanguage = useCallback((newLanguage: Language) => {
    setLanguage(newLanguage);
    // 语言值为简单字符串，直接存储
    setItem(STORAGE_KEYS.LANGUAGE, newLanguage);
  }, []);

  return {
    language,
    t,
    changeLanguage,
  };
} 