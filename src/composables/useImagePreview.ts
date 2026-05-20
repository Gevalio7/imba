import { ref } from 'vue'

export function useImagePreview() {
  const imagePreview = ref<{ show: boolean; src: string; filename: string }>({
    show: false,
    src: '',
    filename: '',
  })

  const imageZoom = ref(100)

  // Открыть превью изображения
  const openPreview = (attachment: any) => {
    imagePreview.value = {
      show: true,
      src: `/uploads/${attachment.filename}`,
      filename: attachment.filename,
    }
  }

  // Закрыть превью
  const closePreview = () => {
    imagePreview.value.show = false
    imageZoom.value = 100 // Сбрасываем зум при закрытии
  }

  // Увеличить изображение
  const zoomIn = () => {
    if (imageZoom.value < 300)
      imageZoom.value += 25
  }

  // Уменьшить изображение
  const zoomOut = () => {
    if (imageZoom.value > 25)
      imageZoom.value -= 25
  }

  // Сбросить зум
  const resetZoom = () => {
    imageZoom.value = 100
  }

  // Скачать изображение
  const downloadImage = async () => {
    try {
      const response = await fetch(imagePreview.value.src)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = imagePreview.value.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }
    catch (err) {
      console.error('Error downloading image:', err)
    }
  }

  // Напечатать изображение
  const printImage = () => {
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${imagePreview.value.filename}</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
              img { max-width: 100%; max-height: 100vh; }
              @media print { body { display: block; } img { max-width: 100%; max-height: none; } }
            </style>
          </head>
          <body>
            <img src="${imagePreview.value.src}" alt="${imagePreview.value.filename}">
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  return {
    imagePreview,
    imageZoom,
    openPreview,
    closePreview,
    zoomIn,
    zoomOut,
    resetZoom,
    downloadImage,
    printImage,
  }
}
