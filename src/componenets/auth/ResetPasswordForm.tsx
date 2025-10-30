// src/auth/ResetPasswordForm.tsx
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { resetPassword } from "../../auth/authService";

export function ResetPasswordForm({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto">
        {!sent ? (
          <>
            <p className="text-sm text-gray-600">
              {t("auth.reset.intro")}
            </p>

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

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm">
            <Trans
              i18nKey="auth.reset.sentDescription"
              values={{ email }}
              components={{ strong: <b /> }}
            />
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {!sent ? (
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black text-white py-2.5 font-medium hover:bg-black/90 active:scale-[.99] transition disabled:opacity-60"
          >
            {loading ? t("auth.reset.submitting") : t("auth.reset.submit")}
          </button>
        ) : (
          <button
            type="button"
            onClick={onLogin}
            className="w-full rounded-lg bg-black text-white py-2.5 font-medium hover:bg-black/90 active:scale-[.99] transition"
          >
            {t("auth.reset.backToLogin")}
          </button>
        )}
      </div>
    </form>
  );
}
