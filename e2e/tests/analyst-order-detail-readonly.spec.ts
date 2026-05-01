import { APIRequestContext, expect, Page, test } from '@playwright/test';
import { apiUrl } from '../config';

const DEMO_ANALYST_PHONES = [
  '13800000030',
  '13800000031',
  '13800000032',
  '13800000033',
];

type LoginData = {
  token: string;
  user: Record<string, unknown>;
};

type LoginResponse = {
  success: boolean;
  data?: LoginData;
};

type AnalystOrder = {
  id: number;
  order_no: string;
  status: string;
  player_name?: string;
  user?: {
    name?: string;
    nickname?: string;
  };
};

type OrderListResponse = {
  success: boolean;
  data?: {
    list?: AnalystOrder[];
  };
};

type OrderKind = 'pending' | 'active';

type AnalystOrderFixture = {
  phone: string;
  auth: LoginData;
  order: AnalystOrder;
};

const loginByPhone = async (request: APIRequestContext, phone: string): Promise<LoginData> => {
  const response = await request.post(apiUrl('/api/auth/login'), {
    data: { phone, password: '123456' },
  });
  expect(response.ok()).toBeTruthy();

  const body = await response.json() as LoginResponse;
  expect(body.success).toBeTruthy();
  expect(body.data?.token).toBeTruthy();
  expect(body.data?.user).toBeTruthy();

  return body.data as LoginData;
};

const fetchOrders = async (
  request: APIRequestContext,
  auth: LoginData,
  kind: OrderKind,
): Promise<AnalystOrder[]> => {
  const response = await request.get(apiUrl(`/api/analyst/orders/${kind}`), {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  expect(response.ok()).toBeTruthy();

  const body = await response.json() as OrderListResponse;
  expect(body.success).toBeTruthy();

  return body.data?.list || [];
};

const findAnalystWithOrder = async (
  request: APIRequestContext,
  kind: OrderKind,
): Promise<AnalystOrderFixture> => {
  for (const phone of DEMO_ANALYST_PHONES) {
    const auth = await loginByPhone(request, phone);
    const orders = await fetchOrders(request, auth, kind);
    const order = orders[0];
    if (order) return { phone, auth, order };
  }

  throw new Error(`当前演示库没有可验证的分析师 ${kind} 订单`);
};

const openAnalystDashboard = async (page: Page, auth: LoginData) => {
  await page.goto('/');
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('currentRole', 'analyst');
  }, auth);

  await page.goto('/analyst/dashboard');
  await expect(page.getByText('工作台首页')).toBeVisible({ timeout: 15000 });
};

const openOrderTab = async (page: Page, label: '待处理' | '进行中') => {
  const tab = page.getByRole('button', { name: new RegExp(`^${label}(?:\\s|$)`) }).first();
  await expect(tab).toBeVisible({ timeout: 15000 });
  await tab.click();
  await expect(page.getByText(`${label}订单`).first()).toBeVisible({ timeout: 15000 });
};

const openOrderDetail = async (page: Page, orderNo: string) => {
  const orderNoText = page.getByText(orderNo, { exact: true }).first();
  await expect(orderNoText).toBeVisible({ timeout: 15000 });

  const orderCard = orderNoText.locator('xpath=ancestor::div[contains(@class, "border-gray-100")][1]');
  await orderCard.getByRole('button', { name: '详情' }).click();
};

const expectDetailModal = async (page: Page, order: AnalystOrder) => {
  await expect(page.getByText('订单信息')).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('球员基础资料')).toBeVisible();
  await expect(page.getByText('位置与归属')).toBeVisible();
  await expect(page.getByText('技术特点')).toBeVisible();
  await expect(page.getByText('资料仅用于当前分析任务')).toBeVisible();

  const playerName = order.user?.name || order.player_name;
  if (playerName) {
    await expect(page.getByText(playerName).first()).toBeVisible();
  }
};

const expectOrderStatusUnchanged = async (
  request: APIRequestContext,
  auth: LoginData,
  kind: OrderKind,
  originalOrder: AnalystOrder,
) => {
  const orders = await fetchOrders(request, auth, kind);
  const currentOrder = orders.find(order => order.id === originalOrder.id);
  expect(currentOrder?.status).toBe(originalOrder.status);
};

test.describe('分析师订单详情入口 - 只读回归', () => {
  test('进行中订单可以打开订单和球员资料详情，且不改变订单状态', async ({ page, request }) => {
    const fixture = await findAnalystWithOrder(request, 'active');

    await openAnalystDashboard(page, fixture.auth);
    await openOrderTab(page, '进行中');
    await openOrderDetail(page, fixture.order.order_no);
    await expectDetailModal(page, fixture.order);
    await page.getByLabel('关闭详情').click();

    await expectOrderStatusUnchanged(request, fixture.auth, 'active', fixture.order);
    test.info().annotations.push({ type: 'demo-account', description: fixture.phone });
  });

  test('待处理订单可以先查看详情，不会触发接单或拒单', async ({ page, request }) => {
    const fixture = await findAnalystWithOrder(request, 'pending');

    await openAnalystDashboard(page, fixture.auth);
    await openOrderTab(page, '待处理');
    await openOrderDetail(page, fixture.order.order_no);
    await expectDetailModal(page, fixture.order);
    await page.getByLabel('关闭详情').click();

    await expectOrderStatusUnchanged(request, fixture.auth, 'pending', fixture.order);
    test.info().annotations.push({ type: 'demo-account', description: fixture.phone });
  });
});
