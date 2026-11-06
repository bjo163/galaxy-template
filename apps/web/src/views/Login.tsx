'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'

// MUI Imports
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'

// Third-party Imports
import { signIn } from 'next-auth/react'
import { Controller, useForm } from 'react-hook-form'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { email, object, minLength, string, pipe, nonEmpty } from 'valibot'
import type { SubmitHandler } from 'react-hook-form'
import type { InferInput } from 'valibot'
import classnames from 'classnames'

// Type Imports
import { CustomTextField } from '@galaxy/ui'

import type { SystemMode } from '@core/types'
import type { Locale } from '@/configs/i18n'

// Component Imports
import Logo from '@components/layout/shared/Logo'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'
import GalaxyOrbitArtwork from '@components/brand/GalaxyOrbitArtwork'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

// Styled Custom Components
type FormData = InferInput<typeof schema>

const schema = object({
  email: pipe(string(), minLength(1, 'This field is required'), email('Email is invalid')),
  password: pipe(
    string(),
    nonEmpty('This field is required'),
    minLength(5, 'Password must be at least 5 characters long')
  )
})

const Login = ({ mode }: { mode: SystemMode }) => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [errorState, setErrorState] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Vars
  // Hooks
  const router = useRouter()
  const searchParams = useSearchParams()
  const { lang: locale } = useParams()
  const { settings } = useSettings()

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    resolver: valibotResolver(schema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  const onSubmit: SubmitHandler<FormData> = async (data: FormData) => {
    setIsSubmitting(true)

    try {
      const res = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false
      })

      if (res?.ok && !res.error) {
        const redirectURL = searchParams.get('redirectTo') ?? '/'

        router.replace(getLocalizedUrl(redirectURL, locale as Locale))
      } else {
        let message = 'Email or password is incorrect.'

        if (res?.error) {
          try {
            const error = JSON.parse(res.error) as { message?: string[] | string }

            message = Array.isArray(error.message) ? (error.message[0] ?? message) : (error.message ?? message)
          } catch {
            message = res.error.includes('Arsy authentication is not configured')
              ? 'Arsy authentication is not configured. Set ARSY_API_URL and restart the web app.'
              : res.error.includes('could not complete sign-in')
                ? 'The Arsy sign-in service is unavailable. Check that it is running and try again.'
                : 'Email or password is incorrect.'
          }
        }

        setErrorState(message)
      }
    } catch {
      setErrorState('The sign-in service could not be reached. Try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='flex bs-full justify-center'>
      <div
        className={classnames(
          'flex bs-full items-center justify-center flex-1 min-bs-[100dvh] relative p-6 max-md:hidden',
          {
            'border-ie': settings.skin === 'bordered'
          }
        )}
      >
        <div className='galaxy-auth-artwork'><GalaxyOrbitArtwork /></div>
      </div>
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <div className='absolute block-start-5 sm:block-start-[33px] inline-start-6 sm:inline-start-[38px]'>
          <Logo />
        </div>
        <div className='flex flex-col gap-6 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-8 sm:mbs-11 md:mbs-0'>
          <div className='flex flex-col gap-1'>
            <Typography variant='h4'>{`Welcome to ${themeConfig.templateName}!`}</Typography>
            <Typography>Please sign in to your account.</Typography>
          </div>
          {errorState && <Alert severity='error'>{errorState}</Alert>}
          <form noValidate autoComplete='off' onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6'>
            <Controller
              name='email'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  autoFocus
                  fullWidth
                  type='email'
                  label='Email'
                  placeholder='Enter your email'
                  onChange={e => {
                    field.onChange(e.target.value)
                    errorState !== null && setErrorState(null)
                  }}
                  {...((errors.email || errorState !== null) && {
                    error: true,
                    helperText: errors?.email?.message
                  })}
                />
              )}
            />
            <Controller
              name='password'
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <CustomTextField
                  {...field}
                  fullWidth
                  label='Password'
                  placeholder='············'
                  autoComplete='current-password'
                  id='login-password'
                  type={isPasswordShown ? 'text' : 'password'}
                  onChange={e => {
                    field.onChange(e.target.value)
                    errorState !== null && setErrorState(null)
                  }}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position='end'>
                          <IconButton
                            edge='end'
                            onClick={handleClickShowPassword}
                            onMouseDown={e => e.preventDefault()}
                          >
                            <i className={isPasswordShown ? 'tabler-eye' : 'tabler-eye-off'} />
                          </IconButton>
                        </InputAdornment>
                      )
                    }
                  }}
                  {...(errors.password && { error: true, helperText: errors.password.message })}
                />
              )}
            />
            <div className='flex justify-between items-center gap-x-3 gap-y-1 flex-wrap'>
              <FormControlLabel control={<Checkbox defaultChecked />} label='Remember me' />
              <Typography
                className='text-end'
                color='primary.main'
                component={Link}
                href={getLocalizedUrl('/forgot-password', locale as Locale)}
              >
                Forgot password?
              </Typography>
            </div>
            <Button disabled={isSubmitting} fullWidth variant='contained' type='submit'>
              {isSubmitting ? 'Signing in...' : 'Login'}
            </Button>
            <div className='flex justify-center items-center flex-wrap gap-2'>
              <Typography>Belum punya akun Arsy?</Typography>
              <Typography component={Link} href={getLocalizedUrl('/register', locale as Locale)} color='primary.main'>
                Create an account
              </Typography>
            </div>
            <Divider className='gap-2'>or</Divider>
            <Button
              color='secondary'
              className='self-center text-textPrimary'
              startIcon={<img src='/images/logos/google.png' alt='Google' width={22} height={22} />}
              sx={{ '& .MuiButton-startIcon': { marginInlineEnd: 3 } }}
              onClick={() => signIn('google')}
            >
              Sign in with Google
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
