import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  deleteData,
  getData,
  postData,
  updateData,
} from '../../apis/api.helpers'
import apiUrl from '../../apis/api.url'
import { QueryParams } from '../../common/types'
import { useSnackbarManager } from '../../components/common/snackbar'
import { getErrorMessage, parseQueryParams } from '../../utilities/parsers'

const QUERY_KEY = 'assessment_categories_list'

const buildUrlWithParams = (baseUrl: string, params: QueryParams) => {
  return `${baseUrl}${parseQueryParams(params)}`
}

const fetchAssessmentCategories = async (input: QueryParams) => {
  const url = buildUrlWithParams(apiUrl.ASSESSSMENT_CATEGORY, { ...input })
  return getData(url)
}

export const useAssessmentCategories = (input: QueryParams) => {
  return useQuery([QUERY_KEY, input], () => fetchAssessmentCategories(input))
}

export const createAssessmentCategory = (payload: any) => {
  return postData(apiUrl.ASSESSSMENT_CATEGORY, payload)
}

export const getAssessmentCategoryDetails = (id: string | number) => {
  return getData(`${apiUrl.ASSESSSMENT_CATEGORY}/${id}`)
}

export const updateAssessmentCategory = (id: string | number, payload: any) => {
  return updateData(`${apiUrl.ASSESSSMENT_CATEGORY}/${id}`, payload)
}

export const deleteAssessmentCategory = (id: string | number) => {
  return deleteData(`${apiUrl.ASSESSSMENT_CATEGORY}/${id}`)
}

const getApiMessage = (error: any, fallback: string) => {
  const errors = error?.response?.data?.errors
  if (Array.isArray(errors) && errors.length > 0) return errors.join(', ')
  if (typeof errors === 'string' && errors.trim()) return errors
  return error?.response?.data?.message || getErrorMessage(error) || fallback
}

export const useCreateAssessmentCategory = () => {
  const { enqueueSnackbar } = useSnackbarManager()
  const queryClient = useQueryClient()

  return useMutation(createAssessmentCategory, {
    onSuccess: (res: any) => {
      enqueueSnackbar(
        res?.message || 'Assessment category created successfully',
        {
          variant: 'success',
        }
      )
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
    onError: (error: any) => {
      enqueueSnackbar(
        getApiMessage(error, 'Failed to create assessment category'),
        {
          variant: 'error',
        }
      )
    },
  })
}

export const useUpdateAssessmentCategory = () => {
  const { enqueueSnackbar } = useSnackbarManager()
  const queryClient = useQueryClient()

  return useMutation(
    ({ id, payload }: { id: string | number; payload: any }) =>
      updateAssessmentCategory(id, payload),
    {
      onSuccess: (res: any) => {
        enqueueSnackbar(
          res?.message || 'Assessment category updated successfully',
          {
            variant: 'success',
          }
        )
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
      },
      onError: (error: any) => {
        enqueueSnackbar(
          getApiMessage(error, 'Failed to update assessment category'),
          {
            variant: 'error',
          }
        )
      },
    }
  )
}

export const useDeleteAssessmentCategory = () => {
  const { enqueueSnackbar } = useSnackbarManager()
  const queryClient = useQueryClient()

  return useMutation(deleteAssessmentCategory, {
    onSuccess: (res: any) => {
      enqueueSnackbar(
        res?.message || 'Assessment category deleted successfully',
        {
          variant: 'success',
        }
      )
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] })
    },
    onError: (error: any) => {
      enqueueSnackbar(
        getApiMessage(error, 'Failed to delete assessment category'),
        {
          variant: 'error',
        }
      )
    },
  })
}
