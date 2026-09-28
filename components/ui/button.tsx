import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-fast ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary-500 text-white shadow-sm hover:bg-primary-600 active:bg-primary-700 btn-primary-glow",
        secondary:
          "bg-secondary-500 text-white shadow-sm hover:bg-secondary-600 active:bg-secondary-700 btn-secondary-glow",
        outline:
          "border border-border bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800 text-foreground",
        ghost: "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-foreground",
        destructive:
          "bg-error text-white shadow-sm hover:opacity-90",
        link: "text-primary-600 dark:text-primary-400 underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-10 px-4",
        lg: "h-touch-lg px-6 text-base",
        icon: "h-10 w-10 shrink-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
