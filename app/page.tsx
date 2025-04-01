"use client"
import { PeriodSelector } from '@/components/period-selector'
import { useAuthStore } from '@/store/useAuthStore'
import React from 'react'

function page() {
  const {user,userType} = useAuthStore()
  console.log(user?.id,user?.nombre,userType)
  return (
    <div><PeriodSelector /></div>
  )
}

export default page