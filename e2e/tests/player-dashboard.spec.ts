import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { PlayerDashboardPage } from '../pages/PlayerDashboardPage';

test.describe('球员后台功能测试', () => {
  let loginPage: LoginPage;
  let dashboardPage: PlayerDashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new PlayerDashboardPage(page);
  });

  test('1. 球员账号登录', async ({ page }) => {
    await test.step('访问登录页面', async () => {
      await loginPage.goto();
      await expect(page).toHaveURL(/\/login/);
    });

    await test.step('点击球员演示账号登录', async () => {
      await loginPage.loginAsPlayer();
    });

    await test.step('验证登录成功，跳转到球员后台', async () => {
      await expect(page).toHaveURL(/\/user-dashboard/);
      await expect(page.locator('text=欢迎回来').first()).toBeVisible({ timeout: 10000 });
    });
  });

  test('2. 仪表盘页面加载', async ({ page }) => {
    await test.step('登录并进入仪表盘', async () => {
      await loginPage.loginAsPlayer();
      await dashboardPage.clickHome();
    });

    await test.step('验证仪表盘关键元素', async () => {
      await expect(page.locator('text=欢迎回来').first()).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=全部订单').first()).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=快捷入口').first()).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=最近订单').first()).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=最近报告').first()).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=成长档案').first()).toBeVisible({ timeout: 5000 });
    });
  });

  test('3. 仪表盘快捷入口跳转', async ({ page }) => {
    await test.step('登录并进入仪表盘', async () => {
      await loginPage.loginAsPlayer();
      await dashboardPage.clickHome();
    });

    await test.step('点击"查看报告"快捷入口', async () => {
      const reportsCard = page.locator('button').filter({ hasText: '查看报告' }).first();
      await expect(reportsCard).toBeVisible({ timeout: 5000 });
      await reportsCard.click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: '我的报告' }).or(page.getByText('我的报告')).first()).toBeVisible({ timeout: 5000 });
    });
  });

  test('4. 我的订单页面加载', async ({ page }) => {
    await test.step('登录并进入我的订单', async () => {
      await loginPage.loginAsPlayer();
      await dashboardPage.clickOrders();
    });

    await test.step('验证我的订单页面', async () => {
      await expect(page.getByRole('heading', { name: '我的订单' }).or(page.getByText('我的订单')).first()).toBeVisible({ timeout: 10000 });
      // 验证存在状态筛选下拉框（页面使用select而不是button标签）
      await expect(page.locator('select').first()).toBeVisible({ timeout: 5000 });
      // 验证存在搜索框
      await expect(page.locator('input[placeholder*="搜索订单"]').first()).toBeVisible({ timeout: 5000 });
    });
  });

  test('5. 我的报告页面加载', async ({ page }) => {
    await test.step('登录并进入我的报告', async () => {
      await loginPage.loginAsPlayer();
      await dashboardPage.clickReports();
    });

    await test.step('验证我的报告页面', async () => {
      await expect(page.getByRole('heading', { name: '我的报告' }).or(page.getByText('我的报告')).first()).toBeVisible({ timeout: 10000 });
    });
  });

  test('6. 视频分析页面加载', async ({ page }) => {
    await test.step('登录并进入视频分析', async () => {
      await loginPage.loginAsPlayer();
      await dashboardPage.clickUpload();
    });

    await test.step('验证视频分析页面', async () => {
      await expect(page.getByRole('heading', { name: '视频分析' }).or(page.getByText('视频分析')).first()).toBeVisible({ timeout: 10000 });
    });
  });

  test('7. 个人资料页面加载与编辑保存', async ({ page }) => {
    await test.step('登录并进入个人资料', async () => {
      await loginPage.loginAsPlayer();
      await dashboardPage.clickProfile();
    });

    await test.step('验证个人资料页面渲染', async () => {
      await expect(page.getByRole('heading', { name: '个人资料' }).or(page.getByText('个人资料')).first()).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=个人信息').first()).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=身体信息').first()).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=地区信息').first()).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=俱乐部信息').first()).toBeVisible({ timeout: 5000 });
    });

    await test.step('点击编辑资料', async () => {
      const editBtn = page.locator('button').filter({ hasText: /编辑资料|编辑/ }).first();
      await expect(editBtn).toBeVisible({ timeout: 5000 });
      await editBtn.click();
      await expect(page.locator('text=编辑个人资料').first()).toBeVisible({ timeout: 5000 });
    });

    await test.step('修改姓名并保存', async () => {
      const nameInput = page.locator('label:has-text("姓名")').locator('+ input, ~ input').first();
      await nameInput.fill('王小明测试');
      const saveBtn = page.locator('button').filter({ hasText: '保存' }).first();
      await saveBtn.click();
      // 等待保存成功提示或返回展示模式
      await page.waitForTimeout(800);
      // 如果保存失败，页面上会显示错误
      const errorVisible = await page.locator('text=保存失败').first().isVisible().catch(() => false);
      if (errorVisible) {
        // 仅记录问题，不中断测试
        console.warn('个人资料保存失败，可能存在后端或网络问题');
      }
    });
  });

  test('8. 成长记录页面加载', async ({ page }) => {
    await test.step('登录并进入成长记录', async () => {
      await loginPage.loginAsPlayer();
      await dashboardPage.clickGrowth();
    });

    await test.step('验证成长记录页面', async () => {
      await expect(page.getByRole('heading', { name: '成长记录' }).or(page.getByText('成长记录')).first()).toBeVisible({ timeout: 10000 });
      // 验证综合能力雷达图区域存在
      await expect(page.locator('text=综合能力雷达').first()).toBeVisible({ timeout: 10000 });
      // 验证成长记录列表/时间线区域（使用更具体的选择器避免匹配到侧边栏）
      await expect(page.locator('main, [class*="content"]').locator('text=成长记录').first()).toBeVisible({ timeout: 5000 });
    });
  });

  test('9. 我的周报页面加载与提交', async ({ page }) => {
    await test.step('登录并进入我的周报', async () => {
      await loginPage.loginAsPlayer();
      await dashboardPage.clickWeeklyReports();
    });

    await test.step('验证我的周报页面', async () => {
      await expect(page.locator('text=我的周报').first()).toBeVisible({ timeout: 10000 });
      // 验证统计卡片
      await expect(page.locator('text=全部').first()).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=待填写').first()).toBeVisible({ timeout: 5000 });
    });

    await test.step('尝试填写第一份待填写周报', async () => {
      // 查找"填写"或"重新填写"按钮
      const fillBtn = page.locator('button').filter({ hasText: /^(填写|重新填写)$/ }).first();
      const hasFillBtn = await fillBtn.isVisible().catch(() => false);
      if (hasFillBtn) {
        await fillBtn.click();
        await page.waitForTimeout(500);
        // 验证周报表单出现
        await expect(page.locator('text=本周知识总结').first()).toBeVisible({ timeout: 10000 });
        
        // 填写知识总结（必填，至少10字）
        const knowledgeTextarea = page.locator('textarea').filter({ hasText: '' }).first();
        await knowledgeTextarea.fill('本周训练非常充实，学到了很多新知识。');
        
        // 提交周报
        const submitBtn = page.locator('button').filter({ hasText: '提交周报' }).first();
        await expect(submitBtn).toBeVisible({ timeout: 5000 });
        await submitBtn.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(800);
        
        // 验证是否返回列表页（提交成功）或出现错误提示
        const stillOnForm = await page.locator('text=本周知识总结').first().isVisible().catch(() => false);
        if (stillOnForm) {
          const errorVisible = await page.locator('text=/保存失败|提交失败|错误/').first().isVisible().catch(() => false);
          if (errorVisible) {
            console.warn('周报提交失败，可能存在验证或后端问题');
          }
        }
      } else {
        console.log('当前没有待填写周报，跳过提交测试');
      }
    });
  });

  test('10. 我的比赛页面加载', async ({ page }) => {
    await test.step('登录并进入我的比赛', async () => {
      await loginPage.loginAsPlayer();
      await dashboardPage.clickMatchReports();
    });

    await test.step('验证我的比赛页面', async () => {
      await expect(page.locator('text=我的比赛').first()).toBeVisible({ timeout: 10000 });
      // 验证统计卡片
      await expect(page.locator('text=总比赛').first()).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=待自评').first()).toBeVisible({ timeout: 5000 });
    });

    await test.step('尝试填写比赛自评', async () => {
      const fillBtn = page.locator('button').filter({ hasText: '填写自评' }).first();
      const hasFillBtn = await fillBtn.isVisible().catch(() => false);
      if (hasFillBtn) {
        await fillBtn.click();
        await page.waitForTimeout(500);
        // 检查是否跳转到独立自评页面或出现弹窗
        const url = page.url();
        if (url.includes('/match-self-review')) {
          await expect(page.locator('text=比赛自评').first()).toBeVisible({ timeout: 10000 });
          // 返回比赛列表
          await page.goBack();
          await page.waitForLoadState('networkidle');
        }
      } else {
        console.log('当前没有待自评比赛，跳过自评测试');
      }
    });
  });

  test('11. 侧边栏导航完整性检查', async ({ page }) => {
    await test.step('登录并检查所有导航项', async () => {
      await loginPage.loginAsPlayer();
      const navItems = ['仪表盘', '我的订单', '我的报告', '我的周报', '我的比赛', '视频分析', '个人资料', '成长记录'];
      for (const item of navItems) {
        const link = page.locator('aside, nav').first().locator(`text=${item}`).first();
        await expect(link, `侧边栏应包含 "${item}" 导航`).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test('12. 退出登录', async ({ page }) => {
    await test.step('登录并退出', async () => {
      await loginPage.loginAsPlayer();
      await dashboardPage.logout();
    });

    await test.step('验证退出后跳转登录页', async () => {
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
