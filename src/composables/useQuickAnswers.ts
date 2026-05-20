import { computed, ref } from 'vue'
import { $api } from '@/utils/api'
import type { Article } from '@/types/ticket'

export function useQuickAnswers(queue: Ref<any>) {
  const quickAnswerArticles = ref<Article[]>([])
  const loadingQuickAnswers = ref(false)
  const showDialog = ref(false)

  const loadQuickAnswers = async () => {
    if (!queue.value?.quickAnswerArticleIds || queue.value.quickAnswerArticleIds.length === 0) {
      // For demo purposes, load some sample quick answers
      quickAnswerArticles.value = [
        {
          id: 1,
          title: 'Приветствие',
          content: 'Здравствуйте! Спасибо за обращение. Мы рассмотрим вашу заявку в ближайшее время.',
        },
        {
          id: 2,
          title: 'Запрос дополнительной информации',
          content: 'Для более точного решения проблемы нам потребуется дополнительная информация. Пожалуйста, предоставьте следующие данные:',
        },
        {
          id: 3,
          title: 'Уведомление о решении',
          content: 'Ваша заявка успешно обработана. Проблема решена. Если у вас возникнут дополнительные вопросы, пожалуйста, обращайтесь.',
        },
      ]

      return
    }

    try {
      loadingQuickAnswers.value = true

      const ids = queue.value.quickAnswerArticleIds
      const data = await $api('/knowledge-base')
      const allArticles = (data as any).articles || []

      quickAnswerArticles.value = allArticles.filter((a: any) => ids.includes(a.id))
    }
    catch (err) {
      console.error('Error loading quick answers:', err)

      // Fallback to demo data
      quickAnswerArticles.value = [
        {
          id: 1,
          title: 'Приветствие',
          content: 'Здравствуйте! Спасибо за обращение. Мы рассмотрим вашу заявку в ближайшее время.',
        },
      ]
    }
    finally {
      loadingQuickAnswers.value = false
    }
  }

  const insertQuickAnswer = (article: Article) => {
    // Эта функция должна взаимодействовать с редактором комментариев
    // Реализация будет в компоненте, использующем этот composable
    return article.content
  }

  const openQuickAnswersDialog = () => {
    showDialog.value = true
    if (quickAnswerArticles.value.length === 0)
      loadQuickAnswers()
  }

  const closeQuickAnswersDialog = () => {
    showDialog.value = false
  }

  return {
    quickAnswerArticles,
    loadingQuickAnswers,
    showDialog,
    loadQuickAnswers,
    insertQuickAnswer,
    openQuickAnswersDialog,
    closeQuickAnswersDialog,
  }
}
