import { forwardRef, type ButtonHTMLAttributes } from "react";
import { buttonClass, type ButtonSize, type ButtonVariant } from "./button-styles";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
};

/** Botón del sistema. Para enlaces con aspecto de botón usa `buttonClass()` en el Link. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", block = false, className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={buttonClass({ variant, size, block, className })}
      {...props}
    />
  );
});
