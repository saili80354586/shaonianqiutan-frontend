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
    this.clubDemoButton = page.getByRole('button', { name: /上海绿地青训俱乐部/ });
    this.coachDemoButton = page.getByRole('button', { name: /王振宇/ });
    this.playerDemoButton = page.getByRole('button', { name: /林子墨/ });
    this.analystDemoButton = page.getByRole('button', { name: /陈知远/ });
    this.adminDemoButton = page.getByRole('button', { name: /平台管理员/ });
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
