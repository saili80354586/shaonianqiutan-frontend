import { Page, Locator, expect } from '@playwright/test';

export class CoachDashboardPage {
  readonly page: Page;

  // Sidebar navigation
  readonly myTeamsLink: Locator;
  readonly notificationsLink: Locator;
  readonly profileLink: Locator;
  readonly sidebar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator('aside, nav').first();

    // Sidebar links
    this.myTeamsLink = this.sidebar.locator('text=我的球队').first();
    this.notificationsLink = this.sidebar.locator('text=通知').first();
    this.profileLink = this.sidebar.locator('text=个人设置').first();
  }

  async goto() {
    await this.page.goto('/coach/dashboard');
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

  async clickMyTeams() {
    await this.clickWithScroll(this.myTeamsLink);
    await this.page.waitForLoadState('networkidle');
  }

  async clickNotifications() {
    await this.clickWithScroll(this.notificationsLink);
    await this.page.waitForLoadState('networkidle');
  }

  async clickProfile() {
    await this.clickWithScroll(this.profileLink);
    await this.page.waitForLoadState('networkidle');
  }

  async clickFirstTeamCard() {
    // 点击第一个包含 "U12一队" 的球队卡片
    const firstCard = this.page.locator('h3:has-text("U12一队")').locator('..').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    await firstCard.click();
    await this.page.waitForLoadState('networkidle');
  }

  // ================== 球队详情页（复用 TeamDetail）相关方法 ==================

  async clickMatchTab() {
    const matchTab = this.page.locator('button:has-text("比赛")').first();
    await expect(matchTab).toBeVisible({ timeout: 5000 });
    await matchTab.click();
    await this.page.waitForTimeout(300);
  }

  async clickCreateMatchInTeamDetail() {
    const createButton = this.page.locator('button:has-text("创建比赛")').first();
    await expect(createButton).toBeVisible({ timeout: 5000 });
    await createButton.click();
    await this.page.waitForTimeout(300);
  }

  async fillCreateMatchFormInTeamDetail(data: {
    matchName: string;
    matchDate?: string;
    opponent: string;
    ourScore?: number;
    opponentScore?: number;
  }) {
    const modal = this.page.locator('div').filter({ has: this.page.locator('h2:has-text("创建比赛")') }).first();

    const matchNameInput = modal.locator('label:has-text("赛事名称")').locator('+ input, ~ input').first();
    await matchNameInput.fill(data.matchName);

    if (data.matchDate) {
      const dateInput = modal.locator('label:has-text("比赛日期")').locator('+ input, ~ input').first();
      await dateInput.fill(data.matchDate);
    }

    const opponentInput = modal.locator('label:has-text("对手球队")').locator('+ input, ~ input').first();
    await opponentInput.fill(data.opponent);

    if (data.ourScore !== undefined) {
      const ourScoreInput = modal.locator('label:has-text("我方进球")').locator('+ input, ~ input').first();
      await ourScoreInput.fill(data.ourScore.toString());
    }

    if (data.opponentScore !== undefined) {
      const opponentScoreInput = modal.locator('label:has-text("对方进球")').locator('+ input, ~ input').first();
      await opponentScoreInput.fill(data.opponentScore.toString());
    }
  }

  async submitCreateMatchFormInTeamDetail() {
    const modal = this.page.locator('div').filter({ has: this.page.locator('h2:has-text("创建比赛")') }).first();
    const submitButton = modal.locator('button:has-text("创建比赛")').last();
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async clickMatchReviewButton() {
    const reviewButton = this.page.locator('button:has-text("去点评"), button:has-text("查看")').first();
    await expect(reviewButton).toBeVisible({ timeout: 5000 });
    await reviewButton.click();
    await this.page.waitForTimeout(500);
  }

  async fillCoachReviewInTeamDetail(data: {
    overallReview: string;
    tacticalAnalysis?: string;
    keyMoments?: string;
  }) {
    const overallTextarea = this.page.locator('label:has-text("整体评价")').locator('..').locator('textarea').first();
    await overallTextarea.fill(data.overallReview);

    if (data.tacticalAnalysis) {
      const tacticalTextarea = this.page.locator('label:has-text("战术分析")').locator('..').locator('textarea').first();
      await tacticalTextarea.fill(data.tacticalAnalysis);
    }

    if (data.keyMoments) {
      const keyMomentsTextarea = this.page.locator('label:has-text("关键时刻")').locator('..').locator('textarea').first();
      await keyMomentsTextarea.fill(data.keyMoments);
    }
  }

  async submitCoachReviewInTeamDetail() {
    const submitButton = this.page.locator('button:has-text("提交点评")').first();
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async assertMatchExistsInTeamDetail(matchName: string, statusLabel?: string) {
    const card = this.page.locator('div').filter({ hasText: matchName }).first();
    await expect(card).toBeVisible({ timeout: 10000 });
    if (statusLabel) {
      await expect(card.locator('text=' + statusLabel).first()).toBeVisible({ timeout: 5000 });
    }
  }
}
