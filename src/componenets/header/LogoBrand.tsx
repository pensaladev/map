import { Link } from "react-router-dom";

type Props = {
  logoSrc?: string; // local path placeholder
};

export function LogoBrand({ logoSrc = "/logo.jpeg" }: Props) {
  return (
    <Link to="/" className="flex items-center gap-2">
      <img
        src={logoSrc}
        alt="Logo"
        className="h-full w-24 rounded-md object-contain"
        draggable={false}
      />
    </Link>
  );
}
