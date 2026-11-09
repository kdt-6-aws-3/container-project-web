export const formatDate = (date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')

export const today = () => formatDate(new Date())

export const fullName = (person) => person?.name || ''

export const errorText = (error) =>
  error instanceof Error ? error.message : '요청을 처리하지 못했습니다.'
