// auth/RegisterForm.tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { signUp } from "../../auth/authService";

export function RegisterForm({
  onLogin,
  onDone,
}: {
  onLogin: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!agree) return;

    setLoading(true);
    try {
      await signUp(email, pw);
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto">
        <div>
          <label className="text-sm font-medium">
            {t("auth.common.nameLabel")}
          </label>
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            placeholder={t("auth.common.namePlaceholder")}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">
            {t("auth.common.emailLabel")}
          </label>
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            placeholder={t("auth.common.emailPlaceholder")}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">
            {t("auth.common.passwordLabel")}
          </label>
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.currentTarget.value)}
            placeholder={t("auth.register.passwordPlaceholder")}
            required
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.currentTarget.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          {t("auth.common.terms")}
        </label>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3">
        <button
          type="submit"
          disabled={!agree || loading}
          className="w-full rounded-lg bg-black text-white py-2.5 font-medium hover:bg-black/90 active:scale-[.99] transition disabled:opacity-60"
        >
          {loading ? t("auth.register.submitting") : t("auth.register.submit")}
        </button>
        <button
          type="button"
          onClick={onLogin}
          className="w-full rounded-lg border py-2.5 font-medium hover:bg-gray-50 active:scale-[.99] transition"
        >
          {t("auth.common.backToSignIn")}
        </button>
      </div>
    </form>
  );
}
