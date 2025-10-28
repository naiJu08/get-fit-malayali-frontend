export const handleError = (err: any) => {
  const HTTP_NOT_FOUND = 404
  const HTTP_403_FORBIDDEN = 403
  if (err?.response?.status === HTTP_NOT_FOUND) {
    window.location.href = '/dashboard'
  } else if (err?.response?.status === HTTP_403_FORBIDDEN) {
    return false
  } else {
    return true
  }
}

export const getFileNameFromUrl = (url: any) => {
  const urlObj = new URL(url)
  const pathSegments = urlObj.pathname.split('/')
  const fileNameWithExtension = pathSegments[pathSegments.length - 1]

  // Decode any URL-encoded characters in the file name
  const decodedFileName = decodeURIComponent(fileNameWithExtension)

  return decodedFileName
}

export const downloadFromServer = async (link: string, name?: string) => {
  if (link) {
    try {
      const response = await fetch(link, {
        headers: new Headers({
          Origin: window.location.origin,
        }),
        mode: 'cors',
      })

      if (!response.ok) throw new Error('Network response was not ok.')

      const blob = await response.blob()

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name ?? getFileNameFromUrl(link)
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }
}

export const generateFileExtension = (file: string) => {
  return file.split('.').pop()
}

export const isValidFile = (file?: string, support?: string[]) => {
  if (file && support) {
    return support.some(
      (format: string) => format.toLowerCase() === file.toLowerCase()
    )
  }
  return false
}

export const handleDownload = (full_url: string, file_name: string) => {
  if (!full_url) {
    console.error('Invalid file url')
    return
  }
  if (!file_name) {
    console.error('Invalid file name')
    return
  }
  const fileName = file_name.split('/').pop() ?? file_name
  // const fileExtension = fileName.split('.').pop().toLowerCase()

  fetch(full_url)
    .then((response) => {
      if (!response) {
        throw new Error('Error')
      }
      return response.blob()
    })
    .then((blob) => {
      const url = URL.createObjectURL(blob)

      // if (fileExtension === 'pdf') {
      //   window.open(url, '_blank')
      // } else {
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      // }

      URL.revokeObjectURL(url)
    })
    .catch((error) => {
      console.error('Error:', error)
    })
}

export const handleViewFile = (full_url: any, file_name: any) => {
  if (full_url && file_name) {
    const fileExtension = file_name.split('.').pop().toLowerCase()
    const viewableExtensions = [
      'jpg',
      'jpeg',
      'png',
      'gif',
      'bmp',
      'webp',
      'pdf',
    ]
    const officeExtensions = ['doc', 'docx']

    if (viewableExtensions.includes(fileExtension)) {
      window.open(full_url, '_blank')
    } else if (officeExtensions.includes(fileExtension)) {
      const googleDocsViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(full_url)}`
      window.open(googleDocsViewerUrl, '_blank')
    }
  }
}
