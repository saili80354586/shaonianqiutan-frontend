import { test, expect, request } from '@playwright/test';
import { API_BASE_URL } from './config';

// ─────────────────────────────────────────────
// 工具函数：为指定手机号申请一个后端验证码
// 开发模式下后端固定返回 "123456"
// ─────────────────────────────────────────────
async function sendRegisterCode(phone: string): Promise<string> {
  const ctx = await request.newContext({ baseURL: API_BASE_URL });
  const res = await ctx.post('/api/auth/send-code', {
    data: { phone, type: 'register' },
  });
  const body = await res.json();
  return (body.code as string) || '123456';
}

// ─────────────────────────────────────────────
// 唯一手机号生成（格式：139 + 8 位时间戳 = 11 位）
// ─────────────────────────────────────────────
function uniquePhone(): string {
  const suffix = Date.now().toString().slice(-8);
  return `139${suffix}`;
}

// ─────────────────────────────────────────────
// 辅助：走完 Step1（账号信息）
// ─────────────────────────────────────────────
async function completeStep1(page: any, phone: string, code: string) {
  await page.goto('/register');
  await expect(page.getByPlaceholder('请输入手机号')).toBeVisible({ timeout: 10000 });
  await page.getByPlaceholder('请输入手机号').fill(phone);
  await page.waitForTimeout(500);

  // 必须先点击获取验证码按钮，触发 codeSent 状态
  await page.getByRole('button', { name: '获取验证码' }).click();
  await page.waitForTimeout(1500);

  await page.getByPlaceholder('请输入6位验证码').fill(code);
  await page.getByPlaceholder('至少6位').fill('Test123456');
  await page.getByPlaceholder('再次输入密码').fill('Test123456');
  await page.waitForTimeout(500);

  // 确保没有出现请先获取验证码错误
  const errorEl = page.locator('text=请先获取验证码');
  if (await errorEl.isVisible({ timeout: 2000 }).catch(() => false)) {
    throw new Error('验证码未成功获取，codeSent 状态未设置');
  }

  await page.getByRole('button', { name: '下一步' }).click();
  // Step2 标题
  await expect(page.getByRole('heading', { name: '您是谁？' })).toBeVisible({ timeout: 10000 });
}

// ─────────────────────────────────────────────
// 辅助：走完 Step2（角色选择 → 球员）
// ─────────────────────────────────────────────
async function completeStep2(page: any) {
  // 点击球员角色卡片（精确匹配标题 heading）
  await page.getByRole('heading', { name: '球员', level: 3 }).click();
  await page.getByRole('button', { name: '下一步' }).click();
  // Step3 标题
  await expect(page.getByRole('heading', { name: '基础档案' })).toBeVisible({ timeout: 10000 });
}

// ─────────────────────────────────────────────
// 辅助：走完 Step3（基础信息）
// ─────────────────────────────────────────────
async function completeStep3(page: any, nickname: string = 'E2E测试球员') {
  // 昵称
  const nicknameInput = page.getByPlaceholder(/请输入球员昵称|昵称|球员昵称/);
  await nicknameInput.fill(nickname);

  // 真实姓名（必填）
  const realNameInput = page.getByPlaceholder(/请输入真实姓名|真实姓名|姓名/);
  if (await realNameInput.isVisible().catch(() => false)) {
    await realNameInput.fill('测试球员');
  }

  // 出生日期
  const birthInput = page.locator('input[type="date"]').first();
  if (await birthInput.isVisible().catch(() => false)) await birthInput.fill('2012-05-15');

  // 性别 — 男（精确点击性别按钮，避免误点其他"男"字）
  const genderMale = page.locator('button').filter({ hasText: /^男$/ }).first();
  if (await genderMale.isVisible().catch(() => false)) await genderMale.click();

  // 省份 select
  const selects = page.locator('select');
  const selectCount = await selects.count();
  if (selectCount > 0) await selects.first().selectOption('广东');
  if (selectCount > 1) await selects.nth(1).selectOption({ index: 1 });

  await page.getByRole('button', { name: '下一步' }).click();
  // Step4 标题（足球档案）
  await expect(page.getByRole('heading', { name: '足球档案' })).toBeVisible({ timeout: 10000 });
}

// ─────────────────────────────────────────────
// 辅助：走完 Step4（足球档案）
// ─────────────────────────────────────────────
async function completeStep4(page: any) {
  // 等待 Step4 足球档案标题出现
  await expect(page.getByRole('heading', { name: '足球档案' })).toBeVisible({ timeout: 10000 });

  // 选主要位置（下拉框 select）
  const positionSelect = page.locator('select').first();
  await positionSelect.selectOption('ST');

  // 惯用脚 — 选右脚按钮
  const rightFootBtn = page.locator('button').filter({ hasText: '右脚' }).first();
  if (await rightFootBtn.isVisible().catch(() => false)) await rightFootBtn.click();

  // 身高体重（如果有 input）
  const heightInput = page.getByPlaceholder(/身高|cm/i);
  if (await heightInput.isVisible().catch(() => false)) await heightInput.fill('160');
  const weightInput = page.getByPlaceholder(/体重|kg/i);
  if (await weightInput.isVisible().catch(() => false)) await weightInput.fill('50');

  // 踢球风格 — 点击「速度型」按钮（至少选1个，否则会验证失败）
  const speedStyleBtn = page.locator('button').filter({ hasText: '速度型' }).first();
  if (await speedStyleBtn.isVisible().catch(() => false)) await speedStyleBtn.click();

  // 提交 Step4
  await page.getByRole('button', { name: /下一步|完成|提交/ }).last().click();
}

// ═══════════════════════════════════════════════════
// 测试套件
// ═══════════════════════════════════════════════════

test.describe('球员注册完整流程 E2E', () => {
  let testPhone: string;
  let verifyCode: string;

  test.beforeAll(async () => {
    testPhone = uniquePhone();
    verifyCode = await sendRegisterCode(testPhone);
    console.log(`[setup] 测试手机号: ${testPhone}, 验证码: ${verifyCode}`);
  });

  // ────────────────────────────────────────
  // Step1: 账号信息
  // ────────────────────────────────────────
  test('Step1 账号信息 — 手机号+验证码+密码', async ({ page }) => {
    await completeStep1(page, testPhone, verifyCode);
    await expect(page.getByRole('heading', { name: '您是谁？' })).toBeVisible();
    console.log('[Step1] ✅ 通过 → 进入 Step2（您是谁？）');
  });

  // ────────────────────────────────────────
  // Step2: 角色选择
  // ────────────────────────────────────────
  test('Step2 角色选择 — 选择球员', async ({ page }) => {
    const phone = uniquePhone();
    const code = await sendRegisterCode(phone);
    await completeStep1(page, phone, code);
    await completeStep2(page);
    await expect(page.getByRole('heading', { name: '基础档案' })).toBeVisible();
    console.log('[Step2] ✅ 通过 → 进入 Step3（基础档案）');
  });

  // ────────────────────────────────────────
  // Step3: 基础信息
  // ────────────────────────────────────────
  test('Step3 基础信息 — 填写个人资料', async ({ page }) => {
    const phone = uniquePhone();
    const code = await sendRegisterCode(phone);
    await completeStep1(page, phone, code);
    await completeStep2(page);
    await completeStep3(page);
    // Step4 应该出现足球档案标题
    await expect(page.getByRole('heading', { name: '足球档案' })).toBeVisible({ timeout: 10000 });
    console.log('[Step3] ✅ 通过 → 进入 Step4（足球档案）');
  });

  // ────────────────────────────────────────
  // Step4: 足球档案
  // ────────────────────────────────────────
  test('Step4 足球档案 — 填写球员专属信息', async ({ page }) => {
    const phone = uniquePhone();
    const code = await sendRegisterCode(phone);
    await completeStep1(page, phone, code);
    await completeStep2(page);
    await completeStep3(page);
    await completeStep4(page);

    // Step4 成功后应进入 Step5（完善球员档案）
    await expect(page.getByRole('heading', { name: '完善球员档案' })).toBeVisible({ timeout: 10000 });
    console.log('[Step4] ✅ 通过 → 进入 Step5（完善球员档案）');
  });

  // ────────────────────────────────────────
  // Step5: 完善资料（跳过）+ 最终注册
  // ────────────────────────────────────────
  test('Step5 完善资料 — 跳过并完成注册（正式验证 400 问题）', async ({ page }) => {
    const phone = uniquePhone();
    const code = await sendRegisterCode(phone);
    console.log(`[Step5] 手机号: ${phone}, 验证码: ${code}`);

    // 监听注册 API 请求/响应
    page.on('request', (req) => {
      if (req.url().includes('/api/auth/register')) {
        try {
          console.log('[API Request Body]', JSON.stringify(JSON.parse(req.postData() || '{}'), null, 2));
        } catch {
          console.log('[API Request Body]', req.postData());
        }
      }
    });
    page.on('response', async (resp) => {
      if (resp.url().includes('/api/auth/register')) {
        const body = await resp.json().catch(() => null);
        console.log(`[API Response] status=${resp.status()}`, JSON.stringify(body));
      }
    });

    await completeStep1(page, phone, code);
    await completeStep2(page);
    await completeStep3(page, 'E2E完整球员');
    await completeStep4(page);

    // Step5 有 4 个 Tab：能力标签 → 体测数据 → 家庭信息 → 联系信息
    // "暂不填写"只在最后一步（联系信息）才出现，需要点3次"下一步"
    await expect(page.getByRole('heading', { name: '完善球员档案' })).toBeVisible({ timeout: 10000 });

    // 推进 Tab：能力标签 → 体测数据 → 家庭信息 → 联系信息（共3次下一步）
    for (let i = 0; i < 3; i++) {
      const nextBtn = page.getByRole('button', { name: '下一步' });
      if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // 现在在最后一步（联系信息），"暂不填写"按钮应该出现
    const skipBtn = page.getByRole('button', { name: /暂不填写/ });
    const hasSkip = await skipBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSkip) {
      const registerPromise = page.waitForResponse(
        (resp: any) => resp.url().includes('/api/auth/register'),
        { timeout: 15000 }
      );
      await skipBtn.click();
      const registerResp = await registerPromise;
      const body = await registerResp.json();

      console.log(`[注册API] status=${registerResp.status()}, success=${body.success}, message=${body.message}`);

      // ✅ 核心断言：绝不能 400
      expect(registerResp.status()).toBe(200);
      expect(body.success).toBe(true);

      // ✅ 等待 React 完成客户端导航渲染
      await page.waitForTimeout(3000);
      // 验证已离开注册页（导航到首页，URL 不再是 /register）
      const currentURL = page.url();
      const leftRegister = !currentURL.includes('/register');
      expect(leftRegister).toBe(true);
      console.log('[Step5 完整注册] ✅ 通过，无 400 错误，当前URL:', currentURL);
    } else {
      // 如果没有跳过按钮，直接点完成
      const finishBtn = page.getByRole('button', { name: /完成并进入官网|完成注册/ });
      if (await finishBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        const registerPromise = page.waitForResponse(
          (resp: any) => resp.url().includes('/api/auth/register'),
          { timeout: 15000 }
        );
        await finishBtn.click();
        const registerResp = await registerPromise;
        expect(registerResp.status()).toBe(200);
        await page.waitForTimeout(3000);
        const currentURL = page.url();
        const leftRegister = !currentURL.includes('/register');
        expect(leftRegister).toBe(true);
      }
    }
  });

  // ────────────────────────────────────────
  // 异常场景：同一手机号不能重复发注册验证码
  // ────────────────────────────────────────
  test('异常场景 — 同一手机号不能重复发送注册验证码', async () => {
    // 先用 API 注册一个账号
    const phone = uniquePhone();
    const code1 = await sendRegisterCode(phone);
    const ctx = await request.newContext({ baseURL: API_BASE_URL });
    const regResp = await ctx.post('/api/auth/register', {
      data: {
        phone, code: code1, password: 'Test123456', role: 'player',
        name: '异常测试', nickname: '异常测试', birth_date: '2012-01-01',
        gender: 'male', province: '广东', city: '广州', country: 'CN',
        position: 'ST', foot: 'right',
      },
    });
    const regBody = await regResp.json();
    expect(regBody.success).toBe(true);
    console.log(`[异常场景] 已注册手机号: ${phone}`);

    // 再次对同一手机号发送注册验证码 → 应该失败
    const sendResp = await ctx.post('/api/auth/send-code', {
      data: { phone, type: 'register' },
    });
    const sendBody = await sendResp.json();
    console.log(`[异常场景] 重复 send-code 响应: status=${sendResp.status()}`, JSON.stringify(sendBody));
    expect(sendResp.status()).toBe(400);
    expect(sendBody.success).toBe(false);
    console.log('[异常场景] ✅ 通过，已注册手机号无法再次发送注册验证码');
  });
});
