import { createRoot } from "react-dom/client";
import { VenuePopup } from "./layer/VenuePopup";
// import { VenuePopup } from "../components/map/VenuePopup"; // <-- adjust to your actual path

export function renderVenuePopup(
  props: Parameters<typeof VenuePopup>[0],
): HTMLDivElement {
  const container = document.createElement("div");
  const root = createRoot(container);
  root.render(<VenuePopup {...props} />);
  return container;
}
