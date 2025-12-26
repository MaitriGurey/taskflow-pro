import { test, expect } from '@playwright/test'

test.describe('App', () => {
  test('loads and shows login page', async ({ page }) => {
    await page.goto('/')

    // Should redirect to login since not authenticated
    await expect(page).toHaveURL('/login')
    await expect(page.getByRole('heading', { name: /sign in to taskflow/i })).toBeVisible()
    await expect(page.getByLabel(/email address/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('shows 404 for unknown routes', async ({ page }) => {
    await page.goto('/some-nonexistent-page')

    await expect(page.getByRole('heading', { name: '404' })).toBeVisible()
    await expect(page.getByText(/page not found/i)).toBeVisible()
  })
})

test.describe('Authentication', () => {
  test('can log in and reach dashboard', async ({ page }) => {
    await page.goto('/login')

    // Fill in email and submit
    await page.getByLabel(/email address/i).fill('test@example.com')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByRole('heading', { name: 'TaskFlow' })).toBeVisible()
    await expect(page.getByText('test@example.com')).toBeVisible()
  })

  test('can log in with Enter key', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel(/email address/i).fill('test@example.com')
    await page.getByLabel(/email address/i).press('Enter')

    await expect(page).toHaveURL('/dashboard')
  })

  test('can sign out', async ({ page }) => {
    // Log in first
    await page.goto('/login')
    await page.getByLabel(/email address/i).fill('test@example.com')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL('/dashboard')

    // Sign out
    await page.getByRole('button', { name: /sign out/i }).click()

    // Should redirect to login
    await expect(page).toHaveURL('/login')
  })

  test('protected routes redirect to login when not authenticated', async ({ page }) => {
    // Clear any stored auth state
    await page.goto('/login')
    await page.evaluate(() => localStorage.clear())

    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')

    await page.goto('/tasks/123')
    await expect(page).toHaveURL('/login')
  })
})

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage and log in fresh for each test
    await page.goto('/login')
    await page.evaluate(() => localStorage.clear())
    
    await page.getByLabel(/email address/i).fill('e2e-test@example.com')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL('/dashboard')
  })

  test('can create a task', async ({ page }) => {
    const taskTitle = `Test Task ${Date.now()}`

    await page.getByLabel(/new task title/i).fill(taskTitle)
    await page.getByRole('button', { name: /add task/i }).click()

    // Task should appear in the list
    await expect(page.getByText(taskTitle)).toBeVisible()
    
    // Input should be cleared
    await expect(page.getByLabel(/new task title/i)).toHaveValue('')
  })

  test('can create a task with Enter key', async ({ page }) => {
    const taskTitle = `Enter Task ${Date.now()}`

    await page.getByLabel(/new task title/i).fill(taskTitle)
    await page.getByLabel(/new task title/i).press('Enter')

    await expect(page.getByText(taskTitle)).toBeVisible()
  })

  test('can toggle task completion', async ({ page }) => {
    const taskTitle = `Toggle Task ${Date.now()}`

    // Create a task
    await page.getByLabel(/new task title/i).fill(taskTitle)
    await page.getByRole('button', { name: /add task/i }).click()

    // Find and click the checkbox
    const checkbox = page.getByRole('checkbox', { name: new RegExp(`mark "${taskTitle}"`, 'i') })
    await expect(checkbox).not.toBeChecked()

    await checkbox.click()
    await expect(checkbox).toBeChecked()

    // Toggle back
    await checkbox.click()
    await expect(checkbox).not.toBeChecked()
  })

  test('task persists after page refresh', async ({ page }) => {
    const taskTitle = `Persist Task ${Date.now()}`

    // Create a task
    await page.getByLabel(/new task title/i).fill(taskTitle)
    await page.getByRole('button', { name: /add task/i }).click()
    await expect(page.getByText(taskTitle)).toBeVisible()

    // Wait for IndexedDB to persist (debounce is 300ms)
    await page.waitForTimeout(500)

    // Refresh the page
    await page.reload()

    // Task should still be there after reload
    await expect(page.getByText(taskTitle)).toBeVisible()
  })

  test('completed state persists after refresh', async ({ page }) => {
    const taskTitle = `Complete Persist ${Date.now()}`

    // Create and complete a task
    await page.getByLabel(/new task title/i).fill(taskTitle)
    await page.getByRole('button', { name: /add task/i }).click()

    const checkbox = page.getByRole('checkbox', { name: new RegExp(`mark "${taskTitle}"`, 'i') })
    await checkbox.click()
    await expect(checkbox).toBeChecked()

    // Wait for persistence
    await page.waitForTimeout(500)

    // Refresh
    await page.reload()

    // Should still be checked
    const checkboxAfterReload = page.getByRole('checkbox', { name: new RegExp(`mark "${taskTitle}"`, 'i') })
    await expect(checkboxAfterReload).toBeChecked()
  })

  test('can filter tasks by status', async ({ page }) => {
    // Create two tasks
    await page.getByLabel(/new task title/i).fill('Active Task')
    await page.getByRole('button', { name: /add task/i }).click()

    await page.getByLabel(/new task title/i).fill('Completed Task')
    await page.getByRole('button', { name: /add task/i }).click()

    // Complete one task
    const checkbox = page.getByRole('checkbox', { name: /mark "completed task"/i })
    await checkbox.click()

    // Filter to show only completed
    await page.getByLabel(/filter by status/i).selectOption('completed')

    await expect(page.getByText('Completed Task')).toBeVisible()
    await expect(page.getByText('Active Task')).not.toBeVisible()

    // Filter to show only active
    await page.getByLabel(/filter by status/i).selectOption('active')

    await expect(page.getByText('Active Task')).toBeVisible()
    await expect(page.getByText('Completed Task')).not.toBeVisible()
  })

  test('can search tasks', async ({ page }) => {
    // Create tasks with different titles
    await page.getByLabel(/new task title/i).fill('Buy groceries')
    await page.getByRole('button', { name: /add task/i }).click()

    await page.getByLabel(/new task title/i).fill('Call dentist')
    await page.getByRole('button', { name: /add task/i }).click()

    // Search
    await page.getByLabel(/search tasks/i).fill('groceries')

    await expect(page.getByText('Buy groceries')).toBeVisible()
    await expect(page.getByText('Call dentist')).not.toBeVisible()

    // Clear search
    await page.getByLabel(/search tasks/i).clear()

    await expect(page.getByText('Buy groceries')).toBeVisible()
    await expect(page.getByText('Call dentist')).toBeVisible()
  })

  test('undo and redo work', async ({ page }) => {
    const taskTitle = `Undo Task ${Date.now()}`

    // Create a task
    await page.getByLabel(/new task title/i).fill(taskTitle)
    await page.getByRole('button', { name: /add task/i }).click()
    await expect(page.getByText(taskTitle)).toBeVisible()

    // Undo
    await page.getByRole('button', { name: /undo/i }).click()
    await expect(page.getByText(taskTitle)).not.toBeVisible()

    // Redo
    await page.getByRole('button', { name: /redo/i }).click()
    await expect(page.getByText(taskTitle)).toBeVisible()
  })
})

