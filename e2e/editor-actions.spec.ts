import { expect, test } from "@playwright/test"

import {
  createVerifiedUser,
  deleteUserAndFiles,
  disconnectTestDb,
} from "./helpers/test-user"

const testUser = {
  email: `e2e-actions-${Date.now()}@pdf-editor.test`,
  password: "E2e-test-password-1!",
  name: "E2E Actions Tester",
}

/**
 * Shape of the dev-only window.__pdfEditor seam exposed by useWebViewer.
 * Playwright cannot reach into the rendered canvas, so annotations are
 * created through the real Core API instead.
 */
type EditorSeam = {
  instance: {
    Core: {
      annotationManager: {
        addAnnotation: (annotation: unknown) => void
      }
      Annotations: {
        RectangleAnnotation: new () => {
          PageNumber: number
          X: number
          Y: number
          Width: number
          Height: number
        }
      }
    }
  }
  store: {
    getState: () => { isReady: boolean }
  }
}

/**
 * "Skeleton hidden" passes trivially before the editor page even mounts
 * (a missing element counts as hidden), so readiness is read from the
 * editor store through the dev seam instead.
 */
async function waitForEditorReady(page: import("@playwright/test").Page) {
  await page.waitForFunction(
    () => {
      const seam = (window as unknown as { __pdfEditor?: EditorSeam })
        .__pdfEditor

      return seam?.store.getState().isReady === true
    },
    undefined,
    { timeout: 180_000 }
  )
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

test("annotation autosaves a new version and restoring the old version reboots the viewer", async ({
  page,
}) => {
  // Sign in and seed the account with the sample document.
  await page.goto("/sign-in")
  await page.getByLabel("Email").fill(testUser.email)
  await page.getByLabel("Password", { exact: true }).fill(testUser.password)
  await page.getByRole("button", { name: "Sign in" }).click()
  await page.waitForURL("**/dashboard", { timeout: 90_000 })
  await page
    .getByRole("button", { name: "Try the sample invoice" })
    .click({ timeout: 60_000 })
  await page.waitForURL("**/editor/**", { timeout: 120_000 })
  await waitForEditorReady(page)
  await expect(page.getByText("Editor message")).toBeHidden()

  // Register before the edit: autosave should fire these on its own after
  // the idle window, with no manual save click anywhere in this test.
  const saveUrlResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/save-url") &&
      response.request().method() === "POST",
    { timeout: 60_000 }
  )
  const completeResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/complete") &&
      response.request().method() === "POST",
    { timeout: 90_000 }
  )

  // A real annotation through the Core API must mark the document dirty.
  await page.evaluate(() => {
    const seam = (window as unknown as { __pdfEditor?: EditorSeam })
      .__pdfEditor

    if (!seam) {
      throw new Error("The editor test seam is not available.")
    }

    const { annotationManager, Annotations } = seam.instance.Core
    const rectangle = new Annotations.RectangleAnnotation()
    rectangle.PageNumber = 1
    rectangle.X = 72
    rectangle.Y = 72
    rectangle.Width = 160
    rectangle.Height = 80
    annotationManager.addAnnotation(rectangle)
  })

  await expect(page.getByText("Unsaved", { exact: true })).toBeVisible({
    timeout: 10_000,
  })

  // Autosave uploads and finalizes version 2 without user input.
  await saveUrlResponse
  await completeResponse
  await expect(page.getByText("Saved", { exact: true })).toBeVisible({
    timeout: 60_000,
  })

  // Restore version 1. The refresh swaps in a fresh signed URL and must
  // reboot the viewer rather than leaving a dead skeleton behind.
  await page.getByRole("button", { name: "Version history" }).click()
  await expect(
    page.getByRole("button", { name: "Restore", exact: true })
  ).toBeVisible({ timeout: 30_000 })
  await page.getByRole("button", { name: "Restore", exact: true }).click()
  await expect(page.getByText("Version 1 restored.")).toBeVisible({
    timeout: 30_000,
  })

  await expect(page.getByLabel("Loading PDF")).toBeVisible({
    timeout: 60_000,
  })
  await waitForEditorReady(page)
  await expect(page.getByText("Editor message")).toBeHidden()
  await expect(page.getByText("Saved", { exact: true })).toBeVisible({
    timeout: 30_000,
  })
})
