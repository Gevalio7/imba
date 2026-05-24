import { ref, type Ref } from 'vue'
import { $api } from '@/utils/api'
import type { Article } from '@/types/ticket'

export function useQuickAnswers(queue: Ref<any>) {
  const quickAnswerArticles = ref<Article[]>([])
  const loadingQuickAnswers = ref(false)
  const showDialog = ref(false)

  const loadQuickAnswers = async () => {
    const ids = queue.value?.quickAnswerArticleIds

    if (!ids || ids.length === 0) {
      quickAnswerArticles.value = []
      return
    }

    try {
      loadingQuickAnswers.value = true

      // Используем batch endpoint (один запрос вместо N)
      const data = await $api<{ articles: Article[] }>('/knowledge-base/by-filters', {
        params: { ids: ids.join(',') },
      })

      quickAnswerArticles.value = data.articles || []
    }
    catch (err) {
      console.error('Error loading quick answers:', err)
      quickAnswerArticles.value = []
    }
    finally {
      loadingQuickAnswers.value = false
    }
  }

  const insertQuickAnswer = (article: Article) => {
    // Возвращаем очищенный текст (без HTML), чтобы его можно было редактировать в поле комментария.
    // Оригинальная статья в Базе знаний не меняется.
    if (!article.content) return ''

    const tmp = document.createElement('div')
    tmp.innerHTML = article.content
    return tmp.textContent || tmp.innerText || article.content
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
