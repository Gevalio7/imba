import { ref } from 'vue'
import { $api } from '@/utils/api'

export function useTicketAttachments(ticketId: Ref<number | null>) {
  const existingAttachments = ref<any[]>([])
  const newAttachments = ref<File[]>([])

  // Загрузка вложений тикета
  const fetchAttachments = async () => {
    if (!ticketId.value)
      return

    try {
      const data = await $api(`/ticketAttachments?ticketId=${ticketId.value}`)

      existingAttachments.value = (data as any).attachments || []
    }
    catch (err) {
      console.error('Error fetching attachments:', err)
    }
  }

  // Загрузка новых вложений
  const uploadNewAttachments = async () => {
    for (const file of newAttachments.value) {
      const formData = new FormData()

      formData.append('file', file)
      formData.append('ticketId', ticketId.value!.toString())

      await $api('/ticketAttachments', {
        method: 'POST',
        body: formData,
      })
    }
  }

  // Удаление вложения
  const deleteAttachment = async (attachmentId: number) => {
    try {
      await $api(`/ticketAttachments/${attachmentId}`, {
        method: 'DELETE',
      })
      await fetchAttachments()
    }
    catch (err) {
      console.error('Error deleting attachment:', err)
    }
  }

  // Скачивание одного вложения
  const downloadAttachment = async (attachment: any) => {
    try {
      const link = document.createElement('a')

      link.href = `/uploads/${attachment.filename}`
      link.download = attachment.filename
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
    catch (err) {
      console.error('Error downloading attachment:', err)
    }
  }

  // Скачивание всех вложений
  const downloadAllAttachments = async () => {
    if (existingAttachments.value.length === 0)
      return

    try {
      for (const attachment of existingAttachments.value) {
        // Небольшая задержка между скачиваниями
        await new Promise(resolve => setTimeout(resolve, 300))

        const link = document.createElement('a')

        link.href = `/uploads/${attachment.filename}`
        link.download = attachment.filename
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    }
    catch (err) {
      console.error('Error downloading all attachments:', err)
    }
  }

  // Обработка выбора файлов
  const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement
    if (target.files)
      newAttachments.value = [...newAttachments.value, ...Array.from(target.files)]
  }

  // Удаление нового вложения
  const removeNewAttachment = (index: number) => {
    newAttachments.value.splice(index, 1)
  }

  return {
    existingAttachments,
    newAttachments,
    fetchAttachments,
    uploadNewAttachments,
    deleteAttachment,
    downloadAttachment,
    downloadAllAttachments,
    handleFileSelect,
    removeNewAttachment,
  }
}
