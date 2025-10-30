// auth/LoginForm.tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { signIn } from "../../auth/authService";

export function LoginForm({
  onRegister,
  onForgot,
  onDone,
}: {
  onRegister: () => void;
  onForgot: () => void;
  onDone: () => void;
}) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, pw);
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
            {t("auth.common.emailLabel")}
          </label>
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            placeholder={t("auth.common.emailPlaceholder")}
          />
        </div>
        <div>
          <label className="text-sm font-medium">
            {t("auth.common.passwordLabel")}
          </label>
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
            type="password"
            required
            value={pw}
            onChange={(e) => setPw(e.currentTarget.value)}
            placeholder={t("auth.common.passwordPlaceholder")}
          />
        </div>

        <div className="text-right">
          <button
            type="button"
            onClick={onForgot}
            className="text-sm text-blue-600 hover:underline"
          >
            {t("auth.login.forgotPassword")}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3">
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black text-white py-2.5 font-medium hover:bg-black/90 active:scale-[.99] transition disabled:opacity-60"
        >
          {loading ? t("auth.login.submitting") : t("auth.login.submit")}
        </button>
        <button
          type="button"
          onClick={onRegister}
          className="w-full rounded-lg border py-2.5 font-medium hover:bg-gray-50 active:scale-[.99] transition"
        >
          {t("auth.login.createAccount")}
        </button>
      </div>
    </form>
  );
}
