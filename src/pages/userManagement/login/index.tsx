import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '../../../components/common'
import { useAppStore } from '../../../store/appStore'
import { useDomainManageStore } from '../../../store/domainManageStore'
import { useAuthStore } from '../../../store/authStore'
import { loginSchema, LoginSchema } from '../schema'

const fixedInputClass =
  'lowercase placeholder:normal-case rounded-sm appearance-none relative block w-full px-3 py-2 border border-formBorder placeholder-gray-500 dark:bg-transparent text-gray-900 dark:text-black  focus:outline-none focus:ring-purple-500 focus:border-gray-300 focus:z-10 sm:text-sm'
const passwordEndAdorement =
  'rounded-sm appearance-none relative block w-full pl-3 pr-6 py-2 border border-formBorder placeholder-gray-500 dark:bg-transparent dark:text-black text-gray-900 focus:outline-none focus:ring-purple-500 focus:border-gray-300 focus:z-10 sm:text-sm'
export default function Login() {
  const { isLoading } = useAppStore()
  const navigate = useNavigate()
  const { setAuthenticated, setToken, setUserData } = useAuthStore()
  const [showPassword, setShowPassword] = useState<boolean>(false)

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<LoginSchema>({
    mode: 'onChange',
    defaultValues: { username: '', password: '' },
    resolver: zodResolver(loginSchema),
  })

  const handleData = (data: LoginSchema) => {
    // Static login: set auth state and navigate to dashboard
    setAuthenticated(true)
    setToken('mock-token')
    setUserData({ username: data.username })
    navigate('/dashboard', { replace: true })
  }

  const { domainType } = useDomainManageStore()
  const [logText, setLogText] = useState('Login')
  useEffect(() => {
    if (domainType === 'Employee') {
      setLogText('Administrator Login')
    } else if (domainType === 'Assessor') {
      setLogText('Assessor Login')
    } else if (domainType === 'Organisation') {
      setLogText('Signatory Login')
    }
  }, [domainType])
  return (
    <form onSubmit={handleSubmit(handleData)} noValidate>
      <div className="min-h-full h-screen flex items-center justify-center bg-slatedark">
        <div className=" hidden lg:block min-h-full w-[60%] shrink-0 login-left">
          <img src="/images/logo-portrait-black.png" alt="logo" />
          <h2 className="text-[40px] leading-[50px] text-center dark:text-white">
            It’s time to commit <br /> to <b>Progress</b>
          </h2>
        </div>
        <div className=" p-8 min-h-full w-[40%] flex flex-col items-center justify-center dark:bg-white">
          <div className="max-w-[350px] min-w-[300px] w-full">
            <img
              src="/images/logo-portrait-black.png"
              alt="logo"
              className="w-[150px] block lg:hidden mx-auto mb-6"
            />
            <h2 className=" text-2xl font-bold text-blackAlt">{logText}</h2>

            <div className="mt-4 space-y-6">
              <div className="my-4">
                <label
                  className="text-sm mb-2 block text-primaryText"
                  htmlFor={'username'}
                >
                  Username
                </label>
                <div>
                  <input
                    id={'username'}
                    type={'email'}
                    required={true}
                    className={fixedInputClass}
                    placeholder={'Enter User Name'}
                    {...register('username')}
                  />
                </div>
                {errors.username && (
                  <div className="text-xs text-red-500">
                    {errors?.username?.message as string}
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
                      type={showPassword ? 'text' : 'password'}
                      required={true}
                      className={passwordEndAdorement}
                      placeholder={'Enter Password'}
                      {...register('password')}
                    />
                  </div>
                  <div
                    className="absolute right-1 cursor-pointer z-50"
                    onClick={() => {
                      setShowPassword((c) => !c)
                    }}
                  >
                    {showPassword ? (
                      <AiFillEye color="primary" />
                    ) : (
                      <AiFillEyeInvisible color="primary" />
                    )}
                  </div>
                </div>
                {errors.password && (
                  <div className="text-xs text-red-500">
                    {errors?.password?.message as string}
                  </div>
                )}
              </div>
              <div className="my-4 block">
                {/* <button
                  type="submit"
                  disabled={isLoading}
                  className="p-1.5 w-full disabled:opacity-70 inline-block bg-primary text-bgWhite cursor-pointer disabled:cursor-not-allowed hover:opacity-90  transition-opacity  rounded-sm"
                > */}
                {/* Login */}
                <Button
                  size="xs"
                  label="Login"
                  className="p-1.5 w-full disabled:opacity-70 inline-block bg-primary text-bgWhite cursor-pointer disabled:cursor-not-allowed hover:opacity-90  transition-opacity  rounded-sm"
                  isLoading={isLoading}
                  type="submit"
                />

                {/* </button> */}
                <div className="text-primaryText cursor-pointer text-sm mt-3">
                  <Link to="/forget-password"> Forgot your password? </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
