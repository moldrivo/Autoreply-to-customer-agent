'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { PageTransition } from '@/components/layout/page-transition'
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import * as api from '@/lib/api'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError('No verification token provided')
      return
    }

    const verify = async () => {
      try {
        await api.verifyEmail(token)
        setStatus('success')
        toast.success('Email verified successfully')
        setTimeout(() => router.push('/login'), 3000)
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Verification failed'
        setStatus('error')
        setError(msg)
        toast.error(msg)
      }
    }

    verify()
  }, [token, router])

  return (
    <PageTransition>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/20 bg-white/90 p-8 shadow-2xl backdrop-blur-xl dark:bg-neutral-900/90 text-center"
      >
        {status === 'loading' && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-sky-600" />
            <h2 className="mt-4 text-xl font-bold text-neutral-900 dark:text-white">Verifying your email...</h2>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <h2 className="mt-4 text-xl font-bold text-neutral-900 dark:text-white">Email Verified!</h2>
            <p className="mt-2 text-sm text-neutral-500">Redirecting to login...</p>
            <Link href="/login" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-500">
              <ArrowLeft className="h-3 w-3" />
              Go to login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-xl font-bold text-neutral-900 dark:text-white">Verification Failed</h2>
            <p className="mt-2 text-sm text-neutral-500">{error}</p>
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="outline" onClick={() => router.push('/login')}>Go to Login</Button>
            </div>
          </>
        )}
      </motion.div>
    </PageTransition>
  )
}
