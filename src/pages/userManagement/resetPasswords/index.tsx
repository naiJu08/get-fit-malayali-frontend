import { zodResolver } from '@hookform/resolvers/zod'
import { createElement, useEffect, useState, type ComponentType } from 'react'
import { useForm } from 'react-hook-form'
import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai'
import type { IconBaseProps, IconType } from 'react-icons'
import { useNavigate, useParams } from 'react-router-dom'

import { Button } from '../../../components/common'
import { useSnackbarManager } from '../../../components/common/snackbar'
// import config from '../../../config'
import { ForgetResetPassword, verifyResetPassword } from '../api'
import { ResetPasswordSchema, resetSchema } from '../schema'

const fixedInputClass =
  'rounded appearance-none relative block w-full px-3 py-2 border border-formBorder placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-purple-500 focus:border-gray-300 focus:z-10 sm:text-sm'

const renderIcon = (Icon: IconType, props?: IconBaseProps) =>
  createElement(Icon as ComponentType<IconBaseProps>, props)

export default function ResetPassword() {
  const params = useParams()
  const { enqueueSnackbar } = useSnackbarManager()
  const navigate = useNavigate()
  const [linkValid, setLinkValid] = useState(false)
  const {
    formState: { errors },
    handleSubmit,
    register,
    trigger,
    watch,
  } = useForm<ResetPasswordSchema>({
    mode: 'onChange',
    resolver: zodResolver(resetSchema),
  })

  const handleValidateToken = () => {
    const data = { token: params?.token }
    verifyResetPassword(data)
      .then(() => {
        setLinkValid(true)
      })
      .catch((error) => {
        console.error('Error:', error)
        navigate('/dashboard')
      })
  }
  useEffect(() => {
    if (params?.token) {
      handleValidateToken()
    } else {
      navigate('/dashboard')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])
  const handleBack = () => {
    navigate('/login')
  }
  const handleData = (data: ResetPasswordSchema, e: any) => {
    e.preventDefault()
    const details = {
      token: params?.token,
      new_password: data.password,
      confirm_password: data.confirm_password,
    }
    ForgetResetPassword(details)
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
  })

  useEffect(() => {
    watch('password') && watch('confirm_password') && trigger()
  }, [watch('password'), watch('confirm_password')])
  return (
    <>
      {linkValid && (
        <form onSubmit={(e) => handleSubmit(handleData)(e)} noValidate>
          <div className="min-h-full h-screen flex items-center justify-center bg-slatedark">
            <div className=" hidden lg:block min-h-full w-[60%] shrink-0 login-left">
              <img src="/images/logo-portrait-black.png" alt="logo" />
              <h2 className="text-[40px] leading-[50px] text-center">
                It’s time to commit <br /> to <b>Progress</b>
              </h2>
            </div>

            <div className=" p-8 min-h-full w-[40%] flex flex-col items-center justify-center">
              <div className="max-w-[350px] min-w-[300px] w-full">
                <img
                  src="/images/logo-portrait-black.png"
                  alt="logo"
                  className="w-[150px] block lg:hidden mx-auto mb-6"
                />
                <h2 className=" text-2xl font-bold text-blackAlt">
                  Reset Password
                </h2>

                <div className="mt-4 space-y-6">
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
                          : renderIcon(AiFillEyeInvisible, {
                              color: 'primary',
                            })}
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
                          type={
                            showPassword.confirm_password ? 'text' : 'password'
                          }
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
                          : renderIcon(AiFillEyeInvisible, {
                              color: 'primary',
                            })}
                      </div>
                    </div>
                    {errors.confirm_password && (
                      <div className="text-xs text-red-500">
                        {errors?.confirm_password?.message as string}
                      </div>
                    )}
                  </div>
                  <div className="my-4 flex gap-3 login-btn">
                    <Button
                      label="Back to login"
                      className="w-full"
                      outlined={true}
                      primary={false}
                      onClick={() => handleBack()}
                    />

                    <Button
                      label="Submit"
                      className="w-full bg-primary"
                      type="submit"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </>
  )
}
