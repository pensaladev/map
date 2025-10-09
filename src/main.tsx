import { StrictMode } from "react";
import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./i18n";
import App from "./App.tsx";
import { Toaster } from "sonner";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{ duration: 3000 }}
        richColors
      />
      <App />
    </BrowserRouter>
  </StrictMode>,
);
