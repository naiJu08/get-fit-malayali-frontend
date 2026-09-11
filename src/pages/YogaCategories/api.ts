import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import {
  getData,
  postData,
  deleteData,
  updateData,
} from '../../apis/api.helpers'
import apiUrl from '../../apis/api.url'
import { QueryParams } from '../../common/types'
import { useSnackbarManager } from '../../components/common/snackbar'
import { getErrorMessage, parseQueryParams } from '../../utilities/parsers'

const buildUrlWithParams = (baseUrl: string, params: QueryParams) => {
  return `${baseUrl}${parseQueryParams(params)}`
}

const fetchData = async (input: QueryParams) => {
  const url = buildUrlWithParams(apiUrl.CATEGORIES, {
    category_type: 'yoga',
    ...input,
  })
  const response = await getData(url)
  return response
}

export const useYogaCategoriesList = (input: QueryParams) => {
  return useQuery(['yoga_categories_list', input], () => fetchData(input))
}

export const getYogaSubCategories = (parentId: string | number) => {
  return getData(`${apiUrl.CATEGORIES}/${parentId}`)
}

export const getYogaPlanSubcategories = async (parentId?: string | number) => {
  if (!parentId) return []
  const detail: any = await getData(`${apiUrl.CATEGORIES}/${parentId}`)
  const container =
    detail?.category ?? detail?.data?.category ?? detail?.data ?? detail
  const subs: any[] = container?.subcategories || container?.subcategory || []
  const rawCatName = container?.name ?? ''
  const catName = rawCatName
    ? rawCatName.charAt(0).toUpperCase() + rawCatName.slice(1).toLowerCase()
    : ''

  return (Array.isArray(subs) ? subs : []).map((sub: any) => {
    const rawSubName = sub?.name ?? sub?.value ?? ''
    const subName = rawSubName
      ? rawSubName.charAt(0).toUpperCase() + rawSubName.slice(1).toLowerCase()
      : ''
    const formattedValue =
      catName && subName ? `${catName} - ${subName}` : subName
    return {
      id: sub?.id,
      value: formattedValue,
      subName,
      catName,
      categoryId: parentId,
    }
  })
}

export const getYogaCategoriesDetails = (id: string) => {
  return getData(`${apiUrl.CATEGORIES}/${id}`)
}

export const deleteYogaCategories = (id: string | number) => {
  return deleteData(`${apiUrl.CATEGORIES}/${id}`)
}

export const createYogaCategories = (input: any) => {
  const payload = {
    ...input,
    category_type: 'yoga',
    category: {
      ...(input?.category || input),
      category_type: 'yoga',
    },
  }
  return postData(`${apiUrl.CATEGORIES}`, payload)
}

export const useCreateYogaCategories = (
  handleSubmission: (data: any) => void,
  successMessage = 'Yoga category created successfully'
) => {
  const { enqueueSnackbar } = useSnackbarManager()
  const queryClient = useQueryClient()
  return useMutation(createYogaCategories, {
    onSuccess: (res: any) => {
      queryClient.invalidateQueries(['yoga_categories_list'])
      queryClient.invalidateQueries(['yoga-filter-categories'])
      queryClient.invalidateQueries(['yoga_categories_for_assign'])
      handleSubmission(res)
      enqueueSnackbar(successMessage, { variant: 'success' })
    },

    onError: (error: any) => {
      const serverError =
        error?.response?.data?.errors ??
        error?.response?.data?.detail ??
        error?.response?.data?.message ??
        error?.response?.error ??
        error

      enqueueSnackbar(getErrorMessage(serverError), {
        variant: 'error',
      })
    },
  })
}

export const updateYogaCategories = ({ id, data }: any) => {
  const payload = {
    ...data,
    category_type: 'yoga',
    category: {
      ...(data?.category || data),
      category_type: 'yoga',
    },
  }
  return updateData(`${apiUrl.CATEGORIES}/${id}`, payload)
}

export const useUpdateYogaCategories = (
  handleSubmission: (data: any) => void,
  successMessage = 'Yoga category updated successfully'
) => {
  const { enqueueSnackbar } = useSnackbarManager()
  const queryClient = useQueryClient()
  return useMutation(updateYogaCategories, {
    onSuccess: (res: any) => {
      queryClient.invalidateQueries(['yoga_categories_list'])
      queryClient.invalidateQueries(['yoga-filter-categories'])
      queryClient.invalidateQueries(['yoga_categories_for_assign'])
      handleSubmission(res)
      enqueueSnackbar(successMessage, { variant: 'success' })
    },

    onError: (error: any) => {
      const serverError =
        error?.response?.data?.errors ??
        error?.response?.data?.detail ??
        error?.response?.data?.message ??
        error?.response?.error ??
        error

      enqueueSnackbar(getErrorMessage(serverError), {
        variant: 'error',
      })
    },
  })
}
