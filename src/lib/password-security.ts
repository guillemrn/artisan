export const PASSWORD_MIN_LENGTH = 12;

export const PASSWORD_REQUIREMENTS = [
  {
    id: "length",
    label: `Al menos ${PASSWORD_MIN_LENGTH} caracteres`,
    test: (password: string) => password.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "lowercase",
    label: "Una letra minúscula",
    test: (password: string) => /[a-z]/.test(password),
  },
  {
    id: "uppercase",
    label: "Una letra mayúscula",
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    id: "number",
    label: "Un número",
    test: (password: string) => /[0-9]/.test(password),
  },
  {
    id: "symbol",
    label: "Un símbolo",
    test: (password: string) => /[^A-Za-z0-9\s]/.test(password),
  },
] as const;

export function isStrongPassword(password: string) {
  return PASSWORD_REQUIREMENTS.every((requirement) => requirement.test(password));
}
