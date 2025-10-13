/**
 * Validates if email matches the company domain pattern
 * @param email - Email address to validate
 * @param companyDomain - Company domain from environment variable (e.g., "company-email.com")
 * @returns true if email is valid, false otherwise
 */
export const isValidCompanyEmail = (email: string, companyDomain?: string): boolean => {
  if (!companyDomain) {
    throw new Error('COMPANY_DOMAIN environment variable is not set');
  }

  // Escape special regex characters in domain
  const escapedDomain = companyDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Create regex pattern: anything@{domain}
  const emailRegex = new RegExp(`^[^\\s@]+@${escapedDomain}$`);
  
  return emailRegex.test(email);
};

