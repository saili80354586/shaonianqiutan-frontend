import { test, expect } from '@playwright/test';

test.describe('用户认证流程', () => {
  test.describe('登录', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
    });

    test('应该显示登录表单', async ({ page }) => {
      // 登录表单
      await expect(page.getByRole('textbox', { name: '请输入账号' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: '请输入密码' })).toBeVisible();
      await expect(page.getByRole('button', { name: '登录' })).toBeVisible();
    });

    test('空表单提交应该显示错误', async ({ page }) => {
      // 点击登录按钮但不填写表单
      await page.getByRole('button', { name: '登录' }).click();
      // 验证HTML5原生验证生效（表单有required属性）
      // 输入框会获得焦点，浏览器会阻止提交并显示验证提示
      const usernameInput = page.getByRole('textbox', { name: '请输入账号' });
      await expect(usernameInput).toBeFocused();
    });

    test('应该可以切换到注册页', async ({ page }) => {
      // 点击"注册新账号"链接
      await page.getByRole('link', { name: '注册新账号' }).click();
      await expect(page).toHaveURL(/.*register/);
    });

    test('应该可以跳转到找回密码页', async ({ page }) => {
      // 点击"忘记密码？"链接
      await page.getByRole('link', { name: '忘记密码？' }).click();
      await expect(page).toHaveURL(/.*forgot-password/);
    });

    test('演示账号管理员登录应该成功', async ({ page }) => {
      // 点击管理员演示账号
      await page.getByRole('button', { name: /管理员 admin \/ admin123/ }).click();
      // 等待登录成功并跳转
      await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
      // 验证跳转到管理员后台（使用更具体的选择器）
      await expect(page.getByRole('heading', { name: '管理后台' })).toBeVisible();
    });

    test('演示账号分析师登录应该成功', async ({ page }) => {
      // 点击分析师演示账号
      await page.getByRole('button', { name: /分析师 analyst \/ analyst123/ }).click();
      // 等待登录成功并跳转
      await expect(page).toHaveURL(/.*analyst\/dashboard|.*dashboard/, { timeout: 10000 });
    });
  });

  test.describe('注册', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/register');
    });

    test('应该显示注册表单', async ({ page }) => {
      // 注册第一步显示账号信息表单
      await expect(page.getByRole('textbox', { name: '请输入手机号' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: '请输入6位验证码' })).toBeVisible();
      await expect(page.getByRole('button', { name: '获取验证码' })).toBeVisible();
    });

    test('应该可以切换到登录页', async ({ page }) => {
      // 点击"立即登录"链接
      await page.getByRole('link', { name: '立即登录' }).click();
      await expect(page).toHaveURL(/.*login/);
    });
  });
});
