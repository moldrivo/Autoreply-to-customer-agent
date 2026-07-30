'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageTransition } from '@/components/layout/page-transition'
import { Mail, Lock, Eye, EyeOff, Chrome, Github } from 'lucide-react'
import { toast } from 'sonner'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function LoginPage() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null as unknown as HTMLInputElement)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      await login(data.email, data.password)
      toast.success('Welcome back!')
      router.push('/dashboard')
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Invalid credentials'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      const form = document.getElementById('login-form') as HTMLFormElement
      form?.requestSubmit()
    }
  }, [])

  useEffect(() => {
    emailRef.current?.focus()
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <PageTransition>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="rounded-2xl border border-white/20 bg-white/90 p-8 shadow-2xl backdrop-blur-xl dark:bg-neutral-900/90"
      >
        <motion.div variants={item} className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Welcome back</h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Sign in to your account</p>
        </motion.div>

        <form id="login-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <motion.div variants={item}>
            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register('email')}
               ref={(e: HTMLInputElement | null) => { register('email').ref(e); if (e) emailRef.current = e }}
            />
          </motion.div>

          <motion.div variants={item}>
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-neutral-400 hover:text-neutral-600" tabIndex={-1}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />
          </motion.div>

          <motion.div variants={item} className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 cursor-pointer">
              <input type="checkbox" className="rounded border-neutral-300 text-sky-600 focus:ring-sky-500" />
              Remember me
            </label>
            <Link href="/forgot-password" className="text-sm font-medium text-sky-600 hover:text-sky-500 dark:text-sky-400">
              Forgot password?
            </Link>
          </motion.div>

          <motion.div variants={item}>
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Sign in
            </Button>
          </motion.div>
        </form>

        <motion.div variants={item} className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-neutral-400 dark:bg-neutral-900">or continue with</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button variant="outline" size="sm" className="w-full" onClick={() => toast.info('Google login coming soon')}>
              <Chrome className="mr-2 h-4 w-4" />
              Google
            </Button>
            <Button variant="outline" size="sm" className="w-full" onClick={() => toast.info('GitHub login coming soon')}>
              <Github className="mr-2 h-4 w-4" />
              GitHub
            </Button>
          </div>
        </motion.div>

        <motion.p variants={item} className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
          Don't have an account?{' '}
          <Link href="/signup" className="font-medium text-sky-600 hover:text-sky-500 dark:text-sky-400">
            Sign up
          </Link>
        </motion.p>

        <motion.p variants={item} className="mt-3 text-center text-[10px] text-neutral-400 dark:text-neutral-500">
          Press <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px]">Ctrl</kbd>+<kbd className="rounded border bg-muted px-1 py-0.5 text-[10px]">Enter</kbd> to submit
        </motion.p>
      </motion.div>
    </PageTransition>
  )
}
