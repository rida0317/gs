// src/hooks/useTranslation.ts - Hook for using translations in components

import { useMemo } from 'react'
import { useSchoolStore } from '../store/schoolStore'
import { translations, Language } from '../utils/translations'

export const useTranslation = () => {
  const { language } = useSchoolStore()
  
  const t = useMemo(() => {
    return (key: string) => {
      const translation = translations[key]
      if (!translation) {
        return key
      }
      return translation[language as Language] || translation.en
    }
  }, [language])
  
  return {
    t,
    language,
    dir: language === 'ar' ? 'rtl' : 'ltr'
  }
}

export default useTranslation
