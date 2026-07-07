/**
 * Generate unique codes for manufacturers and buyers
 */

export function generateManufacturerCode(userId: string): string {
  // MFR-XXXXXX format (6 alphanumeric characters)
  const hash = userId
    .split('')
    .reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0)
    .toString(36)
    .toUpperCase()
    .slice(-6)
    .padEnd(6, '0')
  
  return `MFR-${hash}`
}

export function generateBuyerCode(userId: string): string {
  // BYR-XXXXXX format (6 alphanumeric characters)
  const hash = userId
    .split('')
    .reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0)
    .toString(36)
    .toUpperCase()
    .slice(-6)
    .padEnd(6, '0')
  
  return `BYR-${hash}`
}

export function generateAgencyCode(userId: string): string {
  // AGN-XXXXXX format (6 alphanumeric characters)
  const hash = userId
    .split('')
    .reduce((acc, char) => ((acc << 5) - acc) + char.charCodeAt(0), 0)
    .toString(36)
    .toUpperCase()
    .slice(-6)
    .padEnd(6, '0')
  
  return `AGN-${hash}`
}
