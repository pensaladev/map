import { LogoBrand } from "./LogoBrand";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ProfileMenu } from "../ProfileMenu";
import { useTranslation } from "react-i18next";

type Props = {
  title?: string;
  onReset: () => void;
};

export function HeaderBar({ onReset }: Props) {
  const { t } = useTranslation();

  return (
    <div className="absolute top-0 left-0 right-0 z-30">
      <div className="mx-2 my-2">
        <div
          className="flex items-center w-full max-w-[1200px] mx-auto gap-2 sm:gap-4
                        backdrop-blur-sm bg-white/70 p-1.5 sm:p-2 rounded-xl shadow-md"
        >
          {/* left: logo */}
          <div className="min-w-0 shrink-0">
            <button
              onClick={onReset}
              className="flex items-center justify-center w-16 sm:w-auto"
              aria-label="Logo action"
            >
              <LogoBrand logoSrc="/logo.jpeg" />
            </button>
          </div>

          {/* center: title */}
          <h1 className="flex-1 min-w-0 px-1 text-sm font-semibold text-gray-900 text-center leading-tight whitespace-normal break-words sm:px-2 sm:text-lg sm:truncate">
            {t("title")}
          </h1>

          {/* right: flags + profile */}
          <div className="flex items-center gap-2 shrink-0 sm:gap-3">
            <LanguageSwitcher />
            <ProfileMenu />
          </div>
        </div>
      </div>
    </div>
  );
}
