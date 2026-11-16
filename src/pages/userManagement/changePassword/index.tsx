import { zodResolver } from '@hookform/resolvers/zod'
import { createElement, useEffect, useState, type ComponentType } from 'react'
import { useForm } from 'react-hook-form'
import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai'
import type { IconBaseProps, IconType } from 'react-icons'
import { useNavigate } from 'react-router-dom'

import { Button } from '../../../components/common'
import { useSnackbarManager } from '../../../components/common/snackbar'
import { useAppStore } from '../../../store/appStore'
import { forceChangePassword } from '../api'
import { ForgotPasswordSchema, forgotSchema } from '../schema'

const fixedInputClass =
  'rounded appearance-none relative block w-full px-3 py-2 border border-formBorder placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-purple-500 focus:border-gray-300 focus:z-10 sm:text-sm'

const renderIcon = (Icon: IconType, props?: IconBaseProps) =>
  createElement(Icon as ComponentType<IconBaseProps>, props)

export default function ForceChangePassword() {
  const { enqueueSnackbar } = useSnackbarManager()
  const { is_password_expired, reset_password_token } = useAppStore()
  const navigate = useNavigate()
  useEffect(() => {
    if (!is_password_expired) {
      navigate('/', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [is_password_expired])
  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<ForgotPasswordSchema>({
    mode: 'onChange',
    resolver: zodResolver(forgotSchema),
  })

  const handleData = (data: ForgotPasswordSchema, e: any) => {
    e.preventDefault()
    const details = {
      reset_token: reset_password_token,
      password: data.password,
      old_password: data.old_password,
      confirm_password: data.confirm_password,
    }
    forceChangePassword(details)
      .then((res) => {
        enqueueSnackbar(res.message, { variant: 'success' })
        navigate('/login')
      })
      .catch((error) => {
        console.error('Error:', error)
      })
  }
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirm_password: false,
    old_password: false,
  })

  return (
    <>
      <form onSubmit={(e) => handleSubmit(handleData)(e)} noValidate>
        <div className="min-h-full h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slatedark">
          <div className="max-w-md w-full space-y-8 bg-bgWhite p-8 rounded-lg shadow-xl">
            <div className="mb-6">
              <div className="flex justify-center mt-4 mb-4">
                <img
                  src="/images/logo-horizon-black.png"
                  alt="bizpole"
                  className="w-[220px]"
                />
              </div>
              <h2 className="text-center text-2xl font-semibold mb-2 text-blackAlt">
                Change Password
              </h2>
            </div>
            <div className="mt-4 space-y-6">
              <div className="my-4">
                <label
                  className="text-sm mb-2 block text-primaryText"
                  htmlFor={'old_password'}
                >
                  Old Password
                </label>
                <div className="relative flex  items-center">
                  <div className="w-full">
                    <input
                      id={'old_password'}
                      type={showPassword.old_password ? 'text' : 'password'}
                      required={true}
                      className={fixedInputClass}
                      placeholder={'Enter Old Password'}
                      {...register('old_password')}
                    />
                  </div>
                  {/* <button type="button" onClick={togglePasswordVisibility}> */}
                  <div
                    className="absolute right-1 cursor-pointer z-50"
                    onClick={() =>
                      setShowPassword({
                        ...showPassword,
                        old_password: !showPassword.old_password,
                      })
                    }
                  >
                    {showPassword.old_password
                      ? renderIcon(AiFillEye, { color: 'primary' })
                      : renderIcon(AiFillEyeInvisible, { color: 'primary' })}
                  </div>

                  {/* {showPassword ? (
                        <Icons name="eye" />
                      ) : (
                        <Icons name="eye-close" />
                      )} */}
                  {/* </button> */}
                </div>
                {errors.password && (
                  <div className="text-xs text-red-500">
                    {errors?.old_password?.message as string}
                  </div>
                )}
              </div>
              <div className="my-4">
                <label
                  className="text-sm mb-2 block text-primaryText"
                  htmlFor={'password'}
                >
                  Password
                </label>
                <div className="relative flex  items-center">
                  <div className="w-full">
                    <input
                      id={'password'}
                      type={showPassword.password ? 'text' : 'password'}
                      required={true}
                      className={fixedInputClass}
                      placeholder={'Enter Password'}
                      {...register('password')}
                    />
                  </div>
                  {/* <button type="button" onClick={togglePasswordVisibility}> */}
                  <div
                    className="absolute right-1 cursor-pointer z-50"
                    onClick={() =>
                      setShowPassword({
                        ...showPassword,
                        password: !showPassword.password,
                      })
                    }
                  >
                    {showPassword.password
                      ? renderIcon(AiFillEye, { color: 'primary' })
                      : renderIcon(AiFillEyeInvisible, { color: 'primary' })}
                  </div>

                  {/* {showPassword ? (
                        <Icons name="eye" />
                      ) : (
                        <Icons name="eye-close" />
                      )} */}
                  {/* </button> */}
                </div>
                {errors.password && (
                  <div className="text-xs text-red-500">
                    {errors?.password?.message as string}
                  </div>
                )}
              </div>
              <div className="my-4">
                <label
                  className="text-sm mb-2 block text-primaryText"
                  htmlFor={'confirm_password'}
                >
                  Confirm Password
                </label>
                <div className="relative flex  items-center">
                  <div className="w-full">
                    <input
                      id={'confirm_password'}
                      type={showPassword.confirm_password ? 'text' : 'password'}
                      required={true}
                      className={fixedInputClass}
                      placeholder={'Confirm Password'}
                      {...register('confirm_password')}
                    />
                  </div>
                  <div
                    className="absolute right-1 cursor-pointer z-50"
                    onClick={() =>
                      setShowPassword({
                        ...showPassword,
                        confirm_password: !showPassword.confirm_password,
                      })
                    }
                  >
                    {showPassword.confirm_password
                      ? renderIcon(AiFillEye, { color: 'primary' })
                      : renderIcon(AiFillEyeInvisible, { color: 'primary' })}
                  </div>
                </div>
                {errors.confirm_password && (
                  <div className="text-xs text-red-500">
                    {errors?.confirm_password?.message as string}
                  </div>
                )}
              </div>
              <div className="my-4 flex gap-3">
                <>
                  <Button label="Submit" className="w-full" type="submit" />
                </>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  )
}
