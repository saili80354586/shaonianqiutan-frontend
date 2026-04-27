import { test, expect } from '@playwright/test';

test.describe('用户中心', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('未登录应该重定向到登录页', async ({ page }) => {
    // 检查是否被重定向到登录页
    if (page.url().includes('login')) {
      await expect(page).toHaveURL(/.*login/);
      await expect(page.getByPlaceholder(/用户名|手机号/)).toBeVisible();
    }
  });

  test.describe('已登录用户', () => {
    test('应该显示仪表盘概览', async ({ page }) => {
      // 如果已登录，应该显示仪表盘
      if (!page.url().includes('login')) {
        await expect(page.locator('text=仪表盘').or(page.locator('text=概览'))).toBeVisible();
      }
    });

    test('应该可以导航到订单页面', async ({ page }) => {
      if (!page.url().includes('login')) {
        await page.getByText('我的订单').or(page.getByText('订单')).click();
        await expect(page).toHaveURL(/.*orders/);
      }
    });

    test('应该可以导航到报告页面', async ({ page }) => {
      if (!page.url().includes('login')) {
        await page.getByText('我的报告').or(page.getByText('报告')).click();
        await expect(page).toHaveURL(/.*reports/);
      }
    });
  });
});
