import { zodResolver } from '@hookform/resolvers/zod'
import { createElement, useEffect, useState, type ComponentType } from 'react'
import { useForm } from 'react-hook-form'
import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai'
import type { IconBaseProps, IconType } from 'react-icons'
// import { Link } from 'react-router-dom'

import { Button } from '../../../components/common'
import { useAppStore } from '../../../store/appStore'
import { useDomainManageStore } from '../../../store/domainManageStore'
import { loginSchema, LoginSchema } from '../schema'
import { useLogin } from '../api'

const renderIcon = (Icon: IconType, props?: IconBaseProps) =>
  createElement(Icon as ComponentType<IconBaseProps>, props)

export default function Login() {
  const { isLoading } = useAppStore()
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const login = useLogin(undefined)

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
    login.mutate({ username: data.username, password: data.password })
  }

  const { domainType } = useDomainManageStore()
  const [logText, setLogText] = useState('Login')
  const [subText, setSubText] = useState(
    'Welcome back! Please sign in to your account.'
  )

  useEffect(() => {
    if (domainType === 'Employee') {
      setLogText('Administrator Login')
      setSubText('Manage your platform with administrative privileges.')
    } else if (domainType === 'Assessor') {
      setLogText('Assessor Login')
      setSubText('Access assessment tools and evaluation features.')
    } else if (domainType === 'Organisation') {
      setLogText('Signatory Login')
      setSubText('Sign and manage organizational documents securely.')
    } else if (domainType === 'Nutritionist') {
      setLogText('Nutritionist Login')
      setSubText('Access nutrition plans and client management tools.')
    }
  }, [domainType])

  // Removed initial fade/scale animation on mount

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-red-50 to-green-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primaryBlue via-primaryPink to-primaryGreen"></div>

      {/* Fitness-themed Floating Shapes */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-orange-200 rounded-full opacity-20 animate-float">
        <div className="absolute inset-0 flex items-center justify-center">
          💪
        </div>
      </div>
      <div className="absolute top-20 right-20 w-16 h-16 bg-red-200 rounded-full opacity-30 animate-float animation-delay-1000">
        <div className="absolute inset-0 flex items-center justify-center">
          🔥
        </div>
      </div>
      <div className="absolute bottom-20 left-20 w-24 h-24 bg-green-200 rounded-full opacity-20 animate-float animation-delay-2000">
        <div className="absolute inset-0 flex items-center justify-center">
          🏃
        </div>
      </div>
      <div className="absolute bottom-10 right-10 w-12 h-12 bg-orange-300 rounded-full opacity-25 animate-float animation-delay-3000">
        <div className="absolute inset-0 flex items-center justify-center">
          ⭐
        </div>
      </div>

      <form
        onSubmit={handleSubmit(handleData)}
        noValidate
        autoComplete="off"
        className="w-full max-w-6xl mx-4"
      >
        <div
          className={
            'flex flex-col lg:flex-row items-center justify-center min-h-[60vh] bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-white/20 scale-100 opacity-100'
          }
        >
          {/* Left Panel - Image with Text Overlay */}
          <div className="hidden lg:flex items-center justify-center min-h-[60vh] w-[45%] relative overflow-hidden">
            <img
              src="/login-character.jpg"
              alt="Fitness Motivation"
              className="w-full h-full object-cover h-94"
            />
            {/* Text Overlay on Lower Left */}
            <div className="absolute bottom-6 left-6 right-6 bg-black/60 backdrop-blur-sm rounded-2xl p-6 text-white transform transition-all duration-500 hover:bg-black/70 hover:scale-[1.02]">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-lg">💪</span>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-orange-200 to-red-200 bg-clip-text text-transparent">
                  Transform Your Journey
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-gray-200">
                Join thousands of fitness enthusiasts who have transformed their
                lives through dedication and proper guidance. Your fitness
                journey starts here.
              </p>
              <div className="flex items-center mt-4 space-x-2 text-xs text-orange-200">
                <span>⭐</span>
                <span>5000+ Success Stories</span>
                <span className="mx-2">•</span>
                <span>🔥</span>
                <span>Expert Coaching</span>
              </div>
            </div>
          </div>

          {/* Right Panel - Login Form */}
          <div className="flex flex-col items-center justify-center min-h-[60vh] w-full lg:w-[55%] p-6 lg:p-8">
            <div className="max-w-md w-full">
              {/* Mobile Logo */}
              <div className="lg:hidden flex justify-center mb-8">
                <div className="relative transform hover:scale-105 transition-transform duration-300">
                  <div className="absolute -inset-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl blur opacity-75"></div>
                  <div className="relative bg-white rounded-xl p-4 shadow-2xl border border-orange-100">
                    <img
                      src="/gfm-logo.png"
                      alt="Get Fit Malayali"
                      className="w-24 h-24 object-contain"
                    />
                  </div>
                </div>
              </div>

              {/* Header */}
              <div className="text-center mb-10">
                <div className="flex items-center justify-center w-full">
                  <img
                    src="/gfm-logo.png"
                    alt="Get Fit Malayali"
                    className="w-28 h-28 object-contain mx-auto"
                  />
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-red-700 to-orange-600 bg-clip-text text-transparent mb-3">
                  {logText}
                </h2>
                <p className="text-neutral-600 text-lg leading-relaxed">
                  {subText}
                </p>
              </div>

              {/* Login Form */}
              <div className="space-y-6">
                {/* Username Field */}
                <div className="group">
                  <label
                    className="block text-sm font-semibold text-gray-600 mb-3 transition-all duration-200 group-focus-within:text-gray-800"
                    htmlFor="username"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-neutral-400 group-focus-within:text-red-500 transition-colors duration-200"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <input
                      id="username"
                      type="email"
                      required={true}
                      className={`rounded appearance-none relative block w-full px-3 py-2 border ${
                        errors.username ? 'border-red-500' : 'border-formBorder'
                      } placeholder-gray-500 textfield focus:outline-none focus:ring-primaryBlue focus:border-primaryBlue focus:z-10 sm:text-sm`}
                      placeholder="Enter your username or email"
                      autoComplete="username"
                      spellCheck={false}
                      {...register('username')}
                    />
                  </div>
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.username.message as string}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="group">
                  <label
                    className="block text-sm font-semibold text-gray-600 mb-3 transition-all duration-200 group-focus-within:text-gray-800"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-5 w-5 text-neutral-400 group-focus-within:text-red-500 transition-colors duration-200"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required={true}
                      className={`rounded appearance-none relative block w-full px-3 py-2 border ${
                        errors.password ? 'border-red-500' : 'border-formBorder'
                      } placeholder-gray-500 textfield focus:outline-none focus:ring-primaryBlue focus:border-primaryBlue focus:z-10 sm:text-sm`}
                      autoComplete="current-password"
                      spellCheck={false}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-neutral-400 hover:text-neutral-600 transition-colors duration-200 rounded-lg hover:bg-neutral-100"
                      onClick={() => setShowPassword((c) => !c)}
                    >
                      {showPassword
                        ? renderIcon(AiFillEye, {
                            size: 20,
                            className: 'text-red-500',
                          })
                        : renderIcon(AiFillEyeInvisible, { size: 20 })}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.password.message as string}
                    </p>
                  )}
                </div>

                {/* Login Button */}
                <div className="space-y-4 pt-2">
                  <Button
                    label="Login"
                    className="w-full py-4 bg-primaryBlue  text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-4 focus:ring-red-200 focus:ring-offset-2 shadow-lg hover:shadow-xl active:scale-95"
                    isLoading={isLoading}
                    type="submit"
                  />

                  {/* Forgot Password */}
                  {/* <div className="text-center">
                    <Link
                      to="/forget-password"
                      className="inline-flex items-center text-red-600 hover:text-red-800 text-sm font-semibold transition-all duration-200 hover:underline"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      Forgot your password?
                    </Link>
                  </div> */}
                </div>
              </div>

              {/* Additional Info */}
              {/* <div className="mt-4 text-center">
                <div className="bg-gradient-to-r from-transparent via-neutral-200 to-transparent h-px w-full mb-3"></div>
                <p className="text-neutral-600 text-sm">
                  Don`t have an account?{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-red-600 hover:text-red-800 transition-colors duration-200 hover:underline"
                  >
                    Register
                  </Link>
                </p>
              </div> */}

              {/* Fitness Motivation */}
              <div className="mt-6 text-center">
                <div className="inline-flex items-center space-x-2 text-xs text-neutral-500 bg-orange-50 rounded-full px-4 py-2">
                  <span>💪</span>
                  <span>Start strong, finish stronger!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Custom Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-3000 {
          animation-delay: 3s;
        }
      `}</style>
    </div>
  )
}
