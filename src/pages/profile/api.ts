import { useMutation, useQuery } from '@tanstack/react-query'
import { AxiosError, AxiosResponse } from 'axios'

import { getData, updateData, updateFromData } from '../../apis/api.helpers'
import apiUrl from '../../apis/api.url'
import { QueryParams } from '../../common/types'
import { useSnackbarManager } from '../../components/common/snackbar'
import { getErrorMessage, parseQueryParams } from '../../utilities/parsers'

// import { update } from 'lodash'

const buildUrlWithParams = (baseUrl: string, params: any) => {
  return `${baseUrl}${parseQueryParams(params)}`
}

const fetchData = async (input: QueryParams) => {
  //  const url = input.currentDomain !== "Organisation" ? buildUrlWithParams(apiUrl.MY_PROFILE, {
  //     ...input,
  //   }): `contact`
  //   const response = await getData(url)
  //   return response
  let url = ''
  if (input.currentDomain !== 'Organisation') {
    url = buildUrlWithParams(apiUrl.MY_PROFILE, {
      ...input,
    })
    const response = await getData(url)
    return response
  } else {
    url = `contact`
    const response = await getData(url)
    return response[0]
  }
}

export const useAssessor = (input: QueryParams) => {
  return useQuery(['my_profile', input], () => fetchData(input), {
    // refetchOnWindowFocus: true,
    //staleTime: 50000,
  })
}

export const editMyProfile = (data: { input: any; domain: any }) => {
  if (data?.domain?.domain == 'Organisation') {
    return updateData(`my-profile`, data?.input)
  } else return updateData(`${apiUrl.MY_PROFILE}`, data?.input)
}

export const useEditMyProfile = (handleSubmission: (input: any) => void) => {
  const { enqueueSnackbar } = useSnackbarManager()

  return useMutation(editMyProfile, {
    onSuccess: (res: AxiosResponse | any) => {
      handleSubmission(res.data)
      enqueueSnackbar('Profile updated successfully', {
        variant: 'success',
      })
    },

    onError: (error: AxiosError | any) => {
      enqueueSnackbar(getErrorMessage(error?.response?.data?.detail), {
        variant: 'error',
      })
    },
  })
}

export const changePassword = (data: any) => {
  return updateData(`change_password`, data)
}

export const updateProfileAttachment = (input: any) => {
  return updateFromData(`${apiUrl.MY_PROFILE_IMAGE}`, input)
}
