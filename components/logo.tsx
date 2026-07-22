import Link from "next/link";
import { Boxes } from "lucide-react";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 hover:opacity-90 transition-opacity"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-background">
        <Boxes className="h-4 w-4" />
      </span>
      <span className="text-lg font-bold">OakTech</span>
    </Link>
  );
}
