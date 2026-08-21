import { expect, test } from "@playwright/test"

import {
  createVerifiedUser,
  deleteUserAndFiles,
  disconnectTestDb,
} from "./helpers/test-user"

const testUser = {
  email: `e2e-${Date.now()}@pdf-editor.test`,
  password: "E2e-test-password-1!",
  name: "E2E Tester",
}

test.describe.configure({ mode: "serial" })

test.beforeAll(async ({ baseURL }) => {
  if (!baseURL) {
    throw new Error("baseURL is not configured.")
  }

  await createVerifiedUser(baseURL, testUser)
})

test.afterAll(async () => {
  await deleteUserAndFiles(testUser.email)
  await disconnectTestDb()
})

test("core loop: sign in, open the sample PDF, reopen it from the dashboard", async ({
  page,
}) => {
  // Sign in through the real form.
  await page.goto("/sign-in")
  await page.getByLabel("Email").fill(testUser.email)
  await page.getByLabel("Password", { exact: true }).fill(testUser.password)
  await page.getByRole("button", { name: "Sign in" }).click()
  await page.waitForURL("**/dashboard", { timeout: 90_000 })

  // A fresh account sees the empty state with the sample onboarding button.
  // Clicking it uploads the sample through the real signed-URL pipeline and
  // navigates to the editor.
  await page
    .getByRole("button", { name: "Try the sample invoice" })
    .click({ timeout: 60_000 })
  await page.waitForURL("**/editor/**", { timeout: 120_000 })

  // The loading skeleton unmounts only after WebViewer boots, the PDF
  // downloads from R2, and content-edit mode starts. No error alert means
  // content editing genuinely engaged rather than failing into ready state.
  await expect(page.getByLabel("Loading PDF")).toBeHidden({
    timeout: 180_000,
  })
  await expect(page.getByText("Editor message")).toBeHidden()
  await expect(
    page.getByRole("button", { name: /Sample invoice\.pdf/ }).first()
  ).toBeVisible()

  // Back to the dashboard: the document persisted and is listed.
  await page.getByRole("link", { name: "Dashboard" }).click()
  await page.waitForURL("**/dashboard", { timeout: 90_000 })
  await expect(page.getByText("Sample invoice.pdf").first()).toBeVisible({
    timeout: 60_000,
  })

  // Reopen the stored document from R2 and confirm the editor boots again.
  await page.getByRole("link", { name: "Open" }).first().click()
  await page.waitForURL("**/editor/**", { timeout: 120_000 })
  await expect(page.getByLabel("Loading PDF")).toBeHidden({
    timeout: 180_000,
  })
  await expect(page.getByText("Editor message")).toBeHidden()
})
