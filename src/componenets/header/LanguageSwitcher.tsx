import { Icon } from "@iconify/react/dist/iconify.js";
import { useTranslation } from "react-i18next";

type Props = {
  value?: "fr" | "en";
  onChange?: (lang: "fr" | "en") => void;
};

export function LanguageSwitcher({}: Props) {
  const { i18n } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => i18n.changeLanguage("fr")}
        aria-label="Switch to French"
        className="h-10 p-1 w-10 bg-gray-100 flex justify-center items-center rounded-full hover:bg-gray-200 transition"
        title="Profile"
      >
        <Icon icon="emojione:flag-for-france" className="h-full w-full" />
      </button>
      <button
        onClick={() => i18n.changeLanguage("en")}
        aria-label="Switch to English"
        className="h-10 p-1 w-10 bg-gray-100 flex justify-center items-center rounded-full hover:bg-gray-200 transition"
        title="Profile"
      >
        <Icon icon="circle-flags:uk" className="h-full w-full" />
      </button>
    </div>
  );
}
