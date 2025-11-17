import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n";
import { VenuePopup } from "./layer/VenuePopup";

type PopupContext = {
  container: HTMLDivElement;
  root: ReturnType<typeof createRoot>;
  render: () => void;
};

let activePopup: PopupContext | null = null;

const cleanupActivePopup = () => {
  activePopup?.root.unmount();
  activePopup = null;
};

const rerenderActivePopup = () => {
  if (!activePopup) return;
  activePopup.render();
};

i18n.on("languageChanged", () => {
  rerenderActivePopup();
});

export function destroyPopup(container: HTMLDivElement) {
  if (!activePopup) return;
  if (activePopup.container !== container) return;
  cleanupActivePopup();
}

export function renderVenuePopup(
  props: Parameters<typeof VenuePopup>[0],
): HTMLDivElement {
  cleanupActivePopup();
  const container = document.createElement("div");
  const root = createRoot(container);

  const render = () => {
    root.render(
      <I18nextProvider i18n={i18n}>
        <VenuePopup {...props} />
      </I18nextProvider>,
    );
  };

  render();

  activePopup = {
    container,
    root,
    render,
  };

  return container;
}
