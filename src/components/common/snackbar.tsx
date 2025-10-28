import { IconButton } from '@mui/material'
import {
  OptionsObject,
  SnackbarKey,
  SnackbarMessage,
  useSnackbar,
} from 'notistack'
import React, { createContext, ReactNode, useCallback, useContext } from 'react'

import Icons from './icons/index'

// Define a type for the context value
interface ISnackbarManagerContext {
  enqueueSnackbar: (
    message: SnackbarMessage,
    options?: OptionsObject
  ) => SnackbarKey
}

// Create a context with an initial undefined value but assert the type
const SnackbarManagerContext = createContext<
  ISnackbarManagerContext | undefined
>(undefined)

// Custom hook to use the SnackbarManagerContext
export const useSnackbarManager = (): ISnackbarManagerContext => {
  const context = useContext(SnackbarManagerContext)
  if (!context) {
    throw new Error(
      'useSnackbarManager must be used within a SnackbarManagerProvider'
    )
  }
  return context
}

interface SnackbarManagerProviderProps {
  children: ReactNode
}

export const SnackbarManagerProvider: React.FC<
  SnackbarManagerProviderProps
> = ({ children }) => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar()
  const onClickDismiss = (key: any) => () => {
    closeSnackbar(key)
  }
  const customEnqueueSnackbar = useCallback(
    (message: SnackbarMessage, options: OptionsObject = {}): SnackbarKey => {
      // Extend the onClose function to include global onClose logic

      return enqueueSnackbar(message, {
        ...options,
        action: (key) => (
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={onClickDismiss(key)}
          >
            <Icons name="close" />
          </IconButton>
        ),
      }) // Ensure we return the SnackbarKey
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enqueueSnackbar]
  )

  return (
    <SnackbarManagerContext.Provider
      value={{ enqueueSnackbar: customEnqueueSnackbar }}
    >
      {children}
    </SnackbarManagerContext.Provider>
  )
}
