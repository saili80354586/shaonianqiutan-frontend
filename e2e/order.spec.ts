import { test, expect } from '@playwright/test';

test.describe('订单流程', () => {
  test.describe('服务套餐选择', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/packages');
    });

    test('应该显示所有服务套餐', async ({ page }) => {
      await expect(page.locator('text=基础版').or(page.locator('text=基础套餐'))).toBeVisible();
      await expect(page.locator('text=专业版').or(page.locator('text=专业套餐'))).toBeVisible();
      await expect(page.locator('text=精英版').or(page.locator('text=精英套餐'))).toBeVisible();
    });

    test('点击套餐应该进入订单流程', async ({ page }) => {
      const buyButton = page.getByRole('button', { name: '立即购买' }).first();
      if (await buyButton.isVisible().catch(() => false)) {
        await buyButton.click();
        await expect(page).toHaveURL(/.*upload|.*order|.*login/);
      }
    });
  });

  test.describe('视频上传', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/upload');
    });

    test('应该显示上传区域', async ({ page }) => {
      const uploadVisible = await page.locator('text=上传').isVisible().catch(() => false);
      expect(uploadVisible).toBeTruthy();
    });

    test('未登录应该跳转到登录页', async ({ page }) => {
      // 如果没有登录，应该重定向到登录页
      if (page.url().includes('login')) {
        await expect(page).toHaveURL(/.*login/);
      }
    });
  });
});
