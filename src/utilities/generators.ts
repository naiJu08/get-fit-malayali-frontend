export const statusClassGen = (value: string): string => {
  let className = ''
  if (value && value !== '') {
    className = value?.toLowerCase().replaceAll(' ', '')
  }

  if (
    className.includes('inprogress') ||
    className.includes('processing') ||
    className.includes('collectionstage') ||
    className.includes('onprocess')
  ) {
    className = 'inprogress'
  }
  if (
    className.includes('pending') ||
    className.includes('await') ||
    className.includes('hold') ||
    className.includes('queue') ||
    className.includes('inque')
  ) {
    className = 'pending'
  }
  if (className.includes('not') || className.includes('dropped')) {
    className = 'inactive'
  }
  if (
    className.includes('allow') ||
    className.includes('allotted') ||
    className.includes('approval') ||
    className.includes('completed')
  ) {
    className = 'active'
  }

  return className
}
