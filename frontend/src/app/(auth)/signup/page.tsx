'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Mail, Lock, User, Building2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import * as api from '@/lib/api'

const signupSchema = z
  .object({
    business_name: z.string().min(2, 'Business name is required'),
    full_name: z.string().min(2, 'Full name is required'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(8, 'At least 8 characters').regex(/[A-Z]/, 'Need 1 uppercase').regex(/[0-9]/, 'Need 1 number'),
    confirmPassword: z.string(),
    terms: z.boolean().refine((v) => v === true, { message: 'You must accept the terms' }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type SignupForm = z.infer<typeof signupSchema>

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const fadeItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
  const colors = ['bg-red-500', 'bg-amber-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-green-500']
  return { score, label: labels[score] ?? 'Weak', color: colors[score] ?? 'bg-red-500' }
}

export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { terms: false },
  })

  const password = watch('password', '')
  const strength = getPasswordStrength(password)

  const onSubmit: SubmitHandler<SignupForm> = async (data) => {
    setLoading(true)
    try {
      await api.signup({
        business_name: data.business_name,
        full_name: data.full_name,
        email: data.email,
        password: data.password,
      })
      toast.success('Account created! Check your email to verify.')
      router.push('/login')
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Something went wrong'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="rounded-2xl border border-white/20 bg-white/90 p-8 shadow-2xl backdrop-blur-xl dark:bg-neutral-900/90"
    >
      <motion.div variants={fadeItem} className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Create your account</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Start automating your review replies</p>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <motion.div variants={fadeItem}>
          <Input
            label="Business Name"
            placeholder="Your Company"
            leftIcon={<Building2 className="h-4 w-4" />}
            error={errors.business_name?.message}
            {...register('business_name')}
          />
        </motion.div>

        <motion.div variants={fadeItem}>
          <Input
            label="Full Name"
            placeholder="John Doe"
            leftIcon={<User className="h-4 w-4" />}
            error={errors.full_name?.message}
            {...register('full_name')}
          />
        </motion.div>

        <motion.div variants={fadeItem}>
          <Input
            label="Email"
            type="email"
            placeholder="you@company.com"
            leftIcon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            {...register('email')}
          />
        </motion.div>

        <motion.div variants={fadeItem}>
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a strong password"
            leftIcon={<Lock className="h-4 w-4" />}
            rightIcon={
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-neutral-400 hover:text-neutral-600">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            error={errors.password?.message}
            {...register('password')}
          />
          {password.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                      i < strength.score ? strength.color : 'bg-neutral-200 dark:bg-neutral-700'
                    }`}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-neutral-500">{strength.label}</p>
            </div>
          )}
        </motion.div>

        <motion.div variants={fadeItem}>
          <Input
            label="Confirm Password"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Repeat your password"
            leftIcon={<Lock className="h-4 w-4" />}
            rightIcon={
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-neutral-400 hover:text-neutral-600">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </motion.div>

        <motion.div variants={fadeItem}>
          <label className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            <input
              type="checkbox"
              className="mt-0.5 rounded border-neutral-300 text-sky-600 focus:ring-sky-500"
              {...register('terms')}
            />
            <span>
              I agree to the{' '}
              <Link href="/terms" className="font-medium text-sky-600 hover:text-sky-500">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="font-medium text-sky-600 hover:text-sky-500">
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.terms && <p className="mt-1 text-xs text-red-500">{errors.terms.message}</p>}
        </motion.div>

        <motion.div variants={fadeItem}>
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Create account
          </Button>
        </motion.div>
      </form>

      <motion.p variants={fadeItem} className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-sky-600 hover:text-sky-500 dark:text-sky-400">
          Sign in
        </Link>
      </motion.p>
    </motion.div>
  )
}
