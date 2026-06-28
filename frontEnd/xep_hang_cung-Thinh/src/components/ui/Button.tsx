import * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = {
  primary: "bg-primary text-white hover:bg-primary/90",
  secondary: "bg-secondary text-white hover:bg-secondary/90",
  outline: "border border-border text-foreground hover:bg-muted font-bold",
  ghost: "hover:bg-muted text-foreground",
  action: "bg-[var(--secondary-legacy,#fd8b00)] text-[#1a1c1e] hover:brightness-95 shadow-button font-bold tracking-[0.7px]",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
};

const buttonSizes = {
  sm: "px-3 py-2 text-sm rounded-[8px]",
  md: "px-[24px] py-[12px] h-[48px] text-[16px] rounded-[12px]",
  lg: "px-6 py-3 text-base rounded-[12px]",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  asChild?: boolean;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", rightIcon, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          buttonVariants[variant],
          buttonSizes[size],
          className
        )}
        {...props}
      >
        {children}
        {rightIcon && <span className="ml-[8px] flex items-center justify-center size-[16px]">{rightIcon}</span>}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants, buttonSizes };
