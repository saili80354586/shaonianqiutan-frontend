import { Page, Locator, expect } from '@playwright/test';

export class AnalystDashboardPage {
  readonly page: Page;

  // Tabs
  readonly overviewTab: Locator;
  readonly pendingTab: Locator;
  readonly activeTab: Locator;
  readonly historyTab: Locator;
  readonly incomeTab: Locator;

  // Header actions
  readonly profileSettingsButton: Locator;
  readonly refreshButton: Locator;
  readonly homeLink: Locator;

  // Overview
  readonly pendingStatCard: Locator;
  readonly activeStatCard: Locator;
  readonly todayDeadlineStatCard: Locator;
  readonly monthlyIncomeStatCard: Locator;

  constructor(page: Page) {
    this.page = page;

    // Tabs - use nav buttons
    this.overviewTab = page.locator('nav button').filter({ hasText: '工作台首页' });
    this.pendingTab = page.locator('nav button').filter({ hasText: '待处理' });
    this.activeTab = page.locator('nav button').filter({ hasText: '进行中' });
    this.historyTab = page.locator('nav button').filter({ hasText: '历史订单' });
    this.incomeTab = page.locator('nav button').filter({ hasText: '收益统计' });

    // Header
    this.profileSettingsButton = page.getByRole('button', { name: '资料设置' });
    this.refreshButton = page.getByRole('button', { name: '刷新' });
    this.homeLink = page.getByRole('link', { name: '官网首页' });

    // Overview stat cards
    this.pendingStatCard = page.locator('text=待处理订单').locator('..').locator('..');
    this.activeStatCard = page.locator('text=进行中').locator('..').locator('..');
    this.todayDeadlineStatCard = page.locator('text=今日截止').locator('..').locator('..');
    this.monthlyIncomeStatCard = page.locator('text=本月收益').locator('..').locator('..');
  }

  async goto() {
    await this.page.goto('/analyst/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  async clickTab(tab: Locator) {
    await tab.scrollIntoViewIfNeeded();
    await tab.click();
    await this.page.waitForTimeout(500);
  }

  async goToOverview() {
    await this.clickTab(this.overviewTab);
  }

  async goToPending() {
    await this.clickTab(this.pendingTab);
  }

  async goToActive() {
    await this.clickTab(this.activeTab);
  }

  async goToHistory() {
    await this.clickTab(this.historyTab);
  }

  async goToIncome() {
    await this.clickTab(this.incomeTab);
  }

  async goToProfileSettings() {
    await this.profileSettingsButton.click();
    await this.page.waitForURL(/\/analyst\/profile\/edit/, { timeout: 10000 });
  }

  // Pending orders actions
  getAcceptOrderButton(orderNo?: string) {
    if (orderNo) {
      return this.page.locator('text=' + orderNo).locator('xpath=../../../../..').getByRole('button', { name: '接受订单' });
    }
    return this.page.getByRole('button', { name: '接受订单' }).first();
  }

  getRejectOrderButton(orderNo?: string) {
    if (orderNo) {
      return this.page.locator('text=' + orderNo).locator('xpath=../../../../..').getByRole('button', { name: '拒绝' });
    }
    return this.page.getByRole('button', { name: '拒绝' }).first();
  }

  getRejectReasonInput() {
    return this.page.locator('input[placeholder="填写拒绝原因..."]');
  }

  getConfirmRejectButton() {
    return this.page.getByRole('button', { name: '确认拒绝' });
  }

  // Active orders actions
  getStartAnalysisButton(orderNo?: string) {
    if (orderNo) {
      return this.page.locator('text=' + orderNo).locator('xpath=../../../../..').getByRole('button', { name: /开始分析|开始分析并剪辑/ });
    }
    return this.page.getByRole('button', { name: /开始分析|开始分析并剪辑/ }).first();
  }

  // Rating Workspace
  getRatingWorkspace() {
    return this.page.locator('.fixed.inset-0');
  }

  getRatingTab(tabName: '整体维度' | '进攻分析' | '防守分析' | '综合评价' | '视频剪辑') {
    return this.page.locator('.fixed.inset-0 nav button').filter({ hasText: tabName });
  }

  getSaveDraftButton() {
    return this.page.locator('.fixed.inset-0').getByRole('button', { name: '保存' });
  }

  getSubmitReportButton() {
    return this.page.locator('.fixed.inset-0').getByRole('button', { name: '提交' });
  }

  getBackButton() {
    return this.page.locator('.fixed.inset-0').getByRole('button').first();
  }

  async fillAllRatings() {
    // Fill all comment textareas with at least 10 chars
    const textareas = this.page.locator('.fixed.inset-0 textarea[placeholder*="表现"]');
    const count = await textareas.count();
    for (let i = 0; i < count; i++) {
      await textareas.nth(i).fill(`该球员在此项表现非常出色，技术动作规范，意识到位，具有很好的发展潜力。`);
    }
  }

  async fillSummary() {
    await this.page.locator('.fixed.inset-0 textarea[placeholder="请对该球员进行综合评价..."]').fill(
      '该球员在本场比赛中表现出色，展现了良好的技术基础和比赛意识。进攻端的跑位和射门选择都值得肯定，防守态度积极。建议在日常训练中加强身体对抗练习，同时注重左脚技术的均衡发展。整体而言，这是一名具有较大发展潜力的年轻球员，值得持续关注。'
    );
  }

  async fillSuggestions() {
    await this.page.locator('.fixed.inset-0 textarea[placeholder="请给出针对性的训练建议..."]').fill(
      '建议加强身体对抗训练，提高双脚均衡性，多参加高水平比赛积累经验。'
    );
  }

  // History orders filters
  getSearchInput() {
    return this.page.locator('input[placeholder*="搜索订单号、球员姓名"]');
  }

  getFilterButton() {
    return this.page.getByRole('button', { name: '筛选' });
  }

  getClearFiltersButton() {
    return this.page.getByText('清除全部筛选');
  }

  getViewReportButton(orderNo?: string) {
    if (orderNo) {
      return this.page.locator('text=' + orderNo).locator('xpath=../../../../..').getByRole('button', { name: '查看报告' });
    }
    return this.page.getByRole('button', { name: '查看报告' }).first();
  }

  // Income time filter
  getTimeRangeDropdownButton() {
    return this.page.locator('.fixed.inset-0').isVisible().then(v => {
      if (v) return this.page.locator('.fixed.inset-0').getByRole('button').filter({ hasText: /最近7天|本月|近3个月|今年/ });
      return this.page.getByRole('button').filter({ hasText: /最近7天|本月|近3个月|今年/ });
    }).catch(() => this.page.getByRole('button').filter({ hasText: /最近7天|本月|近3个月|今年/ }));
  }

  // Report modal
  getReportModal() {
    return this.page.locator('.fixed.inset-0').filter({ has: this.page.locator('text=分析报告') });
  }

  getCloseReportModalButton() {
    return this.page.locator('.fixed.inset-0').getByRole('button', { name: '关闭' });
  }

  getDownloadReportButton() {
    return this.page.locator('.fixed.inset-0').getByRole('button', { name: '下载报告' });
  }
}
