import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button, DialogModal } from '../../../components/common'
import Icons from '../../../components/common/icons'
import { useSnackbarManager } from '../../../components/common/snackbar'
import { changePassword } from '../api'
import { resetSchema, ResetSchema } from './changePasswordSchema'

const fixedInputClass =
  'rounded appearance-none relative block w-full px-3 py-2 border border-formBorder placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-purple-500 focus:border-gray-300 focus:z-10 sm:text-sm'

type Props = {
  isOpen: boolean
  handleClose: () => void
  empId?: any
}
const ChangePassword = ({ isOpen, handleClose, empId }: Props) => {
  // const navigate = useNavigate()
  const [loader, setLoader] = useState(false)

  const onClose = () => {
    setShowPassword({
      password: false,
      confirm_password: false,
    })
    reset()
    handleClose()
  }
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
  } = useForm<ResetSchema>({
    mode: 'onChange',
    resolver: zodResolver(resetSchema),
    defaultValues: { old_password: '', password: '', confirm_password: '' },
  })

  const { enqueueSnackbar } = useSnackbarManager()

  const onSubmit = (datas: any, e: any) => {
    setLoader(true)
    e?.preventDefault()
    changePassword({
      new_password: datas?.password,
      confirm_password: datas?.confirm_password,
      old_password: datas?.old_password,
      employee: empId,
    })
      .then(() => {
        setLoader(false)
        onClose()
        enqueueSnackbar('Password changed successfully', { variant: 'success' })
      })
      .catch((error) => {
        // getErrorMessage(error?.response.data.error)
        enqueueSnackbar(error?.response.data.message, {
          variant: 'error',
        })
        setLoader(false)
      })
  }
  // useEffect(() => {
  //   if (
  //     methods.watch().password &&
  //     methods.watch().confirm_password &&
  //     methods.watch().password !== '' &&
  //     methods.watch().confirm_password !== ''
  //   ) {
  //     if (methods.watch().password !== methods.watch().confirm_password) {
  //       methods.setError('confirm_password', {
  //         type: 'custom',
  //         message: 'Password does not match',
  //       })
  //     } else {
  //       methods.clearErrors('confirm_password')
  //     }
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [methods.watch().password])
  // const [showPassword, setShowPassword] = useState(false)
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirm_password: false,
  })

  useEffect(() => {
    return () => {
      reset({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <>
      <DialogModal
        isOpen={isOpen}
        onClose={onClose}
        title="Change Password"
        secondaryAction={onClose}
        actionLoader={false}
        body={
          <form
            onSubmit={(e) => handleSubmit(onSubmit)(e)}
            noValidate
            autoComplete="off"
          >
            <div className="flex flex-col gap-4 ">
              <div className="">
                <label className="labels label-text" htmlFor={'old_password'}>
                  Old Password
                </label>
                <div className="relative">
                  <input
                    id={'old_password'}
                    required={true}
                    className={fixedInputClass}
                    placeholder={'Enter Password'}
                    autoComplete="new-password"
                    {...register('old_password')}
                  />
                </div>
                {errors.password && (
                  <div className="text-xs text-red-500">
                    {errors?.old_password?.message as string}
                  </div>
                )}
              </div>
              <div className="">
                <label className="labels label-text" htmlFor={'password'}>
                  New Password
                </label>
                <div className="relative">
                  <input
                    id={'password'}
                    type={showPassword.password ? 'text' : 'password'}
                    required={true}
                    className={fixedInputClass}
                    placeholder={'Enter Password'}
                    autoComplete="new-password"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-2.5 z-10"
                    onClick={() =>
                      setShowPassword({
                        ...showPassword,
                        password: !showPassword.password,
                      })
                    }
                  >
                    {showPassword.password ? (
                      <Icons name="eye" />
                    ) : (
                      <Icons name="eye-close" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <div className="text-xs text-red-500">
                    {errors?.password?.message as string}
                  </div>
                )}
              </div>
              <div className="">
                <label
                  className="labels label-text"
                  htmlFor={'confirm_password'}
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id={'confirm_password'}
                    type={showPassword.confirm_password ? 'text' : 'password'}
                    required={true}
                    className={fixedInputClass}
                    placeholder={'Confirm Password'}
                    autoComplete="new-password"
                    {...register('confirm_password')}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-2.5 z-10"
                    onClick={() =>
                      setShowPassword({
                        ...showPassword,
                        confirm_password: !showPassword.confirm_password,
                      })
                    }
                  >
                    {showPassword.confirm_password ? (
                      <Icons name="eye" />
                    ) : (
                      <Icons name="eye-close" />
                    )}
                  </button>
                </div>
                {errors.confirm_password && (
                  <div className="text-xs text-red-500">
                    {errors?.confirm_password?.message as string}
                  </div>
                )}
              </div>
              <div className="flex flex-col py-5">
                <div className=" flex flex-row items-end gap-2 w-full justify-end ">
                  <Button
                    label="Cancel"
                    outlined={true}
                    primary={false}
                    onClick={onClose}
                  />

                  <Button
                    label="Submit"
                    type="submit"
                    className="bg-primary"
                    isLoading={loader}
                  />
                </div>
              </div>
            </div>
          </form>
        }
      />
    </>
  )
}
export default ChangePassword
