import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { speakText } from "@/lib/speech";
import { cn } from "@/lib/utils";

export function SpeakerButton({
  text,
  size = "icon",
  variant = "ghost",
  className,
  label,
}: {
  text: string;
  size?: "icon" | "sm" | "default";
  variant?: "ghost" | "outline" | "default" | "secondary";
  className?: string;
  label?: string;
}) {
  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={cn(className)}
      onClick={(e) => {
        e.stopPropagation();
        speakText(text);
      }}
      aria-label={label ?? `Listen to ${text}`}
    >
      <Volume2 className="h-4 w-4" />
      {size !== "icon" && label && <span className="ml-2">{label}</span>}
    </Button>
  );
}
