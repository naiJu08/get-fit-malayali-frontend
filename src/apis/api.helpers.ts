import serverApi from './core'
import { AxiosRequestConfig } from 'axios'

export const getData = (url: string) =>
  serverApi.get(url).then((res) => res.data)

export const downloadData = (url: string) =>
  serverApi
    .get(url, {
      responseType: 'blob', // Treat the response as a Blob
    })
    .then((res) => res.data)

export const getConfigData = (url: string, config?: AxiosRequestConfig) =>
  serverApi.get(url, config).then((res) => res?.data)

export const postData = (url: string, params: any) =>
  serverApi.post(url, params).then((res) => res.data)

export const postFormData = (url: string, data: any) =>
  serverApi.post(url, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
export const patchFormData = (url: string, data: any) =>
  serverApi.patch(url, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
export const updateFromData = (url: string, data: any) =>
  serverApi.put(url, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const updateData = (url: string, params: any) =>
  serverApi.put(url, params).then((res) => res.data)
export const patchData = (url: string, params: any) =>
  serverApi.patch(url, params).then((res) => res.data)

export const deleteData = (url: string) =>
  serverApi.delete(url).then((res) => res.data)
