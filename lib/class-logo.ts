export const MAX_CLASS_LOGO_DECODED_BYTES = 3_000_000

export const CLASS_LOGO_TOO_LARGE_MESSAGE =
  'This photo is too large (max ~3 MB). Choose a smaller image or remove the logo.'

function decodeBase64ByteSize(base64: string): number {
  const trimmed = base64.trim()
  if (!trimmed) return 0
  const padding = trimmed.endsWith('==') ? 2 : trimmed.endsWith('=') ? 1 : 0
  return Math.floor((trimmed.length * 3) / 4) - padding
}

export function getClassLogoDecodedByteSize(classLogo: string | null | undefined): number {
  if (!classLogo || typeof classLogo !== 'string') return 0
  const trimmed = classLogo.trim()
  if (!trimmed.startsWith('data:')) return 0

  const commaIndex = trimmed.indexOf(',')
  if (commaIndex === -1) return 0

  const header = trimmed.slice(0, commaIndex)
  if (!header.includes(';base64')) return 0

  return decodeBase64ByteSize(trimmed.slice(commaIndex + 1))
}

export function isClassLogoTooLarge(classLogo: string | null | undefined): boolean {
  return getClassLogoDecodedByteSize(classLogo) > MAX_CLASS_LOGO_DECODED_BYTES
}

export function readFileAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to read image file.'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read image file.'))
    reader.readAsDataURL(file)
  })
}
