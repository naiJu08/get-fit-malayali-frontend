import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import {
  updateAdminPassword,
  updateAssessorPassword,
} from '../../../apis/common.apis'
import { Button, DialogModal } from '../../../components/common'
import { useSnackbarManager } from '../../../components/common/snackbar'
import { getErrorMessage } from '../../../utilities/parsers'
import { useAuthStore } from '../../../store/authStore'
import Icons from '../../common/icons'

type Props = {
  changePassword: boolean
  setChangePassword: (changePassword: boolean) => void
  userId: string
  setUserId: (userId: string) => void
  userName: string
  setUserName: (userName: string) => void
  from: string
}
const fixedInputClass =
  'rounded appearance-none relative block w-full px-3 py-2 border border-formBorder placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-purple-500 focus:border-gray-300 focus:z-10 sm:text-sm'

const PASSWORD_MESSAGE =
  'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character, minimum 8 characters.'

const ResetPassword = ({
  from,
  userName,
  setUserName,
  userId,
  setUserId,
  changePassword,
  setChangePassword,
}: Props) => {
  const { enqueueSnackbar } = useSnackbarManager()
  const navigate = useNavigate()
  const clearAuth = useAuthStore((s) => s.clearAuthenticated)

  const [showPassword, setShowPassword] = useState({
    new_password: false,
  })
  const [loader, setloader] = useState(false)

  const handleResetPassword = () => {
    setChangePassword(true)
    setUserId(userId)
    setUserName(userName)
  }
  useEffect(() => {
    changePassword && handleResetPassword()
  }, [changePassword])

  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    watch,
  } = useForm<any>({
    mode: 'onChange',
    defaultValues: { new_password: '' },
  })

  const passwordValue = watch('new_password', '')
  const passwordChecks = [
    {
      label: 'At least one uppercase letter',
      test: (v: string) => /[A-Z]/.test(v),
    },
    {
      label: 'At least one lowercase letter',
      test: (v: string) => /[a-z]/.test(v),
    },
    { label: 'At least one number', test: (v: string) => /\d/.test(v) },
    {
      label: 'At least one special character',
      test: (v: string) => /[`~<>?,./!@#$%^&*()\-_=+"'\|{}\[\];:\\]/.test(v),
    },
    { label: 'Minimum 8 characters', test: (v: string) => v.length >= 8 },
  ]
  const onSubmit = (datas: any, e: any) => {
    setloader(true)
    e?.preventDefault()
    const func = from == 'Admin' ? updateAdminPassword : updateAssessorPassword
    func(userId, datas)
      .then(() => {
        handleResetPasswordClose()
        enqueueSnackbar('Password changed successfully', {
          variant: 'success',
        })
        clearAuth()
        navigate('/login', { replace: true })
      })
      .catch((error) => {
        enqueueSnackbar(getErrorMessage(error?.response.data.error), {
          variant: 'error',
        })
      })
  }
  const handleResetPasswordClose = () => {
    setloader(false)
    reset({ new_password: '' })
    setChangePassword(false)
  }
  return (
    <DialogModal
      isOpen={changePassword}
      onClose={() => handleResetPasswordClose()}
      title={'Reset Password'}
      className="z-50"
      body={
        <>
          <div className="flex flex-col gap-4">
            {/* <div className="w-full flex flex-col gap-2">
              <TextField
                id="1"
                name="email"
                value={userName ?? ''}
                disabled={true}
                label={'Admin Email id'}
              />
            </div> */}
          </div>
          <form onSubmit={(e) => handleSubmit(onSubmit)(e)} noValidate>
            <div className="flex flex-col pt-2 ">
              <label className="labels label-text" htmlFor={'new_password'}>
                Password
              </label>
              <div className="relative">
                <input
                  id={'new_password'}
                  type={showPassword.new_password ? 'text' : 'password'}
                  required={true}
                  placeholder={'Enter Password'}
                  className={fixedInputClass}
                  {...register('new_password', {
                    required: 'Password is required.',
                    pattern: {
                      value:
                        /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[`~<>?,./!@#$%^&*()\-_=+"'\|{}\[\];:\\]).{8,}$/,
                      message: PASSWORD_MESSAGE,
                    },
                  })}
                />
                <button
                  type="button"
                  className="absolute right-2 top-2.5 z-10"
                  onClick={() =>
                    setShowPassword({
                      ...showPassword,
                      new_password: !showPassword.new_password,
                    })
                  }
                >
                  {showPassword.new_password ? (
                    <Icons name="eye" />
                  ) : (
                    <Icons name="eye-close" />
                  )}
                </button>
              </div>
              {errors.new_password && (
                <div className="text-xs text-red-500">
                  {errors?.new_password?.message as string}
                </div>
              )}
              {passwordValue &&
                (() => {
                  const failed = passwordChecks.filter(
                    (c) => !c.test(passwordValue)
                  )
                  return failed.length === 0 ? (
                    <p className="mt-2 text-xs text-emerald-600 font-medium">
                      Password meets all requirements.
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-gray-400">
                      Password must contain at least one uppercase letter, one
                      lowercase letter, one number, one special character, and
                      be minimum 8 characters.
                    </p>
                  )
                })()}
            </div>
            <div className="flex flex-col py-5">
              <div className=" flex flex-row items-end gap-2 w-full justify-end ">
                <Button
                  label="Cancel"
                  outlined={true}
                  primary={false}
                  onClick={() => handleResetPasswordClose()}
                />

                <Button
                  label="Submit"
                  type="submit"
                  className="bg-primary"
                  isLoading={loader}
                />
              </div>
            </div>
          </form>
        </>
      }
    />
  )
}

export default ResetPassword
