// src/auth/AuthModal.tsx
import { useEffect, useState } from "react";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { ProfileView } from "./ProfileView";
import { useAuthUser } from "../../auth/hooks/useAuthUser";
import { Modal } from "../common/Modal";

type AuthView = "login" | "register" | "reset" | "profile";

export function AuthModal({
  isOpen,
  onClose,
  initialView = "login",
}: {
  isOpen: boolean;
  onClose: () => void;
  initialView?: Exclude<AuthView, "profile">;
}) {
  const { user, loading } = useAuthUser();
  const [view, setView] = useState<AuthView>(initialView);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!isOpen) return;
    setView(user ? "profile" : initialView);
  }, [isOpen, user, initialView]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const headerTitle =
    view === "profile"
      ? "Your profile"
      : view === "login"
      ? "Welcome back"
      : view === "register"
      ? "Create account"
      : "Reset password";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={headerTitle}
      size="sm"
      panelClassName="sm:max-w-md"
      // let the inner panes manage scrolling; keep container stable
      contentClassName="relative h-[80vh] sm:h-[680px] px-0 py-0"
    >
      {loading ? (
        <div className="grid place-items-center h-full">
          <div className="flex items-center gap-3 text-gray-600">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
            <span>Loading…</span>
          </div>
        </div>
      ) : (
        // NEW: column layout — logo in normal flow, panes fill the rest
        <div className="flex h-full flex-col">
          {/* Top logo (in flow, not absolute) */}
          <div className="flex justify-center p-4 sm:p-5 shrink-0">
            <img
              src="/logo_secondary.jpeg"
              alt="Brand"
              className="h-20 sm:h-40 object-contain"
            />
          </div>

          {/* Panes area fills remaining height; slide between absolute panels */}
          <div className="relative flex-1 overflow-hidden overscroll-contain">
            {/* LOGIN */}
            <div
              className={`absolute inset-0 p-6 transition-transform duration-300 ease-out ${
                view === "login"
                  ? "translate-x-0 opacity-100"
                  : view === "register"
                  ? "-translate-x-full opacity-0"
                  : "translate-x-full opacity-0"
              } ${view === "profile" ? "translate-x-full opacity-0" : ""}`}
            >
              <LoginForm
                onRegister={() => setView("register")}
                onForgot={() => setView("reset")}
                onDone={() => setView("profile")}
              />
            </div>

            {/* REGISTER */}
            <div
              className={`absolute inset-0 p-6 transition-transform duration-300 ease-out ${
                view === "register"
                  ? "translate-x-0 opacity-100"
                  : view === "reset"
                  ? "-translate-x-full opacity-0"
                  : "translate-x-full opacity-0"
              } ${view === "profile" ? "translate-x-full opacity-0" : ""}`}
            >
              <RegisterForm
                onLogin={() => setView("login")}
                onDone={() => setView("profile")}
              />
            </div>

            {/* RESET */}
            <div
              className={`absolute inset-0 p-6 transition-transform duration-300 ease-out ${
                view === "reset"
                  ? "translate-x-0 opacity-100"
                  : view === "login"
                  ? "-translate-x-full opacity-0"
                  : "translate-x-full opacity-0"
              } ${view === "profile" ? "translate-x-full opacity-0" : ""}`}
            >
              <ResetPasswordForm onLogin={() => setView("login")} />
            </div>

            {/* PROFILE */}
            <div
              className={`absolute inset-0 p-6 transition-transform duration-300 ease-out ${
                view === "profile"
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-full opacity-0"
              }`}
            >
              <ProfileView user={user} onClose={onClose} />
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
