import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  kind?: "primary" | "outline";
};
export function Button({
  children,
  kind = "primary",
  className = "",
  type = "button",
  ...props
}: Props) {
  return (
    <button
      type={type}
      className={`button ${kind} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
