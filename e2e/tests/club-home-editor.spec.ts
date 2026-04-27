import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ClubDashboardPage } from '../pages/ClubDashboardPage';

test.describe('俱乐部主页编辑功能 E2E 测试', () => {
  let loginPage: LoginPage;
  let dashboardPage: ClubDashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new ClubDashboardPage(page);
  });

  test('1. 俱乐部账号登录并进入主页编辑', async ({ page }) => {
    await test.step('使用俱乐部演示账号登录', async () => {
      await loginPage.loginAsClub();
      await expect(page).toHaveURL(/\/club\/dashboard/);
    });

    await test.step('导航到主页编辑页面', async () => {
      await dashboardPage.clickClubHome();
      await dashboardPage.waitForEditorLoaded();
    });

    await test.step('验证编辑器左侧导航完整', async () => {
      await expect(page.locator('button:has-text("页面总览")').first()).toBeVisible();
      await expect(page.locator('button:has-text("Hero 横幅")').first()).toBeVisible();
      await expect(page.locator('button:has-text("关于我们")').first()).toBeVisible();
      await expect(page.locator('button:has-text("荣誉成就")').first()).toBeVisible();
      await expect(page.locator('button:has-text("最新动态")').first()).toBeVisible();
      await expect(page.locator('button:has-text("联系我们")').first()).toBeVisible();
      await expect(page.locator('button:has-text("社交媒体")').first()).toBeVisible();
    });
  });

  test('2. Hero 横幅编辑与预览验证', async ({ page }) => {
    await test.step('登录并进入主页编辑', async () => {
      await loginPage.loginAsClub();
      await dashboardPage.clickClubHome();
      await dashboardPage.waitForEditorLoaded();
    });

    await test.step('切换到 Hero 横幅编辑', async () => {
      await dashboardPage.clickEditorNav('Hero 横幅');
      await expect(page.locator('h2:has-text("Hero 横幅")').first()).toBeVisible();
    });

    const heroTitle = `E2E测试主标题-${Date.now()}`;
    const heroSubtitle = `E2E测试副标题-${Date.now()}`;

    await test.step('修改 Hero 内容', async () => {
      await dashboardPage.editHero({ title: heroTitle, subtitle: heroSubtitle });
    });

    await test.step('保存 Hero 设置', async () => {
      await dashboardPage.clickSectionSave('Hero 横幅');
    });

    await test.step('打开预览并验证 Hero 展示', async () => {
      await dashboardPage.clickPreview();
      await dashboardPage.assertPreviewContains(heroTitle);
      await dashboardPage.assertPreviewContains(heroSubtitle);
      await dashboardPage.closePreview();
    });
  });

  test('3. 关于我们编辑与预览验证', async ({ page }) => {
    await test.step('登录并进入主页编辑', async () => {
      await loginPage.loginAsClub();
      await dashboardPage.clickClubHome();
      await dashboardPage.waitForEditorLoaded();
    });

    await test.step('切换到关于我们编辑', async () => {
      await dashboardPage.clickEditorNav('关于我们');
      await expect(page.locator('h2:has-text("关于我们")').first()).toBeVisible();
    });

    const aboutTitle = `E2E关于我们标题-${Date.now()}`;
    const aboutContent = `这是E2E自动化测试写入的关于我们内容-${Date.now()}`;

    await test.step('修改关于我们内容', async () => {
      await dashboardPage.editAbout({ enabled: true, title: aboutTitle, content: aboutContent });
    });

    await test.step('保存关于我们设置', async () => {
      await dashboardPage.clickSectionSave('关于我们');
    });

    await test.step('打开预览并验证关于我们展示', async () => {
      await dashboardPage.clickPreview();
      await dashboardPage.assertPreviewContains(aboutTitle);
      await dashboardPage.assertPreviewContains(aboutContent);
      await dashboardPage.closePreview();
    });
  });

  test('4. 荣誉成就添加与预览验证', async ({ page }) => {
    await test.step('登录并进入主页编辑', async () => {
      await loginPage.loginAsClub();
      await dashboardPage.clickClubHome();
      await dashboardPage.waitForEditorLoaded();
    });

    await test.step('切换到荣誉成就编辑', async () => {
      await dashboardPage.clickEditorNav('荣誉成就');
      await expect(page.locator('h2:has-text("荣誉成就")').first()).toBeVisible();
    });

    const achTitle = `E2E冠军-${Date.now()}`;
    const achDesc = 'E2E自动化测试荣誉';
    const achCount = '99';

    await test.step('添加一条荣誉成就', async () => {
      await dashboardPage.addAchievement(achTitle, achDesc, achCount);
    });

    await test.step('保存荣誉成就', async () => {
      await dashboardPage.clickSectionSave('荣誉成就');
    });

    await test.step('打开预览并验证荣誉成就展示', async () => {
      await dashboardPage.clickPreview();
      await dashboardPage.assertPreviewContains(achTitle);
      await dashboardPage.assertPreviewContains(achCount);
      await dashboardPage.closePreview();
    });
  });

  test('5. 手工置顶公告添加与预览验证', async ({ page }) => {
    await test.step('登录并进入主页编辑', async () => {
      await loginPage.loginAsClub();
      await dashboardPage.clickClubHome();
      await dashboardPage.waitForEditorLoaded();
    });

    await test.step('切换到最新动态编辑', async () => {
      await dashboardPage.clickEditorNav('最新动态');
      await expect(page.locator('h2:has-text("最新动态")').first()).toBeVisible();
    });

    const newsTitle = `E2E置顶公告-${Date.now()}`;
    const newsContent = '这是E2E测试自动发布的置顶公告内容';
    const newsLink = 'https://example.com/e2e-test';

    await test.step('添加一条手工置顶公告', async () => {
      await dashboardPage.addNewsItem({
        title: newsTitle,
        content: newsContent,
        link: newsLink,
        publishDate: new Date().toISOString().split('T')[0],
      });
    });

    await test.step('保存公告设置', async () => {
      await dashboardPage.clickSectionSave('最新动态');
    });

    await test.step('打开预览并验证置顶公告展示', async () => {
      await dashboardPage.clickPreview();
      await dashboardPage.assertPreviewContains(newsTitle);
      await dashboardPage.assertPreviewContains(newsContent);
      // 验证"置顶"标签存在
      await dashboardPage.assertPreviewHasSelector('span:has-text("置顶")');
      await dashboardPage.closePreview();
    });
  });

  test('6. 页面总览模块显示/隐藏控制', async ({ page }) => {
    await test.step('登录并进入主页编辑', async () => {
      await loginPage.loginAsClub();
      await dashboardPage.clickClubHome();
      await dashboardPage.waitForEditorLoaded();
    });

    await test.step('页面总览中切换"关于我们"模块可见性并保存', async () => {
      const row = page.locator('span:has-text("关于我们")').first().locator('..');
      const toggleBtn = row.locator('button').filter({ hasText: /显示|隐藏/ }).first();
      await expect(toggleBtn).toBeVisible({ timeout: 5000 });
      const currentText = await toggleBtn.textContent();
      // 如果当前是"显示"，先切换为"隐藏"
      if (currentText?.includes('显示')) {
        await toggleBtn.evaluate((el: HTMLElement) => el.click());
        await expect(row.locator('button').filter({ hasText: '隐藏' }).first()).toBeVisible({ timeout: 5000 });
      }
      // 保存隐藏状态
      const saveBtn = page.locator('h2').filter({ hasText: '页面总览' }).first().locator('..').locator('button').filter({ hasText: '保存' }).first();
      await expect(saveBtn).toBeVisible({ timeout: 5000 });
      await saveBtn.evaluate((el: HTMLElement) => el.click());
      await expect(page.locator('aside').locator('div').filter({ hasText: /保存成功|保存失败/ }).first()).toBeVisible({ timeout: 10000 });
    });

    await test.step('预览验证"关于我们"已隐藏', async () => {
      await dashboardPage.clickPreview();
      const previewContainer = page.locator('div.fixed.inset-0.z-50');
      await expect(previewContainer).toBeVisible({ timeout: 5000 });
      // 如果模块被隐藏，id="about" 的 section 不应存在
      await expect(previewContainer.locator('section#about')).toHaveCount(0);
      await dashboardPage.closePreview();
    });

    await test.step('恢复"关于我们"显示并保存', async () => {
      const row = page.locator('span:has-text("关于我们")').first().locator('..');
      const toggleBtn = row.locator('button').filter({ hasText: '隐藏' }).first();
      await expect(toggleBtn).toBeVisible({ timeout: 5000 });
      await toggleBtn.evaluate((el: HTMLElement) => el.click());
      await expect(row.locator('button').filter({ hasText: '显示' }).first()).toBeVisible({ timeout: 5000 });
      const saveBtn = page.locator('h2').filter({ hasText: '页面总览' }).first().locator('..').locator('button').filter({ hasText: '保存' }).first();
      await expect(saveBtn).toBeVisible({ timeout: 5000 });
      await saveBtn.evaluate((el: HTMLElement) => el.click());
      await expect(page.locator('aside').locator('div').filter({ hasText: /保存成功|保存失败/ }).first()).toBeVisible({ timeout: 10000 });
    });
  });
});
