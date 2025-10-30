import { createRoot } from "react-dom/client";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n";
import { VenuePopup } from "./layer/VenuePopup";
// import { VenuePopup } from "../components/map/VenuePopup"; // <-- adjust to your actual path

export function renderVenuePopup(
  props: Parameters<typeof VenuePopup>[0],
): HTMLDivElement {
  const container = document.createElement("div");
  const root = createRoot(container);
  root.render(
    <I18nextProvider i18n={i18n}>
      <VenuePopup {...props} />
    </I18nextProvider>,
  );
  return container;
}
