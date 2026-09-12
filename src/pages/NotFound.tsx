import { cn } from "@/lib/utils";
import { Snowflake } from "lucide-react";
import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="polar-hud flex min-h-screen flex-col items-center justify-center px-4">
      <span className="grid size-14 place-items-center rounded-xl border border-[#48cae4]/30 bg-[#48cae4]/10 text-[#48cae4]">
        <Snowflake className="size-7" />
      </span>
      <h1 className="hud-mono mt-5 text-4xl font-bold tracking-[0.2em] text-[#eaf8ff]">404</h1>
      <p className="hud-mono mt-2 text-[11px] tracking-[0.22em] text-[#9ec8dc]">
        GRID SECTOR NOT FOUND
      </p>
      <Link
        to="/"
        className={cn(
          "hud-mono mt-7 rounded-md border border-[#48cae4]/40 bg-[#48cae4]/10 px-4 py-2.5",
          "text-[10px] font-bold tracking-[0.18em] text-[#7be6fa] transition-colors hover:bg-[#48cae4]/20",
        )}
      >
        RETURN TO COMMAND
      </Link>
    </div>
  );
}
