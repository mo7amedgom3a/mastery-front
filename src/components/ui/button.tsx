// clsx (not cn): kit classes never conflict, and Button ships in client islands — keep tailwind-merge out.
import { clsx as cn } from "clsx";
import type { Route } from "next";
import type { ComponentProps, ReactNode } from "react";

import { AppLink } from "@/components/ui/app-link";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "on-color";
export type ButtonSize = "sm" | "md" | "lg";

type ButtonStyleProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
};

const sizeClass: Record<ButtonSize, string | undefined> = {
  sm: "ma-btn--sm",
  md: undefined,
  lg: "ma-btn--lg",
};

/** Kit `.ma-btn` classes. One `primary` per view (design kit golden rule 4). */
export function buttonClass({ variant = "primary", size = "md", block }: ButtonStyleProps = {}): string {
  return cn("ma-btn", `ma-btn--${variant}`, sizeClass[size], block && "ma-btn--block");
}

type ButtonLinkProps = ButtonStyleProps & {
  href: Route;
  children: ReactNode;
  className?: string;
} & Omit<ComponentProps<"a">, "href" | "className" | "children">;

export function ButtonLink({ href, variant, size, block, className, children, ...rest }: ButtonLinkProps) {
  return (
    <AppLink href={href} className={cn(buttonClass({ variant, size, block }), className)} {...rest}>
      {children}
    </AppLink>
  );
}

type ButtonProps = ButtonStyleProps & ComponentProps<"button">;

export function Button({ variant, size, block, className, type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={cn(buttonClass({ variant, size, block }), className)} {...rest} />;
}
