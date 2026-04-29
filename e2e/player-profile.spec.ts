import { test, expect } from '@playwright/test';
import { apiUrl } from './config';

const TEST_PHONE = '13800002001';
const TEST_PASSWORD = '123456';

test.describe('球员资料编辑', () => {
  test('页面可以正常加载', async ({ page }) => {
    // 先登录
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const usernameInput = page.locator('input[placeholder="请输入账号"]');
    await usernameInput.fill(TEST_PHONE);
    
    const passwordInput = page.locator('input[placeholder="请输入密码"]');
    await passwordInput.fill(TEST_PASSWORD);
    
    await page.click('button[type="submit"]');
    await page.waitForURL(/user-dashboard/, { timeout: 10000 });
    
    // 进入资料页
    await page.goto('/player/profile');
    await page.waitForLoadState('networkidle');
    
    // 验证页面正常加载
    expect(page.url()).toContain('/player/profile');
  });
});

test.describe('球员资料 API 验证', () => {
  // 使用 request fixture 直接调用 API，不需要浏览器
  test('登录并获取球员资料', async ({ request }) => {
    const loginRes = await request.post(apiUrl('/api/auth/login'), {
      data: { phone: TEST_PHONE, password: TEST_PASSWORD },
    });
    expect(loginRes.ok()).toBeTruthy();
    const loginBody = await loginRes.json();
    expect(loginBody.success).toBe(true);
    expect(loginBody.data.token).toBeDefined();

    const token = loginBody.data.token;

    const profileRes = await request.get(apiUrl('/api/player/profile'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(profileRes.ok()).toBeTruthy();
    const profileBody = await profileRes.json();
    expect(profileBody.success).toBe(true);
    expect(profileBody.data.profile.nickname).toBeDefined();
  });

  test('更新球员资料', async ({ request }) => {
    const loginRes = await request.post(apiUrl('/api/auth/login'), {
      data: { phone: TEST_PHONE, password: TEST_PASSWORD },
    });
    const token = (await loginRes.json()).data.token;

    const updateRes = await request.put(apiUrl('/api/player/profile'), {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({ nickname: '王小明' }),
    });
    expect(updateRes.ok()).toBeTruthy();
    const body = await updateRes.json();
    expect(body.success).toBe(true);
  });

  test('球探地图返回真实数据', async ({ request }) => {
    const mapRes = await request.get(apiUrl('/api/scout/players/101/map-profile'));
    expect(mapRes.ok()).toBeTruthy();
    const body = await mapRes.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBeDefined();
    expect(body.data.playing_style).toBeDefined();
  });
});
