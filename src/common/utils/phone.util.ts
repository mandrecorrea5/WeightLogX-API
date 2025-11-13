export const sanitizePhoneNumber = (
  value: string | null | undefined,
): string | null => {
  if (!value) {
    return null;
  }
  const digitsOnly = value.replace(/\D/g, '');
  return digitsOnly.length > 0 ? digitsOnly : null;
};
