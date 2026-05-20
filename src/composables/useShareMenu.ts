import { $api } from '@/utils/api'
import { getMimeType } from '@/utils/fileUtils'

export function useShareMenu(ticketNumber: Ref<string>, attachments: Ref<any[]>) {
  // Попытаться использовать Web Share API для шаринга файлов
  const tryWebShare = async (files: File[]): Promise<boolean> => {
    if (!navigator.share || !navigator.canShare)
      return false

    try {
      const shareData = {
        title: `Файлы из тикета #${ticketNumber.value}`,
        files,
      }

      if (navigator.canShare(shareData)) {
        await navigator.share(shareData)

        return true
      }
    }
    catch (err) {
      console.log('Web Share API not available or failed:', err)
    }

    return false
  }

  // Загрузить файл как Blob для шаринга
  const fetchFileAsBlob = async (url: string): Promise<{ blob: Blob; filename: string } | null> => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const filename = url.split('/').pop() || 'file'

      return { blob, filename }
    }
    catch (err) {
      console.error('Error fetching file:', err)

      return null
    }
  }

  // Поделиться через Telegram (с файлами если возможно)
  const shareToTelegram = async () => {
    if (attachments.value.length === 0)
      return

    try {
      // Пробуем использовать Web Share API для отправки файлов
      const files: File[] = []
      for (const attachment of attachments.value) {
        const url = `/uploads/${attachment.filename}`
        const result = await fetchFileAsBlob(url)
        if (result) {
          const mimeType = getMimeType(attachment.filename)

          files.push(new File([result.blob], attachment.filename, { type: mimeType }))
        }
      }

      // Если удалось загрузить файлы и Web Share поддерживает их
      if (files.length > 0) {
        const shared = await tryWebShare(files)
        if (shared)
          return
      }

      // Фоллбек на ссылки
      const baseUrl = window.location.origin

      const fileLinks = attachments.value
        .map(attachment => `${attachment.filename}: ${baseUrl}/uploads/${encodeURIComponent(attachment.filename)}`)
        .join('\n')

      const message = `📎 Файлы из тикета #${ticketNumber.value}\n\n${fileLinks}`
      const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(message)}`

      window.open(telegramUrl, '_blank')
    }
    catch (err) {
      console.error('Error sharing to Telegram:', err)
    }
  }

  // Поделиться через Mail.ru
  const shareToMail = async () => {
    if (attachments.value.length === 0)
      return

    try {
      const baseUrl = window.location.origin

      const fileLinks = attachments.value
        .map(attachment => `${attachment.filename}: ${baseUrl}/uploads/${encodeURIComponent(attachment.filename)}`)
        .join('\n')

      const subject = encodeURIComponent(`Файлы из тикета #${ticketNumber.value}`)
      const body = encodeURIComponent(`📎 Файлы из тикета #${ticketNumber.value}\n\n${fileLinks}`)

      window.open(`https://e.mail.ru/compose/?mailto=&subject=${subject}&body=${body}`, '_blank')
    }
    catch (err) {
      console.error('Error sharing to Mail:', err)
    }
  }

  // Поделиться по email
  const shareToEmail = async () => {
    if (attachments.value.length === 0)
      return

    try {
      const baseUrl = window.location.origin

      const fileLinks = attachments.value
        .map(attachment => `${attachment.filename}: ${baseUrl}/uploads/${encodeURIComponent(attachment.filename)}`)
        .join('\n')

      const subject = encodeURIComponent(`Файлы из тикета #${ticketNumber.value}`)
      const body = encodeURIComponent(`📎 Файлы из тикета #${ticketNumber.value}\n\n${fileLinks}`)

      window.location.href = `mailto:?subject=${subject}&body=${body}`
    }
    catch (err) {
      console.error('Error sharing to Email:', err)
    }
  }

  return {
    shareToTelegram,
    shareToMail,
    shareToEmail,
  }
}
