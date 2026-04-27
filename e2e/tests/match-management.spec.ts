import { test, expect, Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ClubDashboardPage } from '../pages/ClubDashboardPage';
import { PlayerDashboardPage } from '../pages/PlayerDashboardPage';
import { CoachDashboardPage } from '../pages/CoachDashboardPage';

/**
 * 比赛管理功能 E2E 测试
 *
 * 测试覆盖：
 * 1. 教练通过球队详情创建比赛
 * 2. 球员提交比赛自评
 * 3. 教练提交比赛点评
 * 4. 状态流转验证：pending → player_submitted → completed
 * 5. 状态筛选与统计展示
 */

// 生成唯一比赛名称，避免测试数据冲突
const generateMatchName = () => `E2E测试-${Date.now()}`;

/**
 * 通过页面内 fetch 清理测试创建的比赛总结
 */
async function cleanupTestMatch(page: Page, matchName: string) {
  try {
    await page.evaluate(async (name) => {
      const token = localStorage.getItem('token');
      if (!token) return;
      const listRes = await fetch('/api/match-summaries', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!listRes.ok) return;
      const contentType = listRes.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) return;
      const result = await listRes.json();
      const match = result.data?.list?.find((m: any) => m.matchName === name);
      if (match) {
        await fetch(`/api/match-summaries/${match.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    }, matchName);
  } catch (e) {
    console.log('清理测试数据失败（可忽略）:', e);
  }
}

test.describe('比赛管理 - 教练端功能', () => {
  let loginPage: LoginPage;
  let coachPage: CoachDashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    coachPage = new CoachDashboardPage(page);

    // 自动接受 alert / confirm 弹窗
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
  });

  test('教练创建比赛并验证列表展示', async ({ page }) => {
    const matchName = generateMatchName();

    await test.step('1. 教练账号登录', async () => {
      await loginPage.loginAsCoach();
    });

    await test.step('2. 进入我的球队并选择第一个球队', async () => {
      await coachPage.clickMyTeams();
      await expect(page.locator('h1:has-text("我的球队")')).toBeVisible({ timeout: 10000 });
      await coachPage.clickFirstTeamCard();
    });

    await test.step('3. 切换到比赛Tab', async () => {
      await coachPage.clickMatchTab();
    });

    await test.step('4. 点击创建比赛', async () => {
      await coachPage.clickCreateMatchInTeamDetail();
      await expect(page.locator('h2:has-text("创建比赛")')).toBeVisible({ timeout: 5000 });
    });

    await test.step('5. 填写比赛信息并提交', async () => {
      const today = new Date().toISOString().split('T')[0];
      await coachPage.fillCreateMatchFormInTeamDetail({
        matchName,
        matchDate: today,
        opponent: 'E2E测试对手队',
        ourScore: 3,
        opponentScore: 1,
      });
      await coachPage.submitCreateMatchFormInTeamDetail();
    });

    await test.step('6. 验证比赛出现在列表中且状态为待自评', async () => {
      await coachPage.assertMatchExistsInTeamDetail(matchName, '待自评');
    });

    await test.step('7. 清理测试数据', async () => {
      await cleanupTestMatch(page, matchName);
    });
  });
});

test.describe('比赛管理 - 俱乐部端筛选与统计', () => {
  let loginPage: LoginPage;
  let clubPage: ClubDashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    clubPage = new ClubDashboardPage(page);
  });

  test('比赛总结状态筛选与统计卡片展示', async ({ page }) => {
    await test.step('1. 俱乐部账号登录并进入比赛总结', async () => {
      await loginPage.loginAsClub();
      await clubPage.clickMatchReports();
    });

    await test.step('2. 验证统计卡片存在', async () => {
      await expect(page.locator('text=全部').first()).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=待自评').first()).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=待点评').first()).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=已完成').first()).toBeVisible({ timeout: 5000 });
    });

    await test.step('3. 切换各个状态 Tab', async () => {
      await clubPage.clickStatusTab('pending');
      await expect(page.locator('button:has-text("待自评")').filter({ has: page.locator('span') }).first()).toBeVisible({ timeout: 5000 });

      await clubPage.clickStatusTab('player_submitted');
      await expect(page.locator('button:has-text("待点评")').filter({ has: page.locator('span') }).first()).toBeVisible({ timeout: 5000 });

      await clubPage.clickStatusTab('completed');
      await expect(page.locator('button:has-text("已完成")').filter({ has: page.locator('span') }).first()).toBeVisible({ timeout: 5000 });

      await clubPage.clickStatusTab('all');
      await expect(page.locator('button:has-text("全部")').filter({ has: page.locator('span') }).first()).toBeVisible({ timeout: 5000 });
    });
  });
});

test.describe('比赛管理 - 完整状态流转测试', () => {
  let loginPage: LoginPage;
  let coachPage: CoachDashboardPage;
  let playerPage: PlayerDashboardPage;
  let matchName: string;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    coachPage = new CoachDashboardPage(page);
    playerPage = new PlayerDashboardPage(page);
    matchName = generateMatchName();

    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
  });

  test('pending → player_submitted → completed 完整流转', async ({ page }) => {
    test.setTimeout(120000);

    await test.step('1. 教练创建比赛', async () => {
      await loginPage.loginAsCoach();
      await coachPage.clickMyTeams();
      await expect(page.locator('h1:has-text("我的球队")')).toBeVisible({ timeout: 10000 });
      await coachPage.clickFirstTeamCard();
      await coachPage.clickMatchTab();
      await coachPage.clickCreateMatchInTeamDetail();
      const today = new Date().toISOString().split('T')[0];
      await coachPage.fillCreateMatchFormInTeamDetail({
        matchName,
        matchDate: today,
        opponent: 'E2E状态流转测试队',
        ourScore: 2,
        opponentScore: 2,
      });
      await coachPage.submitCreateMatchFormInTeamDetail();
      await coachPage.assertMatchExistsInTeamDetail(matchName, '待自评');
    });

    await test.step('2. 球员提交比赛自评', async () => {
      await loginPage.loginAsPlayer();
      await playerPage.goto();
      await playerPage.clickMatchReports();

      // 验证页面加载
      await expect(page.locator('h1:has-text("我的比赛")')).toBeVisible({ timeout: 10000 });

      // 点击比赛卡片打开详情
      await playerPage.clickMatchCard(matchName);

      // 点击填写自评
      await playerPage.clickFillSelfReview();

      // 填写表单
      const performanceTextarea = page.locator('label:has-text("本场表现")').locator('..').locator('textarea').first();
      await performanceTextarea.fill('本场比赛跑动积极，防守到位，但在进攻端的临门一脚还需要提高。');

      const goalsInput = page.locator('label:has-text("进球数")').locator('..').locator('input');
      await goalsInput.fill('1');

      const assistsInput = page.locator('label:has-text("助攻数")').locator('..').locator('input');
      await assistsInput.fill('0');

      const highlightsInput = page.locator('label:has-text("高光时刻")').locator('..').locator('input, textarea').first();
      await highlightsInput.fill('第35分钟反击破门得分。');

      // 提交自评
      await playerPage.submitPlayerSelfReview();

      // 关闭弹窗后验证状态变为"待点评"
      await page.waitForTimeout(500);
      const card = page.locator('div').filter({ hasText: matchName }).first();
      // 状态 badge 是一个 span，使用更精确的定位器避免匹配到 Tab 按钮
      await expect(card.locator('span').filter({ hasText: '待点评' }).first()).toBeVisible({ timeout: 10000 });
    });

    await test.step('3. 教练提交比赛点评', async () => {
      await loginPage.loginAsCoach();
      await coachPage.clickMyTeams();
      await expect(page.locator('h1:has-text("我的球队")')).toBeVisible({ timeout: 10000 });
      await coachPage.clickFirstTeamCard();
      await coachPage.clickMatchTab();

      // 点击待点评的比赛卡片内的"去点评"按钮（进入 MatchSummaryReview 列表）
      const matchCard = page.locator('div').filter({ hasText: matchName }).first();
      await expect(matchCard).toBeVisible({ timeout: 10000 });
      const reviewButton = matchCard.locator('button:has-text("去点评")').first();
      await expect(reviewButton).toBeVisible({ timeout: 5000 });
      await reviewButton.click();
      await page.waitForTimeout(800);

      // 在 MatchSummaryReview 列表中点击目标比赛卡片进入详情
      await expect(page.locator('h1:has-text("比赛总结管理")')).toBeVisible({ timeout: 10000 });
      const listCard = page.locator('div').filter({ hasText: matchName }).first();
      await expect(listCard).toBeVisible({ timeout: 10000 });
      await listCard.click();
      await page.waitForTimeout(500);

      // 填写教练点评（详情页直接展示表单）
      const overallTextarea = page.locator('label:has-text("整体评价")').locator('+ textarea, ~ textarea').first();
      await overallTextarea.fill('全队整体表现不错，防守端保持了很好的阵型。');

      const tacticalTextarea = page.locator('label:has-text("战术分析")').locator('+ textarea, ~ textarea').first();
      await tacticalTextarea.fill('高位逼抢执行到位，但转换进攻速度可以更快。');

      const keyMomentsTextarea = page.locator('label:has-text("关键时刻")').locator('+ textarea, ~ textarea').first();
      await keyMomentsTextarea.fill('下半场开场10分钟的扳平进球是比赛转折点。');

      // 提交点评
      const submitButton = page.locator('button:has-text("提交点评")').first();
      await expect(submitButton).toBeEnabled({ timeout: 5000 });
      await submitButton.click();

      // 等待 alert 被接受并页面刷新
      await page.waitForTimeout(800);
    });

    await test.step('4. 验证最终状态为已完成', async () => {
      // 从 MatchSummaryReview 返回球队详情页验证
      const backButton = page.locator('button:has-text("返回")').first();
      if (await backButton.isVisible().catch(() => false)) {
        await backButton.click();
        await page.waitForTimeout(500);
      }
      // 如果不在 TeamDetail，直接导航
      if (!await page.locator('h1:has-text("U12一队")').isVisible().catch(() => false)) {
        await page.goto('/coach/dashboard');
        await coachPage.clickMyTeams();
        await expect(page.locator('h1:has-text("我的球队")')).toBeVisible({ timeout: 10000 });
        await coachPage.clickFirstTeamCard();
        await coachPage.clickMatchTab();
      }
      await coachPage.assertMatchExistsInTeamDetail(matchName, '已完成');
    });

    await test.step('5. 清理测试数据', async () => {
      await cleanupTestMatch(page, matchName);
    });
  });
});

test.describe('比赛管理 - 球员端功能', () => {
  let loginPage: LoginPage;
  let playerPage: PlayerDashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    playerPage = new PlayerDashboardPage(page);
  });

  test('球员端-我的比赛页面加载与Tab切换', async ({ page }) => {
    await test.step('1. 球员账号登录', async () => {
      await loginPage.loginAsPlayer();
    });

    await test.step('2. 进入我的比赛', async () => {
      await playerPage.clickMatchReports();
      await expect(page.locator('h1:has-text("我的比赛")')).toBeVisible({ timeout: 10000 });
    });

    await test.step('3. 验证状态统计卡片', async () => {
      await expect(page.locator('text=全部').first()).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=待自评').first()).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=待点评').first()).toBeVisible({ timeout: 5000 });
      await expect(page.locator('text=已完成').first()).toBeVisible({ timeout: 5000 });
    });

    await test.step('4. 切换Tab', async () => {
      const pendingTab = page.locator('button:has-text("待自评")').first();
      if (await pendingTab.isVisible().catch(() => false)) {
        await pendingTab.click();
        await page.waitForTimeout(300);
      }

      const completedTab = page.locator('button:has-text("已完成")').first();
      if (await completedTab.isVisible().catch(() => false)) {
        await completedTab.click();
        await page.waitForTimeout(300);
      }
    });
  });
});
