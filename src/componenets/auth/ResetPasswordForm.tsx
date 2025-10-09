// src/auth/ResetPasswordForm.tsx
import { useState } from "react";
import { resetPassword } from "../../auth/authService";

export function ResetPasswordForm({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
              Enter your email and we’ll send you a reset link.
            </p>

            <div>
              <label className="text-sm font-medium">Email</label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-black/10"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                placeholder="you@example.com"
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
            If an account exists for <b>{email}</b>, a reset link has been sent.
            Please check your inbox.
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
            {loading ? "Sending..." : "Send reset link"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onLogin}
            className="w-full rounded-lg bg-black text-white py-2.5 font-medium hover:bg-black/90 active:scale-[.99] transition"
          >
            Back to sign in
          </button>
        )}
      </div>
    </form>
  );
}
