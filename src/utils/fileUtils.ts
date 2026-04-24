/**
 * Checks if a filename represents an image file
 * @param filename - File name to check
 * @returns True if the file is an image
 */
export function isImageFile(filename: string): boolean {
  if (!filename) return false
  const ext = filename.toLowerCase().split('.').pop() || ''
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)
}

/**
 * Checks if a File object represents an image
 * @param file - File object to check
 * @returns True if the file is an image
 */
export function isImageType(file: File): boolean {
  return file.type?.startsWith('image/')
}

/**
 * Formats file size in human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted size like "2.5 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Gets MIME type based on file extension
 * @param filename - File name
 * @returns MIME type string
 */
export function getMimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop()
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
  }
  return mimeTypes[ext || ''] || 'application/octet-stream'
}

/**
 * Creates a blob URL for a file
 * @param file - File object
 * @returns Blob URL string
 */
export function createObjectUrl(file: File): string {
  if (typeof window === 'undefined' || !window.URL) {
    return ''
  }
  if (!file) {
    return ''
  }
  try {
    return window.URL.createObjectURL(file)
  } catch (e) {
    console.error('Error creating object URL:', e)
    return ''
  }
}