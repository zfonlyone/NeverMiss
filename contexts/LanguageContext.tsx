import React, { createContext, useState, useEffect, useContext } from 'react';
import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '../locales/en';
import zh from '../locales/zh';

// 支持的语言
export type Language = 'en' | 'zh';

// 语言数据
export type LanguageData = typeof en;

// 语言上下文类型
interface LanguageContextType {
  language: Language;
  t: LanguageData;
  changeLanguage: (lang: Language) => Promise<void>;
}

// 创建上下文
const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  t: en,
  changeLanguage: async () => {},
});

// 获取设备默认语言
const getDeviceLanguage = (): Language => {
  try {
    // 获取设备语言
    let deviceLanguage = 'en';
    
    if (Platform.OS === 'ios') {
      const iosLocale = NativeModules.SettingsManager?.settings?.AppleLocale;
      const iosLanguages = NativeModules.SettingsManager?.settings?.AppleLanguages;
      deviceLanguage = iosLocale || (Array.isArray(iosLanguages) && iosLanguages.length > 0 ? iosLanguages[0] : 'en');
    } else {
      // Android
      deviceLanguage = NativeModules.I18nManager?.localeIdentifier || 'en';
    }

    // 检查是否为中文
    return deviceLanguage && typeof deviceLanguage === 'string' && deviceLanguage.startsWith('zh') ? 'zh' : 'en';
  } catch (error) {
    console.warn('获取设备语言失败:', error);
    return 'en'; // 出错时使用英语作为默认语言
  }
};

// 语言提供者组件
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [translations, setTranslations] = useState<LanguageData>(en);

  // 加载保存的语言设置或使用设备默认语言
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('language');
        const initialLanguage = (savedLanguage as Language) || getDeviceLanguage();
        setLanguage(initialLanguage);
        setTranslations(initialLanguage === 'zh' ? zh : en);
      } catch (error) {
        console.error('加载语言设置失败:', error);
        // 使用默认语言
        setLanguage(getDeviceLanguage());
        setTranslations(getDeviceLanguage() === 'zh' ? zh : en);
      }
    };

    loadLanguage();
  }, []);

  // 切换语言
  const changeLanguage = async (lang: Language) => {
    try {
      setLanguage(lang);
      setTranslations(lang === 'zh' ? zh : en);
      await AsyncStorage.setItem('language', lang);
    } catch (error) {
      console.error('保存语言设置失败:', error);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        t: translations,
        changeLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

// 使用语言的钩子
export const useLanguage = () => useContext(LanguageContext);

export default LanguageContext; 