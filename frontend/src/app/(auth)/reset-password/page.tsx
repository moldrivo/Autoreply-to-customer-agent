'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageTransition } from '@/components/layout/page-transition'
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import * as api from '@/lib/api'

const schema = z.object({
  new_password: z.string().min(8, 'At least 8 characters').regex(/[A-Z]/, 'Need 1 uppercase').regex(/[0-9]/, 'Need 1 number'),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
})

type Form = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: Form) => {
    if (!token) {
      toast.error('Invalid or missing reset token')
      return
    }
    setLoading(true)
    try {
      await api.resetPassword(token, data.new_password)
      toast.success('Password reset successfully')
      router.push('/login')
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to reset password'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <PageTransition>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/20 bg-white/90 p-8 shadow-2xl backdrop-blur-xl dark:bg-neutral-900/90 text-center"
        >
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Invalid Link</h2>
          <p className="mt-2 text-sm text-neutral-500">This password reset link is invalid or expired.</p>
          <Link href="/forgot-password" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-500">
            <ArrowLeft className="h-3 w-3" />
            Request a new reset link
          </Link>
        </motion.div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/20 bg-white/90 p-8 shadow-2xl backdrop-blur-xl dark:bg-neutral-900/90"
      >
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Set new password</h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Enter your new password below</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter new password"
            leftIcon={<Lock className="h-4 w-4" />}
            rightIcon={
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-neutral-400 hover:text-neutral-600">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            error={errors.new_password?.message}
            {...register('new_password')}
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Repeat new password"
            leftIcon={<Lock className="h-4 w-4" />}
            error={errors.confirm_password?.message}
            {...register('confirm_password')}
          />
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Reset Password
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
          <Link href="/login" className="inline-flex items-center gap-1 font-medium text-sky-600 hover:text-sky-500 dark:text-sky-400">
            <ArrowLeft className="h-3 w-3" />
            Back to login
          </Link>
        </p>
      </motion.div>
    </PageTransition>
  )
}
