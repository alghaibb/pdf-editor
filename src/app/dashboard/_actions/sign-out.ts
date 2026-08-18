"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/lib/auth"

export async function signOutAction() {
  try {
    await auth.api.signOut({
      headers: await headers(),
    })
  } catch (error) {
    console.error("Sign-out failed:", error)
  }

  redirect("/sign-in")
}
