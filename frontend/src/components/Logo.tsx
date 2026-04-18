import { useState } from "react";

type Props = { className?: string };

// Renders the user's logo.png at full size (no CSS cropping). Falls back to
// the SVG wordmark if logo.png is missing. Drop a new file at
// frontend/public/logo.png to replace.
export function Logo({ className = "h-10 w-auto" }: Props) {
  const [src, setSrc] = useState("/logo.png");
  return (
    <img
      src={src}
      alt="shape"
      className={`${className} object-contain select-none`}
      onError={() => setSrc("/logo.svg")}
      draggable={false}
    />
  );
}
