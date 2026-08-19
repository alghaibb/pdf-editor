"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"
import { revalidateAuthState } from "@/lib/auth/cache-tags"

export async function signOutAction() {
  try {
    await auth.api.signOut({
      headers: await headers(),
    })
  } catch (error) {
    console.error("Sign-out failed:", error)
  }

  revalidateAuthState()
  redirect("/sign-in")
}
