import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export interface Language {
  code: string;
  name: string;
  nativeName?: string;
}

// Use more accurate BCP 47 language tags with enhanced French support
export const SUPPORTED_LANGUAGES: Language[] = [
  { code: "en-US", name: "English (US)", nativeName: "English (US)" },
  { code: "fr-FR", name: "French", nativeName: "Français" }, // Moved up for better visibility
  { code: "es-ES", name: "Spanish", nativeName: "Español" },
  { code: "de-DE", name: "German", nativeName: "Deutsch" },
  { code: "it-IT", name: "Italian", nativeName: "Italiano" },
  { code: "pt-BR", name: "Portuguese (Brazil)", nativeName: "Português (Brasil)" },
  { code: "ru-RU", name: "Russian", nativeName: "Русский" },
  { code: "zh-CN", name: "Chinese (Simplified)", nativeName: "简体中文" },
  { code: "ja-JP", name: "Japanese", nativeName: "日本語" },
  { code: "ko-KR", name: "Korean", nativeName: "한국어" },
  { code: "ar-SA", name: "Arabic", nativeName: "العربية" },
  { code: "hi-IN", name: "Hindi", nativeName: "हिन्दी" },
  { code: "nl-NL", name: "Dutch", nativeName: "Nederlands" },
  { code: "pl-PL", name: "Polish", nativeName: "Polski" },
  { code: "tr-TR", name: "Turkish", nativeName: "Türkçe" },
  { code: "sv-SE", name: "Swedish", nativeName: "Svenska" },
];

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange,
}) => {
  return (
    <Select value={selectedLanguage} onValueChange={onLanguageChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select language" />
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_LANGUAGES.map((language) => (
          <SelectItem key={language.code} value={language.code}>
            {language.name} {language.nativeName && language.name !== language.nativeName ? `(${language.nativeName})` : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LanguageSelector;
