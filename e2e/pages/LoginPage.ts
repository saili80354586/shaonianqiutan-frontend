import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly clubDemoButton: Locator;
  readonly coachDemoButton: Locator;
  readonly playerDemoButton: Locator;
  readonly analystDemoButton: Locator;
  readonly adminDemoButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // 俱乐部演示账号按钮
    this.clubDemoButton = page.locator('button').filter({ hasText: /俱乐部/ }).first();
    // 教练演示账号按钮
    this.coachDemoButton = page.locator('button').filter({ hasText: /教练/ }).first();
    // 球员演示账号按钮（第一个球员：王小明）
    this.playerDemoButton = page.locator('button').filter({ hasText: /王小明/ }).first();
    // 分析师演示账号按钮
    this.analystDemoButton = page.locator('button').filter({ hasText: /分析师/ }).first();
    // 管理员演示账号按钮
    this.adminDemoButton = page.locator('button').filter({ hasText: /管理员/ }).first();
  }

  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async expandDemoAccounts() {
    const expandButton = this.page.locator('button').filter({ hasText: /展开测试账号/ }).first();
    await expect(expandButton).toBeVisible({ timeout: 10000 });
    await expandButton.click();
    // 等待展开后的内容出现（管理员区域作为标志）
    await expect(this.page.locator('text=管理员').first()).toBeVisible({ timeout: 5000 });
  }

  async loginAsClub() {
    await this.goto();
    await this.expandDemoAccounts();
    await this.clubDemoButton.click();
    await this.page.waitForURL(/\/club\/dashboard/, { timeout: 15000 });
  }

  async loginAsCoach() {
    await this.goto();
    await this.expandDemoAccounts();
    await this.coachDemoButton.click();
    await this.page.waitForURL(/\/coach\/dashboard/, { timeout: 15000 });
  }

  async loginAsPlayer() {
    await this.goto();
    await this.expandDemoAccounts();
    await this.playerDemoButton.click();
    await this.page.waitForURL(/\/user-dashboard/, { timeout: 15000 });
  }

  async loginAsAnalyst() {
    await this.goto();
    await this.expandDemoAccounts();
    await this.analystDemoButton.click();
    await this.page.waitForURL(/\/analyst\/dashboard/, { timeout: 15000 });
  }

  async loginAsAdmin() {
    await this.goto();
    await this.expandDemoAccounts();
    await this.adminDemoButton.click();
    await this.page.waitForURL(/\/admin\/dashboard/, { timeout: 15000 });
  }
}
