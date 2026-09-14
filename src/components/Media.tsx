import { useState, type ImgHTMLAttributes } from "react";
import { Watch } from "lucide-react";
import { content } from "@/content";
export default function Media({
  alt = "",
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  return failedSource !== null && failedSource === props.src ? (
    <div
      className="media-fallback"
      role="img"
      aria-label={alt + " — " + content.ui.imageUnavailable}
    >
      <Watch size={40} />
      <span>{alt || content.ui.imageUnavailable}</span>
    </div>
  ) : (
    <img {...props} alt={alt} onError={() => setFailedSource(props.src ?? "")} />
  );
}
