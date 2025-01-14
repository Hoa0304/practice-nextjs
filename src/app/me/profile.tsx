'use client'

import accountApiRequest from '@/apiRequests/account'
import { useAppContext } from '@/app/AppProvider'
import React, { useEffect } from 'react'

export default function Profile() {
    const {sessionToken} = useAppContext()
    useEffect(() =>{
        const fetchRequest = async () => {
            const result = await accountApiRequest.me(sessionToken)
        console.log(result)
        }
        
    fetchRequest()
    },[sessionToken])
  return (
    <div>
      
    </div>
  )
}
