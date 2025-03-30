import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getItem, setItem } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/storage';
import en from '../locales/en';
import zh from '../locales/zh';

// 支持的语言
type Language = 'en' | 'zh';

// 语言数据
type LanguageData = typeof en;

// 语言上下文类型
interface LanguageContextType {
  language: Language;
  t: any; // 使用 any 类型避免复杂嵌套类型兼容性问题
  changeLanguage: (language: Language) => void;
  isLoaded: boolean; // 添加加载状态标志
}

// 创建上下文
const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  t: en,
  changeLanguage: () => {},
  isLoaded: false,
});

// 语言提供者组件
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [isLoaded, setIsLoaded] = useState(false);
  const initRef = useRef(false);
  const t = language === 'zh' ? zh : en;

  useEffect(() => {
    // 防止重复初始化
    if (initRef.current) return;
    initRef.current = true;
    
    // 从存储读取语言设置
    const loadLanguage = async () => {
      try {
        const storedLanguage = await getItem(STORAGE_KEYS.LANGUAGE);
        if (storedLanguage && (storedLanguage === 'en' || storedLanguage === 'zh')) {
          setLanguage(storedLanguage as Language);
        }
      } catch (error) {
        console.error('加载语言设置失败:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadLanguage();
  }, []);

  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    setItem(STORAGE_KEYS.LANGUAGE, newLanguage);
  };

  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage, isLoaded }}>
      {children}
    </LanguageContext.Provider>
  );
};

// 使用语言的钩子
export const useLanguage = () => useContext(LanguageContext);

export default LanguageContext; 