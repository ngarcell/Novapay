import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const qpayButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-primary text-white hover:scale-105 hover:shadow-button active:scale-95 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity",
        secondary:
          "bg-gradient-secondary text-white hover:scale-105 hover:shadow-button active:scale-95 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity",
        success:
          "bg-gradient-success text-white hover:scale-105 hover:shadow-button active:scale-95 before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity",
        outline:
          "border-2 border-primary/20 glass-card text-foreground hover:bg-primary/10 hover:border-primary/40 hover:shadow-glow",
        ghost:
          "text-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-inner-glow",
        glass:
          "glass-card text-foreground hover:bg-white/10 hover:shadow-glow backdrop-blur-lg",
        danger:
          "bg-gradient-to-r from-red-500 to-red-600 text-white hover:scale-105 hover:shadow-button active:scale-95",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-14 rounded-lg px-8 text-base",
        xl: "h-16 rounded-xl px-10 text-lg",
        icon: "h-12 w-12",
      },
      glow: {
        true: "shadow-glow hover:shadow-glow-lg",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      glow: false,
    },
  },
);

export interface QpayButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof qpayButtonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const QpayButton = React.forwardRef<HTMLButtonElement, QpayButtonProps>(
  (
    {
      className,
      variant,
      size,
      glow,
      asChild = false,
      loading = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          qpayButtonVariants({ variant, size, glow, className }),
          loading && "cursor-not-allowed opacity-70",
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        <span className="relative z-10">{children}</span>
      </Comp>
    );
  },
);
QpayButton.displayName = "QpayButton";

export { QpayButton, qpayButtonVariants };
