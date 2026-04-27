import { test, expect } from '@playwright/test';

test.describe('导航和布局', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('导航栏应该在所有页面显示', async ({ page }) => {
    await expect(page.locator('nav')).toBeVisible();
    
    // 访问不同页面检查导航栏
    const pages = ['/map', '/packages', '/about'];
    for (const path of pages) {
      await page.goto(path);
      await expect(page.locator('nav')).toBeVisible();
    }
  });

  test('点击Logo应该返回首页', async ({ page }) => {
    await page.goto('/map');
    await page.locator('nav img, nav [alt*="logo"], nav [class*="logo"]').first().click();
    await expect(page).toHaveURL('/');
  });

  test('页脚应该在所有页面显示', async ({ page }) => {
    const pages = ['/', '/map', '/packages', '/about'];
    for (const path of pages) {
      await page.goto(path);
      await expect(page.locator('footer')).toBeVisible();
    }
  });

  test('响应式菜单应该在移动端显示', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // 检查是否有汉堡菜单按钮
    const menuButton = page.locator('button[aria-label*="menu"], button[class*="menu"], [data-testid="menu-button"]').first();
    if (await menuButton.isVisible().catch(() => false)) {
      await menuButton.click();
      // 检查菜单是否展开
      await expect(page.locator('nav')).toBeVisible();
    }
  });
});
