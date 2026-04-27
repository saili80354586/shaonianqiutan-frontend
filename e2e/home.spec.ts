import { test, expect } from '@playwright/test';

test.describe('首页', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('应该显示首页标题', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('少年球探');
  });

  test('应该显示导航栏', async ({ page }) => {
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByText('球探地图')).toBeVisible();
    await expect(page.getByText('服务套餐')).toBeVisible();
    await expect(page.getByText('关于我们')).toBeVisible();
  });

  test('应该显示Hero区域', async ({ page }) => {
    await expect(page.locator('text=专业青少年足球球探服务平台')).toBeVisible();
    await expect(page.getByRole('button', { name: '立即体验' })).toBeVisible();
  });

  test('点击"立即体验"应该跳转到球探地图', async ({ page }) => {
    await page.getByRole('button', { name: '立即体验' }).click();
    await expect(page).toHaveURL(/.*map|analysts/);
  });

  test('应该显示服务套餐区域', async ({ page }) => {
    await expect(page.locator('text=服务套餐')).toBeVisible();
    await expect(page.locator('text=基础版')).toBeVisible();
    await expect(page.locator('text=专业版')).toBeVisible();
    await expect(page.locator('text=精英版')).toBeVisible();
  });

  test('应该显示页脚', async ({ page }) => {
    await expect(page.locator('footer')).toBeVisible();
    await expect(page.locator('text=© 2026 少年球探')).toBeVisible();
  });
});
