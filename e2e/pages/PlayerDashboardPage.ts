import { Page, Locator, expect } from '@playwright/test';

export class PlayerDashboardPage {
  readonly page: Page;

  // Sidebar navigation
  readonly homeLink: Locator;
  readonly ordersLink: Locator;
  readonly reportsLink: Locator;
  readonly uploadLink: Locator;
  readonly profileLink: Locator;
  readonly growthLink: Locator;
  readonly matchReportsLink: Locator;
  readonly weeklyReportsLink: Locator;
  readonly trainingGroupButton: Locator;
  readonly sidebar: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator('aside, nav').first();

    // 用户中心侧边栏
    this.homeLink = this.sidebar.locator('text=仪表盘').first();
    this.ordersLink = this.sidebar.locator('text=我的订单').first();
    this.reportsLink = this.sidebar.locator('text=我的报告').first();
    this.uploadLink = this.sidebar.locator('text=视频分析').first();
    this.profileLink = this.sidebar.locator('text=个人资料').first();
    this.growthLink = this.sidebar.locator('text=成长记录').first();
    this.matchReportsLink = this.sidebar.locator('text=我的比赛').first();
    this.weeklyReportsLink = this.sidebar.locator('text=我的周报').first();
    this.trainingGroupButton = this.sidebar.getByRole('button', { name: '训练相关' }).first();
    this.logoutButton = page.locator('text=退出登录').first();
  }

  async goto() {
    await this.page.goto('/user-dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async clickWithScroll(locator: Locator) {
    try {
      await locator.scrollIntoViewIfNeeded();
    } catch (e) {
      // ignore scroll errors
    }
    await locator.click({ force: true });
  }

  async ensureSidebarItemVisible(locator: Locator, groupButton?: Locator) {
    if (await locator.isVisible().catch(() => false)) return;
    if (groupButton) {
      await groupButton.click();
      await this.page.waitForTimeout(300);
    }
    await expect(locator).toBeVisible({ timeout: 5000 });
  }

  async clickHome() {
    await this.clickWithScroll(this.homeLink);
    await this.page.waitForLoadState('networkidle');
  }

  async clickOrders() {
    await this.clickWithScroll(this.ordersLink);
    await this.page.waitForLoadState('networkidle');
  }

  async clickReports() {
    await this.clickWithScroll(this.reportsLink);
    await this.page.waitForLoadState('networkidle');
  }

  async clickUpload() {
    await this.clickWithScroll(this.uploadLink);
    await this.page.waitForLoadState('networkidle');
  }

  async clickProfile() {
    await this.clickWithScroll(this.profileLink);
    await this.page.waitForLoadState('networkidle');
  }

  async clickGrowth() {
    await this.clickWithScroll(this.growthLink);
    await this.page.waitForLoadState('networkidle');
  }

  async clickMatchReports() {
    await this.ensureSidebarItemVisible(this.matchReportsLink, this.trainingGroupButton);
    await this.clickWithScroll(this.matchReportsLink);
    await this.page.waitForLoadState('networkidle');
  }

  async clickWeeklyReports() {
    await this.ensureSidebarItemVisible(this.weeklyReportsLink, this.trainingGroupButton);
    await this.clickWithScroll(this.weeklyReportsLink);
    await this.page.waitForLoadState('networkidle');
  }

  async logout() {
    if (await this.logoutButton.isVisible()) {
      await this.logoutButton.click({ force: true });
    } else {
      await this.page.evaluate(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('user');
      });
      await this.page.goto('/login');
    }
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 查找包含指定比赛名称的卡片并点击
   */
  async clickMatchCard(matchName: string) {
    const card = this.page.locator('div').filter({ hasText: matchName }).first();
    await expect(card).toBeVisible({ timeout: 5000 });
    await card.click();
    await this.page.waitForTimeout(300); // 等待弹窗动画
  }

  /**
   * 在比赛详情弹窗中点击"填写自评"
   */
  async clickFillSelfReview() {
    const button = this.page.locator('button:has-text("填写自评")').first();
    await expect(button).toBeVisible({ timeout: 5000 });
    await button.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * 填写球员自评表单
   */
  async fillPlayerSelfReview(data: {
    performance: string;
    goals?: number;
    assists?: number;
    highlights?: string;
    improvements?: string;
    nextMatchGoals?: string;
  }) {
    // 进球数
    if (data.goals !== undefined) {
      const goalsInput = this.page.locator('label:has-text("进球数") + div input, label:has-text("进球")').first().locator('..').locator('input');
      await goalsInput.fill(data.goals.toString());
    }

    // 助攻数
    if (data.assists !== undefined) {
      const assistsInput = this.page.locator('label:has-text("助攻数") + div input, label:has-text("助攻")').first().locator('..').locator('input');
      await assistsInput.fill(data.assists.toString());
    }

    // 本场表现
    const performanceTextarea = this.page.locator('textarea').filter({ hasText: '' }).first();
    // 更精确：找"本场表现"标签附近的textarea
    const perfLabel = this.page.locator('label:has-text("本场表现")');
    if (await perfLabel.isVisible().catch(() => false)) {
      const perfTextarea = perfLabel.locator('..').locator('textarea').first();
      await perfTextarea.fill(data.performance);
    }

    // 高光时刻
    if (data.highlights) {
      const highlightsLabel = this.page.locator('label:has-text("高光时刻")');
      if (await highlightsLabel.isVisible().catch(() => false)) {
        const highlightsInput = highlightsLabel.locator('..').locator('input, textarea').first();
        await highlightsInput.fill(data.highlights);
      }
    }

    // 不足与改进
    if (data.improvements) {
      const improvementsLabel = this.page.locator('label:has-text("不足与改进")');
      if (await improvementsLabel.isVisible().catch(() => false)) {
        const improvementsInput = improvementsLabel.locator('..').locator('textarea').first();
        await improvementsInput.fill(data.improvements);
      }
    }

    // 下场期待
    if (data.nextMatchGoals) {
      const nextGoalsLabel = this.page.locator('label:has-text("下场期待"), label:has-text("下场目标")');
      if (await nextGoalsLabel.isVisible().catch(() => false)) {
        const nextGoalsInput = nextGoalsLabel.locator('..').locator('input, textarea').first();
        await nextGoalsInput.fill(data.nextMatchGoals);
      }
    }
  }

  /**
   * 提交球员自评
   */
  async submitPlayerSelfReview() {
    const submitButton = this.page.locator('button:has-text("提交自评")').first();
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();
    // 等待提交成功，弹窗关闭或状态更新
    await this.page.waitForLoadState('networkidle');
  }
}
