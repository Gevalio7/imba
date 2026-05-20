import { ref } from 'vue'
import { $api } from '@/utils/api'

export function useTicketComments(ticketId: Ref<number | null>) {
  const userData = useCookie<any>('userData')

  const comments = ref<any[]>([])
  const newComment = ref('')
  const isInternalComment = ref(false)
  const savingComment = ref(false)
  const editingCommentId = ref<number | null>(null)
  const editingCommentContent = ref('')
  const deletingCommentId = ref<number | null>(null)
  const showDeleteDialog = ref(false)

  // Загрузка комментариев
  const fetchComments = async () => {
    if (!ticketId.value)
      return

    try {
      const data = await $api(`/ticketComments?ticketId=${ticketId.value}`)

      comments.value = (data as any).comments || []
    }
    catch (err) {
      console.error('Error fetching comments:', err)
    }
  }

  // Добавление комментария
  const addComment = async () => {
    if (!newComment.value.trim() || !ticketId.value)
      return

    try {
      savingComment.value = true
      await $api('/ticketComments', {
        method: 'POST',
        body: {
          ticketId: ticketId.value,
          content: newComment.value,
          isInternal: isInternalComment.value,
          authorId: userData.value?.id || null,
        },
      })
      newComment.value = ''
      await fetchComments()
    }
    catch (err) {
      console.error('Error adding comment:', err)
    }
    finally {
      savingComment.value = false
    }
  }

  // Редактирование комментария
  const startEditComment = (comment: any) => {
    editingCommentId.value = comment.id
    editingCommentContent.value = comment.content
  }

  const cancelEditComment = () => {
    editingCommentId.value = null
    editingCommentContent.value = ''
  }

  const saveEditComment = async (commentId: number) => {
    if (!editingCommentContent.value.trim())
      return

    try {
      await $api(`/ticketComments/${commentId}`, {
        method: 'PUT',
        body: { content: editingCommentContent.value },
      })
      editingCommentId.value = null
      editingCommentContent.value = ''
      await fetchComments()
    }
    catch (err) {
      console.error('Error updating comment:', err)
    }
  }

  // Удаление комментария
  const confirmDeleteComment = (commentId: number) => {
    deletingCommentId.value = commentId
    showDeleteDialog.value = true
  }

  const deleteComment = async () => {
    if (!deletingCommentId.value)
      return

    try {
      await $api(`/ticketComments/${deletingCommentId.value}`, {
        method: 'DELETE',
      })
      showDeleteDialog.value = false
      deletingCommentId.value = null
      await fetchComments()
    }
    catch (err) {
      console.error('Error deleting comment:', err)
    }
  }

  return {
    comments,
    newComment,
    isInternalComment,
    savingComment,
    editingCommentId,
    editingCommentContent,
    deletingCommentId,
    showDeleteDialog,
    fetchComments,
    addComment,
    startEditComment,
    cancelEditComment,
    saveEditComment,
    confirmDeleteComment,
    deleteComment,
  }
}
