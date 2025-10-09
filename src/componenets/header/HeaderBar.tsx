import { useState } from "react";
import { LogoBrand } from "./LogoBrand";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ProfileMenu } from "../ProfileMenu";
import { useTranslation } from "react-i18next";

type Props = {
  title?: string;
  onReset: () => void;
};

export function HeaderBar({ onReset }: Props) {
  const [lang, setLang] = useState<"fr" | "en">("en");
  const { t } = useTranslation();

  return (
    <div className="absolute top-0 left-0 right-0 z-30">
      <div className="mx-2 my-2">
        <div
          className="flex items-center justify-between w-full max-w-[1200px] mx-auto
                        backdrop-blur-sm bg-white/70 p-2 rounded-xl shadow-md"
        >
          {/* left: logo */}
          <div className="min-w-0">
            <button
              onClick={onReset}
              className="flex items-center justify-center"
              aria-label="Logo action"
            >
              <LogoBrand logoSrc="/logo.jpeg" />
            </button>
          </div>

          {/* center: title */}
          <h1 className="text-base sm:text-lg font-semibold text-gray-900 text-center truncate px-2">
            {t("title")}
          </h1>

          {/* right: flags + profile */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher value={lang} onChange={setLang} />
            <ProfileMenu />
          </div>
        </div>
      </div>
    </div>
  );
}
