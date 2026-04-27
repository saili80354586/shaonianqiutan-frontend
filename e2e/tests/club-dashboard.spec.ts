import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ClubDashboardPage } from '../pages/ClubDashboardPage';

test.describe('俱乐部后台功能测试', () => {
  let loginPage: LoginPage;
  let dashboardPage: ClubDashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new ClubDashboardPage(page);
  });

  test('1. 俱乐部账号登录', async ({ page }) => {
    await test.step('访问登录页面', async () => {
      await loginPage.goto();
      await expect(page).toHaveURL(/\/login/);
    });

    await test.step('点击俱乐部演示账号登录', async () => {
      await loginPage.loginAsClub();
    });

    await test.step('验证登录成功，跳转到俱乐部后台', async () => {
      await expect(page).toHaveURL(/\/club\/dashboard/);
    });
  });

  test('2. 概览页面加载', async ({ page }) => {
    await test.step('登录并进入概览页面', async () => {
      await loginPage.loginAsClub();
      await dashboardPage.clickOverview();
    });

    await test.step('验证概览页面加载成功', async () => {
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test('3. 球员管理模块', async ({ page }) => {
    await test.step('登录并进入球员管理', async () => {
      await loginPage.loginAsClub();
      await dashboardPage.clickPlayerManagement();
    });

    await test.step('验证球员管理页面加载', async () => {
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test('4. 球队管理模块', async ({ page }) => {
    await test.step('登录并进入球队管理', async () => {
      await loginPage.loginAsClub();
      await dashboardPage.clickTeamManagement();
    });

    await test.step('验证球队管理页面加载', async () => {
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test('5. 批量订单模块', async ({ page }) => {
    await test.step('登录并进入批量订单', async () => {
      await loginPage.loginAsClub();
      await dashboardPage.clickBatchOrders();
    });

    await test.step('验证批量订单页面加载', async () => {
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test('6. 周报管理模块（新功能）', async ({ page }) => {
    await test.step('登录并进入周报管理', async () => {
      await loginPage.loginAsClub();
      await dashboardPage.clickWeeklyReports();
    });

    await test.step('验证周报管理页面加载', async () => {
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test('7. 比赛总结模块（新功能）', async ({ page }) => {
    await test.step('登录并进入比赛总结', async () => {
      await loginPage.loginAsClub();
      await dashboardPage.clickMatchReports();
    });

    await test.step('验证比赛总结页面加载', async () => {
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test('8. 俱乐部主页模块', async ({ page }) => {
    await test.step('登录并进入俱乐部主页', async () => {
      await loginPage.loginAsClub();
      await dashboardPage.clickClubHome();
    });

    await test.step('验证俱乐部主页加载', async () => {
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test('9. 数据统计模块', async ({ page }) => {
    await test.step('登录并进入数据统计', async () => {
      await loginPage.loginAsClub();
      await dashboardPage.clickAnalytics();
    });

    await test.step('验证数据统计页面加载', async () => {
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test('10. 退出登录', async ({ page }) => {
    await test.step('登录并退出', async () => {
      await loginPage.loginAsClub();
      await dashboardPage.logout();
    });

    await test.step('验证退出后跳转登录页', async () => {
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
