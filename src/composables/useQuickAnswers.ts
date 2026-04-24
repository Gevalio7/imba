import { $api } from '@/utils/api'
import { ref, computed } from 'vue'
import type { Article } from '@/types/ticket'

export function useQuickAnswers(queue: Ref<any>) {
  const quickAnswerArticles = ref<Article[]>([])
  const loadingQuickAnswers = ref(false)
  const showDialog = ref(false)

  const loadQuickAnswers = async () => {
    if (!queue.value?.quickAnswerArticleIds || queue.value.quickAnswerArticleIds.length === 0) {
      quickAnswerArticles.value = []
      return
    }

    try {
      loadingQuickAnswers.value = true
      const ids = queue.value.quickAnswerArticleIds
      const data = await $api('/knowledge-base')
      const allArticles = (data as any).articles || []
      quickAnswerArticles.value = allArticles.filter((a: any) => ids.includes(a.id))
    } catch (err) {
      console.error('Error loading quick answers:', err)
      quickAnswerArticles.value = []
    } finally {
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
    if (quickAnswerArticles.value.length === 0) {
      loadQuickAnswers()
    }
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