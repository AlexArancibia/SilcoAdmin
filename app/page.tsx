"use client"
import { PeriodSelector } from '@/components/period-selector'
import { useAuthStore } from '@/store/useAuthStore'
import { redirect } from 'next/navigation'
import { useEffect } from 'react'

function page() {
  const { user } = useAuthStore()

  useEffect(() => {
    if (!user) redirect('/login')
  }, [user])

  if (!user) return null

  return (
    <div><PeriodSelector /></div>
  )
}

export default page