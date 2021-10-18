import client from './apiClient'

export const getFeedbacks = () =>
  client.get('/admin/feedback').then((res) => res.data)

export const getFeedbackByCode = ({ queryKey }) =>
  client.get(`/admin/feedback/${queryKey[1]}`).then((res) => res.data)

export const createFeedback = (payload) =>
  client.post('/admin/feedback', payload).then((res) => res.data)

export const updateFeedback = (code: string, payload) =>
  client.patch(`/admin/feedback/${code}`, payload).then((res) => res.data)

export const deleteFeedback = (code: string) =>
  client.delete(`/admin/feedback/${code}`).then((res) => res.data)

export const deleteResponse = (responseId: string) => {
  client.delete(`/admin/response/${responseId}`).then((res) => res.data)
}

export const getFeedbackeponses = (code, params) => {
  const option = {}

  if (params?.type && params?.value) {
    option['params'] = params
  }

  return client
    .get(`/admin/feedback/${code}/response`, option)
    .then((res) => res.data)
}

export const exportFeedbackResponse = (code: string) => {
  return client
    .get(`/admin/feedback/${code}/response/export`, {
      responseType: 'arraybuffer'
    })
    .then((response) => {
      const filename = decodeURI(
        response.headers?.['content-disposition'].split('filename=')[1]
      )

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(`/admin/feedback/${code}/response/export`)
    })
}