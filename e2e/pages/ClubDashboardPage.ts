import { Page, Locator, expect } from '@playwright/test';

export class ClubDashboardPage {
  readonly page: Page;

  // Sidebar navigation
  readonly overviewLink: Locator;
  readonly playerManagementLink: Locator;
  readonly teamManagementLink: Locator;
  readonly batchOrdersLink: Locator;
  readonly weeklyReportsLink: Locator;
  readonly matchReportsLink: Locator;
  readonly clubHomeLink: Locator;
  readonly analyticsLink: Locator;
  readonly statsLink: Locator;
  readonly ordersGroupButton: Locator;
  readonly opsGroupButton: Locator;
  readonly profileSettingsLink: Locator;
  readonly logoutButton: Locator;
  readonly sidebar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator('aside, nav').first();

    // Sidebar - 使用更精确的定位器
    this.overviewLink = this.sidebar.getByRole('link', { name: /工作台/ }).first();
    this.playerManagementLink = this.sidebar.locator('text=球员管理').first();
    this.teamManagementLink = this.sidebar.locator('text=球队管理').first();
    this.batchOrdersLink = this.sidebar.locator('text=批量订单').first();
    this.weeklyReportsLink = this.sidebar.locator('text=周报管理').first();
    this.matchReportsLink = this.sidebar.locator('text=比赛管理').first();
    // 俱乐部主页在侧边栏显示为 "主页编辑"
    this.clubHomeLink = this.sidebar.locator('text=主页编辑').first();
    this.analyticsLink = this.sidebar.locator('text=数据分析').first();
    this.statsLink = this.sidebar.locator('text=数据统计').first();
    this.ordersGroupButton = this.sidebar.getByRole('button', { name: '订单与数据' }).first();
    this.opsGroupButton = this.sidebar.getByRole('button', { name: '运营工具' }).first();
    this.profileSettingsLink = this.sidebar.locator('text=俱乐部设置').first();

    // 退出按钮可能在底部栏
    this.logoutButton = page.locator('text=退出登录').first();
  }

  async goto() {
    await this.page.goto('/club/dashboard');
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

  async clickOverview() {
    await this.clickWithScroll(this.overviewLink);
    await this.page.waitForLoadState('networkidle');
  }

  async clickPlayerManagement() {
    await this.clickWithScroll(this.playerManagementLink);
    await this.page.waitForLoadState('networkidle');
  }

  async clickTeamManagement() {
    await this.clickWithScroll(this.teamManagementLink);
    await this.page.waitForLoadState('networkidle');
  }

  async clickBatchOrders() {
    await this.ensureSidebarItemVisible(this.batchOrdersLink, this.ordersGroupButton);
    await this.clickWithScroll(this.batchOrdersLink);
    await this.page.waitForLoadState('networkidle');
  }

  async clickWeeklyReports() {
    await this.clickWithScroll(this.weeklyReportsLink);
    await this.page.waitForLoadState('networkidle');
  }

  async clickMatchReports() {
    await this.clickWithScroll(this.matchReportsLink);
    await this.page.waitForLoadState('networkidle');
  }

  async clickClubHome() {
    await this.ensureSidebarItemVisible(this.clubHomeLink, this.opsGroupButton);
    const btn = this.page.getByRole('button', { name: '主页编辑' }).first();
    await expect(btn).toBeVisible({ timeout: 5000 });
    // 底部栏可能遮挡侧边栏按钮，使用 evaluate 绕过 pointer-events 拦截
    await btn.evaluate((el: HTMLElement) => el.click());
    // 等待编辑器渲染（页面总览文本出现）
    await expect(this.page.locator('button:has-text("页面总览")').first()).toBeVisible({ timeout: 10000 });
  }

  async clickAnalytics() {
    await this.ensureSidebarItemVisible(this.analyticsLink, this.ordersGroupButton);
    await this.clickWithScroll(this.analyticsLink);
    await this.page.waitForLoadState('networkidle');
  }

  async clickStats() {
    await this.ensureSidebarItemVisible(this.statsLink, this.ordersGroupButton);
    await this.clickWithScroll(this.statsLink);
    await this.page.waitForLoadState('networkidle');
  }

  async logout() {
    // 尝试直接点击，如果不存在则尝试滚动
    if (await this.logoutButton.isVisible()) {
      await this.logoutButton.click({ force: true });
    } else {
      // 如果按钮不可见，尝试通过键盘或JavaScript
      await this.page.evaluate(() => {
        // 清除token和用户信息
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
      });
      await this.page.goto('/login');
    }
    await this.page.waitForLoadState('networkidle');
  }

  // ================== 比赛管理相关方法 ==================

  /**
   * 点击"创建比赛总结"按钮打开弹窗
   */
  async openCreateMatchModal() {
    const createButton = this.page.locator('button:has-text("创建比赛总结")').first();
    await expect(createButton).toBeVisible({ timeout: 5000 });
    await createButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * 填写创建/编辑比赛表单
   */
  async fillMatchForm(data: {
    matchName: string;
    matchDate?: string;
    opponent: string;
    ourScore?: number;
    opponentScore?: number;
  }) {
    // 限制在弹窗内操作，避免匹配到页面背景元素
    const modal = this.page.locator('div').filter({ has: this.page.locator('h2:has-text("创建比赛总结")') }).first();

    // 赛事名称 - 使用更精确的定位器：label 为 "赛事名称" 后面的 input
    const matchNameInput = modal.locator('label:has-text("赛事名称")').locator('+ input, ~ input').first();
    await matchNameInput.fill(data.matchName);

    // 比赛日期
    if (data.matchDate) {
      const dateInput = modal.locator('label:has-text("比赛日期")').locator('+ input, ~ input').first();
      await dateInput.fill(data.matchDate);
    }

    // 对手球队
    const opponentInput = modal.locator('label:has-text("对手球队")').locator('+ input, ~ input').first();
    await opponentInput.fill(data.opponent);

    // 我方进球
    if (data.ourScore !== undefined) {
      const ourScoreInput = modal.locator('label:has-text("我方进球")').locator('+ input, ~ input').first();
      await ourScoreInput.fill(data.ourScore.toString());
    }

    // 对方进球
    if (data.opponentScore !== undefined) {
      const opponentScoreInput = modal.locator('label:has-text("对方进球")').locator('+ input, ~ input').first();
      await opponentScoreInput.fill(data.opponentScore.toString());
    }
  }

  /**
   * 提交比赛表单
   */
  async submitMatchForm() {
    const submitButton = this.page.locator('button:has-text("创建比赛总结")').last();
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 查找并点击包含指定比赛名称的卡片
   */
  async clickMatchCard(matchName: string) {
    const card = this.page.locator('div').filter({ hasText: matchName }).first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * 点击状态筛选Tab
   */
  async clickStatusTab(tab: 'all' | 'pending' | 'player_submitted' | 'completed') {
    const tabLabels: Record<string, string> = {
      all: '全部',
      pending: '待自评',
      player_submitted: '待点评',
      completed: '已完成',
    };
    // Tab 文本可能包含数字（如 "待自评 1"），使用更宽松的正则
    const tabButton = this.page.locator('button').filter({ hasText: new RegExp(`^${tabLabels[tab]}(\\s*\\d*)?$`) }).first();
    await expect(tabButton).toBeVisible({ timeout: 5000 });
    await tabButton.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * 在比赛详情弹窗中点击"填写点评"
   */
  async clickFillCoachReview() {
    const button = this.page.locator('button:has-text("填写点评")').first();
    await expect(button).toBeVisible({ timeout: 5000 });
    await button.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * 填写教练点评表单
   */
  async fillCoachReview(data: {
    overallReview: string;
    tacticalAnalysis?: string;
    keyMoments?: string;
  }) {
    // 整体评价
    const overallLabel = this.page.locator('label:has-text("整体评价")');
    const overallTextarea = overallLabel.locator('..').locator('textarea').first();
    await overallTextarea.fill(data.overallReview);

    // 战术分析
    if (data.tacticalAnalysis) {
      const tacticalLabel = this.page.locator('label:has-text("战术分析")');
      const tacticalTextarea = tacticalLabel.locator('..').locator('textarea').first();
      await tacticalTextarea.fill(data.tacticalAnalysis);
    }

    // 关键时刻
    if (data.keyMoments) {
      const keyMomentsLabel = this.page.locator('label:has-text("关键时刻")');
      const keyMomentsTextarea = keyMomentsLabel.locator('..').locator('textarea').first();
      await keyMomentsTextarea.fill(data.keyMoments);
    }
  }

  /**
   * 提交教练点评
   */
  async submitCoachReview() {
    const submitButton = this.page.locator('button:has-text("提交点评")').first();
    await expect(submitButton).toBeEnabled({ timeout: 5000 });
    await submitButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * 验证比赛卡片存在且显示指定状态
   */
  async assertMatchCardExists(matchName: string, statusLabel?: string) {
    const card = this.page.locator('div').filter({ hasText: matchName }).first();
    await expect(card).toBeVisible({ timeout: 10000 });
    if (statusLabel) {
      const statusBadge = card.locator('text=' + statusLabel).first();
      await expect(statusBadge).toBeVisible({ timeout: 5000 });
    }
  }

  // ================== 俱乐部主页编辑相关方法 ==================

  /**
   * 点击编辑器左侧导航项
   */
  async clickEditorNav(navText: string) {
    const nav = this.page.locator('aside').locator('button').filter({ hasText: navText }).first();
    await expect(nav).toBeVisible({ timeout: 5000 });
    await nav.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * 等待编辑器加载完成
   */
  async waitForEditorLoaded() {
    await expect(this.page.locator('text=页面总览').first()).toBeVisible({ timeout: 15000 });
  }

  /**
   * 点击预览按钮
   */
  async clickPreview() {
    const previewBtn = this.page.locator('aside').locator('button').filter({ hasText: '预览' }).first();
    await previewBtn.click();
    await expect(this.page.locator('button').filter({ hasText: '关闭预览' }).first()).toBeVisible({ timeout: 5000 });
  }

  /**
   * 关闭预览
   */
  async closePreview() {
    const closeBtn = this.page.locator('button').filter({ hasText: '关闭预览' }).first();
    await expect(closeBtn).toBeVisible({ timeout: 5000 });
    await closeBtn.evaluate((el: HTMLElement) => el.click());
    await expect(this.page.locator('button').filter({ hasText: '预览' }).first()).toBeVisible({ timeout: 5000 });
  }

  /**
   * 在指定 section 中点击保存按钮
   */
  async clickSectionSave(sectionTitle: string) {
    const header = this.page.locator('h2').filter({ hasText: sectionTitle }).first().locator('..');
    const saveBtn = header.locator('button').filter({ hasText: '保存' }).first();
    await expect(saveBtn).toBeVisible({ timeout: 5000 });
    await saveBtn.evaluate((el: HTMLElement) => el.click());
    // 等待保存成功/失败提示出现
    await expect(this.page.locator('aside').locator('div').filter({ hasText: /保存成功|保存失败/ }).first()).toBeVisible({ timeout: 10000 });
  }

  /**
   * 编辑 Hero 横幅
   */
  async editHero(data: { title?: string; subtitle?: string; backgroundImage?: string }) {
    if (data.title !== undefined) {
      const input = this.page.locator('label:has-text("主标题")').locator('+ input, ~ input').first();
      await input.fill(data.title);
    }
    if (data.subtitle !== undefined) {
      const input = this.page.locator('label:has-text("副标题")').locator('+ input, ~ input').first();
      await input.fill(data.subtitle);
    }
    if (data.backgroundImage !== undefined) {
      const input = this.page.locator('label:has-text("背景图 URL")').locator('+ input, ~ input').first();
      await input.fill(data.backgroundImage);
    }
  }

  /**
   * 编辑关于我们
   */
  async editAbout(data: { title?: string; content?: string; enabled?: boolean }) {
    // 限定在"关于我们"编辑区域内操作（h2 的父 div 是 SectionHeader，再上两级才是 AboutEd 的根 div）
    const section = this.page.locator('h2:has-text("关于我们")').first().locator('..').locator('..');
    if (data.enabled !== undefined) {
      const checkbox = section.locator('label').filter({ hasText: '启用' }).locator('input[type="checkbox"]');
      await expect(checkbox).toBeVisible({ timeout: 5000 });
      const isChecked = await checkbox.isChecked();
      if (isChecked !== data.enabled) await checkbox.evaluate((el: HTMLInputElement) => el.click());
    }
    if (data.title !== undefined) {
      const input = section.locator('label:has-text("标题")').locator('+ input, ~ input').first();
      await input.fill(data.title);
    }
    if (data.content !== undefined) {
      const textarea = section.locator('label:has-text("内容")').locator('+ textarea, ~ textarea').first();
      await textarea.fill(data.content);
    }
  }

  /**
   * 添加荣誉成就
   */
  async addAchievement(title: string, description: string, count: string) {
    const addBtn = this.page.locator('button:has-text("+ 添加成就")').first();
    await addBtn.click();
    const items = this.page.locator('input[placeholder="标题"]').all();
    const lastTitle = this.page.locator('input[placeholder="标题"]').last();
    const lastDesc = this.page.locator('input[placeholder="描述"]').last();
    const lastCount = this.page.locator('input[placeholder="数值"]').last();
    await lastTitle.fill(title);
    await lastDesc.fill(description);
    await lastCount.fill(count);
  }

  /**
   * 添加手工置顶公告
   */
  async addNewsItem(data: { title: string; content: string; link?: string; publishDate?: string }) {
    const addBtn = this.page.locator('button:has-text("+ 添加置顶公告")').first();
    await addBtn.click();
    const editors = this.page.locator('input[placeholder="公告标题"]').all();
    const lastTitle = this.page.locator('input[placeholder="公告标题"]').last();
    const lastContent = this.page.locator('textarea[placeholder="公告内容"]').last();
    await lastTitle.fill(data.title);
    await lastContent.fill(data.content);
    if (data.link !== undefined) {
      const lastLink = this.page.locator('input[placeholder="链接（可选）"]').last();
      await lastLink.fill(data.link);
    }
    if (data.publishDate !== undefined) {
      const lastDate = this.page.locator('input[type="date"]').last();
      await lastDate.fill(data.publishDate);
    }
  }

  /**
   * 验证预览页面中包含指定文本
   */
  async assertPreviewContains(text: string) {
    const previewContainer = this.page.locator('div.fixed.inset-0.z-50');
    await expect(previewContainer).toBeVisible({ timeout: 5000 });
    await expect(previewContainer.locator('text=' + text).first()).toBeVisible({ timeout: 5000 });
  }

  /**
   * 验证预览页面中包含指定选择器的元素
   */
  async assertPreviewHasSelector(selector: string) {
    const previewContainer = this.page.locator('div.fixed.inset-0.z-50');
    await expect(previewContainer).toBeVisible({ timeout: 5000 });
    await expect(previewContainer.locator(selector).first()).toBeVisible({ timeout: 5000 });
  }
}
