"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { LoginBody, LoginBodyType } from "@/schemaValidations/auth.schema"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import authApiRequest from "@/apiRequests/auth"
import { useState } from "react"

export const LoginForm = () => {
  const [loading, setLoading] = useState(false)
  const {toast} = useToast()
  const form = useForm<LoginBodyType>({
    resolver: zodResolver(LoginBody),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const router = useRouter()

  async function onSubmit(values: LoginBodyType) {
    if(loading) return
    setLoading(true)
    try {
      const result = await authApiRequest.login(values)
      await authApiRequest.auth({
        sessionToken: result.payload.data.token,
        expiresAt: result.payload.data.expiresAt
      })
      toast({
        description: result.payload.message,
      })

      router.push("/me")
      router.refresh()

    } catch (error: unknown) {
      if (error instanceof Error) {
        const errorMessage = error.message || "An error occurred. Please try again."

        if (error instanceof Response && error.status === 422) {
          toast({
            variant: "destructive",
            description: "Vui lòng điền đầy đủ thông tin",
          })
        } else {
          toast({
            variant: "destructive",
            description: errorMessage,
          })
        }
      } else {
        toast({
          variant: "destructive",
          description: "An unexpected error occurred.",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 max-w-[600px] flex-shrink-0 w-full" noValidate>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="Nhập email của bạn" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mật khẩu</FormLabel>
              <FormControl>
                <Input placeholder="Nhập mật khẩu của bạn" type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="!mt-8 w-full">Đăng nhập</Button>
      </form>
    </Form>
  )
}
