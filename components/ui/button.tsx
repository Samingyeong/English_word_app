import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-space disabled:pointer-events-none disabled:opacity-50 border-2 border-black shadow-[3px_3px_0_0_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_0_#000]",
          {
            "bg-crewmate-red text-white hover:bg-[#c42d2d] focus-visible:ring-crewmate-cyan": variant === "default",
            "border-gray-500 bg-bg-card text-gray-900 hover:bg-crewmate-cyan/20 hover:border-crewmate-cyan focus-visible:ring-crewmate-cyan": variant === "outline",
            "text-gray-200 hover:bg-white/10 hover:text-white focus-visible:ring-crewmate-lime": variant === "ghost",
            "h-10 px-4 py-2": size === "default",
            "h-9 px-3 text-sm": size === "sm",
            "h-11 px-8": size === "lg",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };

