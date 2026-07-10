import { test, expect } from '@playwright/test'

test('página inicial carrega', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/commission/i)
})
