import { createRoot } from "react-dom/client";
import { StepPopup, type StepPopupProps } from "../StepPopup";

export function renderStepPopup(props: StepPopupProps): HTMLDivElement {
  const container = document.createElement("div");
  const root = createRoot(container);
  root.render(<StepPopup {...props} />);
  return container;
}
