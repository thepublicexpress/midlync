/**
 * Generate privacy codes from IDs
 * These codes are used to anonymize company information.
 */

export function generateManufacturerCode(id: string): string {
  // Create a hash from the ID for consistent code generation
  const hash = id.split('-')[0].toUpperCase().substring(0, 4)
  const num = parseInt(id.charCodeAt(0).toString()) * 1000 + (id.length * 100)
  return `MFR-${hash}${num.toString().slice(-3)}`
}

export function generateBuyerCode(id: string): string {
  const hash = id.split('-')[0].toUpperCase().substring(0, 4)
  const num = parseInt(id.charCodeAt(0).toString()) * 1000 + (id.length * 100)
  return `BYR-${hash}${num.toString().slice(-3)}`
}

export function generateAgencyCode(id: string): string {
  const hash = id.split('-')[0].toUpperCase().substring(0, 4)
  const num = parseInt(id.charCodeAt(0).toString()) * 1000 + (id.length * 100)
  return `AGN-${hash}${num.toString().slice(-3)}`
}

/**
 * Generate a unique product sub‑code
 * Format: PRD-XXXXX (5 alphanumeric characters)
 * 
 * This code is stored in the `product_code` column of the `products` table.
 * It helps buyers and manufacturers reference products easily.
 */
export function generateProductCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = 'PRD-'
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}