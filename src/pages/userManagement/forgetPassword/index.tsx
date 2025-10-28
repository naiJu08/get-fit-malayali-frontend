import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

import Button from '../../../components/common/buttons/Button'
import { useSnackbarManager } from '../../../components/common/snackbar'
import { resetPassword } from '../api'
import { forgetPasswordSchema, ForgetPasswordSchema } from '../schema'

const fixedInputClass =
  'lowercase placeholder:normal-case rounded-sm appearance-none relative block w-full px-3 py-2 border border-formBorder placeholder-gray-500 text-gray-900 focus:outline-none focus:border-gray-300 text-common'

export default function Login() {
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbarManager()

  const {
    formState: { errors },
    handleSubmit,
    register,
  } = useForm<ForgetPasswordSchema>({
    mode: 'onChange',
    defaultValues: { username: '' },
    resolver: zodResolver(forgetPasswordSchema),
  })

  const handleData = async (data: ForgetPasswordSchema, e: any) => {
    e.preventDefault()
    if (!data?.username) {
      enqueueSnackbar('Username is required', { variant: 'error' })
      return
    }
    const details = { email: data?.username }
    try {
      const res = await resetPassword(details)
      enqueueSnackbar(res.message, { variant: 'success' })
      navigate('/login')
    } catch (error: any) {
      enqueueSnackbar(error?.response.data.message, {
        variant: 'error',
      })
    }
  }

  const handleBack = () => {
    navigate('/login')
  }
  return (
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
              Forgot Password
            </h2>

            <div>
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

              <div className="my-4 flex gap-3 login-btn">
                <Button
                  label="Back to login"
                  outlined={true}
                  fullwidth={true}
                  onClick={handleBack}
                />

                <Button
                  type="submit"
                  fullwidth={true}
                  label="Reset"
                  primary={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
