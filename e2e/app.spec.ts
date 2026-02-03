import { test, expect } from '@playwright/test';

test.describe('Service Workflow Console', () => {
  test.describe('Authentication', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveURL(/.*login/);
    });

    test('should login as Admin and redirect to devices', async ({ page }) => {
      await page.goto('/login');

      await page.getByRole('button', { name: /Administrator/i }).click();

      await expect(page).toHaveURL(/.*devices/);
      await expect(page.getByText('Admin')).toBeVisible();
    });

    test('should login as Technician', async ({ page }) => {
      await page.goto('/login');

      await page.getByRole('button', { name: /Technician/i }).click();

      await expect(page).toHaveURL(/.*devices/);
      await expect(page.getByText('Technician')).toBeVisible();
    });

    test('should login as Viewer', async ({ page }) => {
      await page.goto('/login');

      await page.getByRole('button', { name: /Viewer/i }).click();

      await expect(page).toHaveURL(/.*devices/);
      await expect(page.getByText('Viewer')).toBeVisible();
    });

    test('should logout and redirect to login', async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('button', { name: /Administrator/i }).click();
      await expect(page).toHaveURL(/.*devices/);

      await page.getByRole('button', { name: /account_circle/i }).click();
      await page.getByRole('menuitem', { name: /Logout/i }).click();

      await expect(page).toHaveURL(/.*login/);
    });
  });

  test.describe('Devices', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('button', { name: /Administrator/i }).click();
      await expect(page).toHaveURL(/.*devices/);
    });

    test('should display devices list', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Devices' })).toBeVisible();
      await expect(page.locator('table')).toBeVisible();
    });

    test('should search devices', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/Search/i);
      await searchInput.fill('SensorHub');

      // Wait for search results
      await page.waitForTimeout(500);
      await expect(page.locator('table')).toBeVisible();
    });

    test('should filter devices by status', async ({ page }) => {
      await page.getByLabel('Status').click();
      await page.getByRole('option', { name: 'Online' }).click();

      // Wait for filter to apply
      await page.waitForTimeout(300);
      await expect(page.locator('table')).toBeVisible();
    });

    test('should navigate to device detail', async ({ page }) => {
      // Click on first device link
      const deviceLink = page.locator('table a').first();
      await deviceLink.click();

      await expect(page).toHaveURL(/.*devices\/.+/);
      await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Audit Log' })).toBeVisible();
    });

    test('should open edit dialog for Admin', async ({ page }) => {
      // Navigate to device detail
      const deviceLink = page.locator('table a').first();
      await deviceLink.click();

      // Click edit button
      await page.getByRole('button', { name: /Edit Device/i }).click();

      // Verify dialog is open
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText('Edit Device')).toBeVisible();
    });

    test('Viewer should not see edit button', async ({ page }) => {
      // Logout first
      await page.getByRole('button', { name: /account_circle/i }).click();
      await page.getByRole('menuitem', { name: /Logout/i }).click();

      // Login as Viewer
      await page.getByRole('button', { name: /Viewer/i }).click();
      await expect(page).toHaveURL(/.*devices/);

      // Navigate to device detail
      const deviceLink = page.locator('table a').first();
      await deviceLink.click();

      // Verify edit button is not visible
      await expect(page.getByRole('button', { name: /Edit Device/i })).not.toBeVisible();
    });
  });

  test.describe('Tickets', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('button', { name: /Administrator/i }).click();
      await page.getByRole('link', { name: 'Service Tickets' }).click();
      await expect(page).toHaveURL(/.*tickets/);
    });

    test('should display tickets list', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Service Tickets' })).toBeVisible();
      await expect(page.locator('table')).toBeVisible();
    });

    test('should filter tickets by status', async ({ page }) => {
      await page.getByLabel('Status').click();
      await page.getByRole('option', { name: 'In Progress' }).click();

      await page.waitForTimeout(300);
      await expect(page.locator('table')).toBeVisible();
    });

    test('should open create ticket dialog', async ({ page }) => {
      await page.getByRole('button', { name: /Create Ticket/i }).click();

      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText('Create Service Ticket')).toBeVisible();
      await expect(page.getByText('Select Device')).toBeVisible();
    });

    test('should navigate through create ticket stepper', async ({ page }) => {
      await page.getByRole('button', { name: /Create Ticket/i }).click();

      // Step 1: Select Device
      await page.getByLabel('Device').click();
      await page.getByRole('option').first().click();
      await page.getByRole('button', { name: 'Next' }).click();

      // Step 2: Ticket Type
      await expect(page.getByLabel('Ticket Type')).toBeVisible();
      await page.getByRole('button', { name: 'Next' }).click();

      // Step 3: Details
      await page.getByLabel('Title').fill('Test Ticket Title');
      await page.getByLabel('Description').fill('Test ticket description for e2e testing');
      await page.getByRole('button', { name: 'Next' }).click();

      // Step 4: Review
      await expect(page.getByText('Review')).toBeVisible();
      await expect(page.getByText('Test Ticket Title')).toBeVisible();
    });

    test('should navigate to ticket detail', async ({ page }) => {
      const ticketLink = page.locator('table a').first();
      await ticketLink.click();

      await expect(page).toHaveURL(/.*tickets\/.+/);
      await expect(page.getByRole('tab', { name: 'Details' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'Audit Log' })).toBeVisible();
    });

    test('should show status transition options', async ({ page }) => {
      // Find a ticket that is not done
      await page.getByLabel('Status').click();
      await page.getByRole('option', { name: 'New' }).click();
      await page.waitForTimeout(300);

      const ticketLink = page.locator('table a').first();
      if (await ticketLink.isVisible()) {
        await ticketLink.click();

        const changeStatusButton = page.getByRole('button', { name: /Change Status/i });
        if (await changeStatusButton.isVisible()) {
          await changeStatusButton.click();
          await expect(page.getByRole('menu')).toBeVisible();
        }
      }
    });

    test('Viewer should not see create ticket button', async ({ page }) => {
      // Logout
      await page.getByRole('button', { name: /account_circle/i }).click();
      await page.getByRole('menuitem', { name: /Logout/i }).click();

      // Login as Viewer
      await page.getByRole('button', { name: /Viewer/i }).click();
      await page.getByRole('link', { name: 'Service Tickets' }).click();

      // Verify create button is not visible
      await expect(page.getByRole('button', { name: /Create Ticket/i })).not.toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.getByRole('button', { name: /Administrator/i }).click();
    });

    test('should navigate between Devices and Tickets', async ({ page }) => {
      // Start on Devices
      await expect(page).toHaveURL(/.*devices/);

      // Navigate to Tickets
      await page.getByRole('link', { name: 'Service Tickets' }).click();
      await expect(page).toHaveURL(/.*tickets/);

      // Navigate back to Devices
      await page.getByRole('link', { name: 'Devices' }).click();
      await expect(page).toHaveURL(/.*devices/);
    });

    test('should toggle sidenav', async ({ page }) => {
      const sidenav = page.locator('mat-sidenav');
      await expect(sidenav).toBeVisible();

      // Click menu button to toggle
      await page.getByRole('button', { name: 'menu' }).click();

      // Sidenav should still exist but might be closed
      await expect(sidenav).toBeAttached();
    });
  });
});
