import { Icon } from "@iconify/react/dist/iconify.js";
import { useTranslation } from "react-i18next";

type Lang = "fr" | "en";

type Props = {
  value?: Lang;
  onChange?: (lang: Lang) => void;
};

const normalizeLang = (lang?: string): Lang => {
  if (lang?.startsWith("fr")) return "fr";
  return "en";
};

const buttons: Array<{ code: Lang; icon: string; label: string; aria: string }> =
  [
    {
      code: "fr",
      icon: "emojione:flag-for-france",
      label: "FR",
      aria: "Switch to French",
    },
    {
      code: "en",
      icon: "circle-flags:uk",
      label: "EN",
      aria: "Switch to English",
    },
  ];

export function LanguageSwitcher({ value, onChange }: Props) {
  const { i18n } = useTranslation();
  const activeLang =
    value ?? normalizeLang(i18n.resolvedLanguage ?? i18n.language);
  const currentButton =
    buttons.find(({ code }) => code === activeLang) ?? buttons[0];

  const handleSelect = (lang: Lang) => {
    if (normalizeLang(i18n.language) !== lang) {
      void i18n.changeLanguage(lang);
    }
    onChange?.(lang);
  };

  const handleToggle = () =>
    handleSelect(activeLang === "fr" ? "en" : "fr");

  return (
    <button
      onClick={handleToggle}
      aria-label={currentButton.aria}
      className="relative flex h-10 w-10 items-center justify-center rounded-full p-1 transition bg-emerald-100/80 ring-2 ring-emerald-500 shadow-sm"
      type="button"
    >
      <Icon icon={currentButton.icon} className="h-full w-full" />
      <span className="pointer-events-none absolute -bottom-1 rounded-full px-1 text-[10px] font-semibold uppercase tracking-wide bg-emerald-500 text-white">
        {currentButton.label}
      </span>
    </button>
  );
}
