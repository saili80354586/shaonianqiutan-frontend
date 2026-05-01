import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import type { APIRequestContext, Page } from '@playwright/test';
import { apiUrl } from '../config';

const DB_PATH = process.env.E2E_DB_PATH
  || process.env.BACKEND_DB_PATH
  || resolve(process.cwd(), '../shaonianqiutan-backend/shaonianqiutan.db');
const SQLITE_BIN = process.env.SQLITE_BIN || 'sqlite3';

const ADMIN_PHONE = '13800000001';
const ANALYST_PHONE = '13800000030';
const PLAYER_PHONE = '13800002001';

type LoginData = {
  token: string;
  user: Record<string, unknown>;
};

type LoginResponse = {
  success: boolean;
  data?: LoginData;
};

const sqlString = (value: string | number) => `'${String(value).replace(/'/g, "''")}'`;

const runSql = (sql: string) => {
  if (!existsSync(DB_PATH)) {
    throw new Error(`E2E database not found: ${DB_PATH}`);
  }
  return execFileSync(SQLITE_BIN, ['-cmd', '.timeout 5000', DB_PATH, sql], { encoding: 'utf8' }).trim();
};

const queryNumber = (sql: string) => {
  const value = Number(runSql(sql).split(/\r?\n/)[0] || '0');
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Expected positive numeric query result for: ${sql}`);
  }
  return value;
};

const queryText = (sql: string) => runSql(sql).split(/\r?\n/)[0] || '';

const getUserIdByPhone = (phone: string) =>
  queryNumber(`SELECT id FROM users WHERE phone = ${sqlString(phone)} LIMIT 1;`);

const getAnalystIdByPhone = (phone: string) =>
  queryNumber(`
    SELECT analysts.id
    FROM analysts
    JOIN users ON users.id = analysts.user_id
    WHERE users.phone = ${sqlString(phone)}
    LIMIT 1;
  `);

const cleanupAnalystFlowResidue = (orderNo?: string) => {
  const orderClause = orderNo
    ? `order_no = ${sqlString(orderNo)}`
    : "order_no LIKE 'E2E-ANALYST-%'";
  const markerClause = [
    "title LIKE '%E2E_ANALYST_FLOW%'",
    "content LIKE '%E2E_ANALYST_FLOW%'",
    "data LIKE '%E2E_ANALYST_FLOW%'",
    "title LIKE '%E2E分析师闭环%'",
    "content LIKE '%E2E分析师闭环%'",
    "data LIKE '%E2E分析师闭环%'",
  ].join(' OR ');

  runSql(`
    PRAGMA foreign_keys = OFF;
    DELETE FROM notifications
      WHERE ${markerClause};
    DELETE FROM analysis_highlights
      WHERE analysis_id IN (
        SELECT id FROM video_analyses
        WHERE order_id IN (SELECT id FROM orders WHERE ${orderClause})
           OR player_name LIKE 'E2E分析师闭环%'
           OR ai_report LIKE '%E2E_ANALYST_FLOW%'
      );
    UPDATE orders
      SET report_id = NULL
      WHERE ${orderClause};
    DELETE FROM reports
      WHERE order_id IN (SELECT id FROM orders WHERE ${orderClause})
         OR player_name LIKE 'E2E分析师闭环%'
         OR content LIKE '%E2E_ANALYST_FLOW%'
         OR summary LIKE '%E2E_ANALYST_FLOW%';
    DELETE FROM video_analyses
      WHERE order_id IN (SELECT id FROM orders WHERE ${orderClause})
         OR player_name LIKE 'E2E分析师闭环%'
         OR ai_report LIKE '%E2E_ANALYST_FLOW%'
         OR summary LIKE '%E2E_ANALYST_FLOW%';
    DELETE FROM order_status_histories
      WHERE order_id IN (SELECT id FROM orders WHERE ${orderClause});
    DELETE FROM order_assignments
      WHERE order_id IN (SELECT id FROM orders WHERE ${orderClause});
    DELETE FROM orders
      WHERE ${orderClause}
         OR player_name LIKE 'E2E分析师闭环%';
  `);
};

const seedAssignedOrder = (
  orderNo: string,
  playerName: string,
  actorIds: { adminId: number; analystId: number; playerId: number },
) => {
  cleanupAnalystFlowResidue(orderNo);
  runSql(`
    INSERT INTO orders (
      user_id, analyst_id, order_no, amount, status, payment_method, payment_time,
      video_url, video_filename, order_type, player_name, player_age, player_position,
      jersey_color, jersey_number, match_name, opponent, video_duration, deadline,
      assigned_at, paid_at, created_at, updated_at
    ) VALUES (
      ${actorIds.playerId}, ${actorIds.analystId}, ${sqlString(orderNo)}, 299, 'assigned', 'balance', datetime('now'),
      'https://example.com/e2e-analyst-flow.mp4', 'e2e-analyst-flow.mp4', 'basic',
      ${sqlString(playerName)}, 13, '边锋', '红色', '11', 'E2E分析师闭环测试赛',
      'E2E测试对手', 5400, datetime('now', '+2 days'), datetime('now'), datetime('now'),
      datetime('now'), datetime('now')
    );
    INSERT INTO order_assignments (
      order_id, analyst_id, assigned_by, assigned_at, status, created_at, updated_at
    )
      SELECT id, ${actorIds.analystId}, ${actorIds.adminId}, datetime('now'), 'pending', datetime('now'), datetime('now')
      FROM orders WHERE order_no = ${sqlString(orderNo)};
    INSERT INTO order_status_histories (
      order_id, from_status, to_status, actor_id, actor_role, reason, created_at
    )
      SELECT id, 'uploaded', 'assigned', ${actorIds.adminId}, 'admin', 'E2E_ANALYST_FLOW 管理员派单', datetime('now')
      FROM orders WHERE order_no = ${sqlString(orderNo)};
  `);

  return queryNumber(`SELECT id FROM orders WHERE order_no = ${sqlString(orderNo)} LIMIT 1;`);
};

const seedProcessingReport = (
  orderNo: string,
  playerName: string,
  summaryMarker: string,
  actorIds: { adminId: number; analystId: number; playerId: number },
) => {
  const orderId = seedAssignedOrder(orderNo, playerName, actorIds);

  runSql(`
    UPDATE orders
      SET status = 'processing',
          accepted_at = datetime('now'),
          updated_at = datetime('now')
      WHERE id = ${orderId};
    UPDATE order_assignments
      SET status = 'accepted',
          responded_at = datetime('now'),
          updated_at = datetime('now')
      WHERE order_id = ${orderId};
    INSERT INTO order_status_histories (
      order_id, from_status, to_status, actor_id, actor_role, reason, created_at
    ) VALUES (
      ${orderId}, 'assigned', 'processing', ${actorIds.analystId}, 'analyst', 'E2E_ANALYST_FLOW 分析师接单', datetime('now')
    );
    INSERT INTO video_analyses (
      order_id, analyst_id, user_id, player_name, player_age, player_position,
      match_name, opponent, video_url, overall_score, potential_level, scores,
      summary, improvements, analyst_notes, ai_report, ai_report_status,
      ai_report_version, status, created_at, updated_at
    ) VALUES (
      ${orderId}, ${actorIds.analystId}, ${actorIds.playerId}, ${sqlString(playerName)}, 13, '边锋',
      'E2E分析师闭环测试赛', 'E2E测试对手', 'https://example.com/e2e-analyst-flow.mp4',
      70, 'B', '{}', ${sqlString(summaryMarker + ' 页面审核前综合评价')},
      '继续加强高速带球后的传中质量。', '管理员页面审核 E2E',
      ${sqlString(`# ${summaryMarker}\n\n${playerName} 的受控管理员审核页面测试报告。`)},
      'confirmed', 1, 'submitted', datetime('now'), datetime('now')
    );
    INSERT INTO reports (
      order_id, user_id, analyst_id, player_name, player_position, content,
      status, overall_rating, potential, summary, suggestions, rating_details,
      created_at, updated_at
    ) VALUES (
      ${orderId}, ${actorIds.playerId}, ${actorIds.analystId}, ${sqlString(playerName)}, '边锋',
      ${sqlString(`# ${summaryMarker}\n\n${playerName} 的待审核报告。`)},
      'processing', 70, 'B', ${sqlString(summaryMarker + ' 管理员页面审核')},
      '继续加强高速带球后的传中质量。', '{}', datetime('now'), datetime('now')
    );
    UPDATE orders
      SET report_id = (SELECT id FROM reports WHERE order_id = ${orderId} ORDER BY id DESC LIMIT 1)
      WHERE id = ${orderId};
  `);

  return {
    orderId,
    reportId: queryNumber(`SELECT id FROM reports WHERE order_id = ${orderId} ORDER BY id DESC LIMIT 1;`),
  };
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

const setBrowserAuth = async (page: Page, auth: LoginData, role: 'analyst' | 'admin' | 'user') => {
  await page.goto('/');
  await page.evaluate(({ token, user, currentRole }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('currentRole', currentRole);
  }, { token: auth.token, user: auth.user, currentRole: role });
};

const getOrderCard = (page: Page, orderNo: string) =>
  page.getByText(orderNo, { exact: true }).first().locator('xpath=ancestor::div[contains(@class, "border-gray-100")][1]');

const waitForAnalysisId = async (request: APIRequestContext, auth: LoginData, orderId: number) => {
  const response = await request.get(apiUrl(`/api/video-analysis/by-order?order_id=${orderId}`), {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  const analysisId = Number(body?.data?.analysis?.id);
  expect(analysisId).toBeGreaterThan(0);
  return analysisId;
};

test.describe('分析师报告写路径 - 受控数据回归', () => {
  test.describe.configure({ mode: 'serial' });

  test.afterEach(async ({}, testInfo) => {
    const orderNo = testInfo.annotations.find(item => item.type === 'order-no')?.description;
    cleanupAnalystFlowResidue(orderNo);
  });

  test('分析师提交审核后，管理员通过，球员可在报告列表查看', async ({ page, request }, testInfo) => {
    const suffix = Date.now().toString(36);
    const orderNo = `E2E-ANALYST-${suffix}`;
    const playerName = `E2E分析师闭环球员-${suffix}`;
    const summaryMarker = `E2E_ANALYST_FLOW_${suffix}`;
    testInfo.annotations.push({ type: 'order-no', description: orderNo });

    const actorIds = {
      adminId: getUserIdByPhone(ADMIN_PHONE),
      analystId: getAnalystIdByPhone(ANALYST_PHONE),
      playerId: getUserIdByPhone(PLAYER_PHONE),
    };
    const orderId = seedAssignedOrder(orderNo, playerName, actorIds);
    const analystAuth = await loginByPhone(request, ANALYST_PHONE);
    const adminAuth = await loginByPhone(request, ADMIN_PHONE);
    const playerAuth = await loginByPhone(request, PLAYER_PHONE);

    await test.step('分析师在浏览器中接单并创建分析记录', async () => {
      await setBrowserAuth(page, analystAuth, 'analyst');
      await page.goto('/analyst/dashboard');
      await expect(page.getByText('工作台首页')).toBeVisible({ timeout: 15000 });

      await page.locator('aside, nav').first().getByRole('button', { name: /^待处理/ }).click();
      await expect(page.getByText(orderNo, { exact: true })).toBeVisible({ timeout: 15000 });
      await getOrderCard(page, orderNo).getByRole('button', { name: '接受订单' }).click();

      await expect(page.getByRole('heading', { name: '进行中订单', exact: true }).first()).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(orderNo, { exact: true })).toBeVisible({ timeout: 15000 });
      await getOrderCard(page, orderNo).getByRole('button', { name: /开始评分|开始分析/ }).click();
      await expect(page.locator('.fixed.inset-0').getByText(orderNo, { exact: true })).toBeVisible({ timeout: 15000 });
    });

    const analysisId = await waitForAnalysisId(request, analystAuth, orderId);

    await test.step('分析师填写综合评语并保存 AI 报告草稿', async () => {
      await page.locator('.fixed.inset-0 nav button').filter({ hasText: '综合评语' }).click();
      await page.locator('.fixed.inset-0 textarea[placeholder*="整体表现"]').fill(
        `${summaryMarker} 该球员在本场比赛中保持了稳定的边路参与和积极回追，能够在攻防转换阶段主动寻找空间，并持续给队友提供接应线路。`
      );
      await page.locator('.fixed.inset-0 textarea[placeholder*="训练的方向"]').fill(
        '建议继续加强高速带球后的传中质量，以及身体对抗后的第一脚处理。'
      );

      const saveResponse = page.waitForResponse(response =>
        response.url().includes(`/api/video-analysis/${analysisId}/scores`) && response.status() === 200
      );
      await page.locator('.fixed.inset-0').getByRole('button', { name: '保存' }).click();
      await saveResponse;

      const aiReportResponse = await request.put(apiUrl(`/api/video-analysis/${analysisId}/ai-report`), {
        headers: { Authorization: `Bearer ${analystAuth.token}` },
        data: {
          report: `# ${summaryMarker}\n\n${playerName} 的受控 E2E AI 报告草稿。`,
        },
      });
      expect(aiReportResponse.ok()).toBeTruthy();
      const aiReportBody = await aiReportResponse.json();
      expect(aiReportBody.success).toBeTruthy();
    });

    await test.step('分析师在浏览器中确认并提交管理员审核', async () => {
      await page.locator('.fixed.inset-0').getByRole('button', { name: '暂不提交' }).click();
      await expect(page.getByRole('heading', { name: '进行中订单', exact: true }).first()).toBeVisible({ timeout: 15000 });

      await getOrderCard(page, orderNo).getByRole('button', { name: /开始评分|开始分析/ }).click();
      await page.locator('.fixed.inset-0 nav button').filter({ hasText: 'AI 报告' }).click();
      await expect(page.locator('.fixed.inset-0 textarea').filter({ hasText: summaryMarker }).or(
        page.locator('.fixed.inset-0').getByText(summaryMarker)
      ).first()).toBeVisible({ timeout: 15000 });

      const submitResponse = page.waitForResponse(response =>
        response.url().includes(`/api/video-analysis/${analysisId}/confirm-ai-report`) && response.status() === 200
      );
      await page.locator('.fixed.inset-0').getByRole('button', { name: '确认并提交' }).click();
      await submitResponse;
      await expect(page.getByRole('heading', { name: '进行中订单', exact: true }).first()).toBeVisible({ timeout: 15000 });
    });

    const reportId = queryNumber(`
      SELECT id FROM reports
      WHERE order_id = (SELECT id FROM orders WHERE order_no = ${sqlString(orderNo)})
      ORDER BY id DESC LIMIT 1;
    `);

    await test.step('管理员审核前，球员浏览器报告列表不可见', async () => {
      await setBrowserAuth(page, playerAuth, 'user');
      await page.goto('/reports');
      await expect(page.getByRole('heading', { name: '球探报告列表' })).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(playerName)).toHaveCount(0);
    });

    await test.step('管理员通过审核后，球员浏览器可查看报告详情', async () => {
      const reviewResponse = await request.post(apiUrl(`/api/admin/reports/${reportId}/review`), {
        headers: { Authorization: `Bearer ${adminAuth.token}` },
        data: { status: 'completed', remark: `${summaryMarker} 审核通过` },
      });
      expect(reviewResponse.ok()).toBeTruthy();
      const reviewBody = await reviewResponse.json();
      expect(reviewBody.success).toBeTruthy();

      await page.reload();
      await expect(page.getByText(playerName).first()).toBeVisible({ timeout: 15000 });
      const reportCard = page.getByText(playerName).first().locator('xpath=ancestor::div[contains(@class, "card")][1]');
      await reportCard.getByRole('link', { name: '查看详情' }).click();
      await expect(page).toHaveURL(/\/reports\/\d+/, { timeout: 15000 });
      await expect(page.getByText(playerName).first()).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(summaryMarker).first()).toBeVisible({ timeout: 15000 });
    });
  });

  test('管理员报告审核页可以批准待审核报告并完成状态回流', async ({ page, request }, testInfo) => {
    const suffix = Date.now().toString(36);
    const orderNo = `E2E-ANALYST-${suffix}`;
    const playerName = `E2E分析师闭环审核-${suffix}`;
    const summaryMarker = `E2E_ANALYST_FLOW_ADMIN_${suffix}`;
    testInfo.annotations.push({ type: 'order-no', description: orderNo });

    const actorIds = {
      adminId: getUserIdByPhone(ADMIN_PHONE),
      analystId: getAnalystIdByPhone(ANALYST_PHONE),
      playerId: getUserIdByPhone(PLAYER_PHONE),
    };
    const { orderId, reportId } = seedProcessingReport(orderNo, playerName, summaryMarker, actorIds);
    const adminAuth = await loginByPhone(request, ADMIN_PHONE);

    await test.step('管理员在报告审核页面批准受控报告', async () => {
      await setBrowserAuth(page, adminAuth, 'admin');
      await page.goto('/admin/reports');
      await expect(page.getByRole('heading', { name: '待审核报告' })).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(playerName, { exact: true })).toBeVisible({ timeout: 15000 });

      const reportRow = page.getByText(playerName, { exact: true }).locator('xpath=ancestor::tr[1]');
      await reportRow.getByRole('button', { name: '批准' }).click();

      const dialog = page.locator('.fixed.inset-0').filter({ hasText: '批准报告' }).last();
      await expect(dialog.getByText('确认批准这篇报告')).toBeVisible({ timeout: 10000 });

      const reviewResponse = page.waitForResponse(response =>
        response.url().includes(`/api/admin/reports/${reportId}/review`) && response.status() === 200
      );
      await dialog.getByRole('button', { name: '批准' }).click();
      await reviewResponse;

      await expect(page.getByText(playerName, { exact: true })).toHaveCount(0);
    });

    await test.step('数据库状态同步为报告完成、订单完成、视频分析完成', async () => {
      expect(queryText(`SELECT status FROM reports WHERE id = ${reportId};`)).toBe('completed');
      expect(queryText(`SELECT status FROM orders WHERE id = ${orderId};`)).toBe('completed');
      expect(queryText(`SELECT completed_at IS NOT NULL FROM orders WHERE id = ${orderId};`)).toBe('1');
      expect(queryText(`SELECT status FROM video_analyses WHERE order_id = ${orderId};`)).toBe('completed');
      expect(queryText(`SELECT ai_report_status FROM video_analyses WHERE order_id = ${orderId};`)).toBe('confirmed');
    });
  });

  test('管理员报告审核页可以退回待审核报告并通知分析师', async ({ page, request }, testInfo) => {
    const suffix = Date.now().toString(36);
    const orderNo = `E2E-ANALYST-${suffix}`;
    const playerName = `E2E分析师闭环退回-${suffix}`;
    const summaryMarker = `E2E_ANALYST_FLOW_REJECT_${suffix}`;
    const rejectReason = `${summaryMarker} 技术细节不足，需要补充无球跑位分析`;
    testInfo.annotations.push({ type: 'order-no', description: orderNo });

    const analystUserId = getUserIdByPhone(ANALYST_PHONE);
    const actorIds = {
      adminId: getUserIdByPhone(ADMIN_PHONE),
      analystId: getAnalystIdByPhone(ANALYST_PHONE),
      playerId: getUserIdByPhone(PLAYER_PHONE),
    };
    const { orderId, reportId } = seedProcessingReport(orderNo, playerName, summaryMarker, actorIds);
    const adminAuth = await loginByPhone(request, ADMIN_PHONE);

    await test.step('管理员在报告审核页面退回受控报告', async () => {
      await setBrowserAuth(page, adminAuth, 'admin');
      await page.goto('/admin/reports');
      await expect(page.getByRole('heading', { name: '待审核报告' })).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(playerName, { exact: true })).toBeVisible({ timeout: 15000 });

      const reportRow = page.getByText(playerName, { exact: true }).locator('xpath=ancestor::tr[1]');
      await reportRow.getByRole('button', { name: '拒绝' }).click();

      const dialog = page.locator('.fixed.inset-0').filter({ hasText: '退回报告' }).last();
      await expect(dialog.getByText('确认退回这篇报告')).toBeVisible({ timeout: 10000 });
      await dialog.getByPlaceholder('请输入退回原因，留空则使用默认原因').fill(rejectReason);

      const reviewResponse = page.waitForResponse(response =>
        response.url().includes(`/api/admin/reports/${reportId}/review`) && response.status() === 200
      );
      await dialog.getByRole('button', { name: '退回' }).click();
      await reviewResponse;

      await expect(page.getByText(playerName, { exact: true })).toHaveCount(0);
    });

    await test.step('数据库状态同步为报告退回、视频分析回到草稿、订单未完成', async () => {
      expect(queryText(`SELECT status FROM reports WHERE id = ${reportId};`)).toBe('failed');
      expect(queryText(`SELECT review_remark FROM reports WHERE id = ${reportId};`)).toBe(rejectReason);
      expect(queryText(`SELECT status FROM orders WHERE id = ${orderId};`)).toBe('processing');
      expect(queryText(`SELECT completed_at IS NULL FROM orders WHERE id = ${orderId};`)).toBe('1');
      expect(queryText(`SELECT status FROM video_analyses WHERE order_id = ${orderId};`)).toBe('draft');
      expect(queryText(`SELECT ai_report_status FROM video_analyses WHERE order_id = ${orderId};`)).toBe('draft');
    });

    await test.step('分析师收到包含退回原因的通知', async () => {
      expect(queryNumber(`
        SELECT COUNT(*) FROM notifications
        WHERE user_id = ${analystUserId}
          AND title = '报告被退回'
          AND content LIKE ${sqlString('%' + rejectReason + '%')}
          AND data LIKE ${sqlString('%"report_id":' + reportId + '%')};
      `)).toBeGreaterThan(0);
    });
  });

  test('报告被退回后，分析师可以修改并再次提交审核', async ({ page, request }, testInfo) => {
    const suffix = Date.now().toString(36);
    const orderNo = `E2E-ANALYST-${suffix}`;
    const playerName = `E2E分析师闭环重提-${suffix}`;
    const summaryMarker = `E2E_ANALYST_FLOW_RESUBMIT_${suffix}`;
    const rejectReason = `${summaryMarker} 初次退回：缺少无球跑动细节`;
    const revisedSummary = `${summaryMarker} 退回后补充综合评语：该球员在边路无球跑动、接应线路选择和攻守转换阶段的回追意识都有清晰表现，二次提交时已补足管理员要求的无球跑动细节和改进建议。`;
    const revisedReport = `# ${summaryMarker} 二次提交报告\n\n${playerName} 退回后已补充无球跑动、接应线路和攻守转换分析，报告内容满足重新提交审核要求。`;
    testInfo.annotations.push({ type: 'order-no', description: orderNo });

    const actorIds = {
      adminId: getUserIdByPhone(ADMIN_PHONE),
      analystId: getAnalystIdByPhone(ANALYST_PHONE),
      playerId: getUserIdByPhone(PLAYER_PHONE),
    };
    const { orderId, reportId } = seedProcessingReport(orderNo, playerName, summaryMarker, actorIds);
    const analysisId = queryNumber(`SELECT id FROM video_analyses WHERE order_id = ${orderId};`);
    const adminAuth = await loginByPhone(request, ADMIN_PHONE);
    const analystAuth = await loginByPhone(request, ANALYST_PHONE);

    await test.step('管理员先退回报告，形成分析师二次修改前置状态', async () => {
      const rejectResponse = await request.post(apiUrl(`/api/admin/reports/${reportId}/review`), {
        headers: { Authorization: `Bearer ${adminAuth.token}` },
        data: { status: 'failed', remark: rejectReason },
      });
      expect(rejectResponse.ok()).toBeTruthy();
      const rejectBody = await rejectResponse.json();
      expect(rejectBody.success).toBeTruthy();

      expect(queryText(`SELECT status FROM reports WHERE id = ${reportId};`)).toBe('failed');
      expect(queryText(`SELECT review_remark FROM reports WHERE id = ${reportId};`)).toBe(rejectReason);
      expect(queryText(`SELECT status FROM video_analyses WHERE order_id = ${orderId};`)).toBe('draft');
      expect(queryText(`SELECT ai_report_status FROM video_analyses WHERE order_id = ${orderId};`)).toBe('draft');
    });

    await test.step('分析师从进行中订单重新打开工作区并补充内容', async () => {
      await setBrowserAuth(page, analystAuth, 'analyst');
      await page.goto('/analyst/dashboard');
      await expect(page.getByText('工作台首页')).toBeVisible({ timeout: 15000 });

      await page.locator('aside, nav').first().getByRole('button', { name: /^进行中/ }).click();
      await expect(page.getByRole('heading', { name: '进行中订单', exact: true }).first()).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(orderNo, { exact: true })).toBeVisible({ timeout: 15000 });
      await getOrderCard(page, orderNo).getByRole('button', { name: /开始评分|开始分析/ }).click();
      await expect(page.locator('.fixed.inset-0').getByText(orderNo, { exact: true })).toBeVisible({ timeout: 15000 });

      await page.locator('.fixed.inset-0 nav button').filter({ hasText: '综合评语' }).click();
      await page.locator('.fixed.inset-0 textarea[placeholder*="整体表现"]').fill(revisedSummary);
      await page.locator('.fixed.inset-0 textarea[placeholder*="训练的方向"]').fill(
        '二次提交补充建议：增加边路无球前插后的接应训练，并复盘攻守转换阶段的第一选择。'
      );

      const saveScoresResponse = page.waitForResponse(response =>
        response.url().includes('/scores') && response.status() === 200
      );
      await page.locator('.fixed.inset-0').getByRole('button', { name: '保存' }).first().click();
      await saveScoresResponse;

      await page.locator('.fixed.inset-0 nav button').filter({ hasText: 'AI 报告' }).click();
      const aiReportEditor = page.locator('.fixed.inset-0 textarea[rows="24"]').first();
      await expect(aiReportEditor).toBeVisible({ timeout: 10000 });
      await aiReportEditor.fill(revisedReport);
      await expect(aiReportEditor).toHaveValue(revisedReport);
      const aiReportCard = aiReportEditor.locator('xpath=ancestor::div[contains(@class, "rounded-xl")][1]');

      const saveAIReportResponse = page.waitForResponse(response =>
        response.url().includes(`/api/video-analysis/${analysisId}/ai-report`)
      );
      await aiReportCard.getByRole('button', { name: '保存' }).click();
      const saveAIReportResult = await saveAIReportResponse;
      expect(saveAIReportResult.status()).toBe(200);
    });

    await test.step('分析师再次提交后，报告重新进入管理员待审核列表', async () => {
      const submitResponse = page.waitForResponse(response =>
        response.url().includes(`/api/video-analysis/${analysisId}/confirm-ai-report`) && response.status() === 200
      );
      await page.locator('.fixed.inset-0').getByRole('button', { name: '确认并提交' }).click();
      await submitResponse;
      await expect(page.getByRole('heading', { name: '进行中订单', exact: true }).first()).toBeVisible({ timeout: 15000 });

      expect(queryText(`SELECT status FROM reports WHERE id = ${reportId};`)).toBe('processing');
      expect(queryText(`SELECT review_remark FROM reports WHERE id = ${reportId};`)).toBe('');
      expect(queryText(`SELECT content LIKE ${sqlString('%' + summaryMarker + ' 二次提交报告%')} FROM reports WHERE id = ${reportId};`)).toBe('1');
      expect(queryText(`SELECT status FROM video_analyses WHERE order_id = ${orderId};`)).toBe('submitted');
      expect(queryText(`SELECT ai_report_status FROM video_analyses WHERE order_id = ${orderId};`)).toBe('confirmed');

      await setBrowserAuth(page, adminAuth, 'admin');
      await page.goto('/admin/reports');
      await expect(page.getByRole('heading', { name: '待审核报告' })).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(playerName, { exact: true })).toBeVisible({ timeout: 15000 });
    });
  });
});
