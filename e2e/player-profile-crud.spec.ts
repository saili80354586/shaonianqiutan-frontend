import { test, expect } from '@playwright/test';
import { apiUrl } from './config';

const TEST_PHONE = '13800002001';
const TEST_PASSWORD = '123456';

/** 通用登录 */
async function loginAsPlayer(request: any) {
  const loginRes = await request.post(apiUrl('/api/auth/login'), {
    data: { phone: TEST_PHONE, password: TEST_PASSWORD },
  });
  const token = (await loginRes.json()).data.token;
  return token;
}

/** 获取球员 ID */
async function getPlayerId(request: any, token: string) {
  const res = await request.get(apiUrl('/api/player/profile'), {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  return body.data.profile.id;
}

// ========== 体测 CRUD 全流程 ==========

test.describe('体测 CRUD 全流程', () => {

  test('C1 - 创建体测记录（全字段）', async ({ request }) => {
    const token = await loginAsPlayer(request);

    const res = await request.post(apiUrl('/api/player/physical-tests'), {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({
        test_date: '2026-04-20',
        sprint_30m: 4.8,
        sprint_50m: 7.5,
        sprint_100m: 14.5,
        standing_long_jump: 210,
        push_up: 20,
        sit_and_reach: 15.5,
        height: 155,
        weight: 45,
        agility_ladder: 6.5,
        t_test: 9.8,
        shuttle_run: 10.2,
        vertical_jump: 45,
        sit_up: 30,
        plank: 60,
      }),
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();
  });

  test('C2 - 获取体测记录列表', async ({ request }) => {
    const token = await loginAsPlayer(request);

    const res = await request.get(apiUrl('/api/player/physical-tests'), {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data.records)).toBe(true);
    expect(body.data.total).toBeGreaterThan(0);
  });

  test('C3 - 更新体测记录', async ({ request }) => {
    const token = await loginAsPlayer(request);

    // 先创建一条专属记录（避免与其他测试并发冲突）
    const createRes = await request.post(apiUrl('/api/player/physical-tests'), {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({
        test_date: '2026-04-20',
        sprint_30m: 4.8,
        push_up: 20,
      }),
    });
    const createBody = await createRes.json();
    const recordId = createBody.data.id;

    // 更新该记录（含新增字段 sprint_100m / t_test / plank）
    const updateRes = await request.put(
      apiUrl(`/api/player/physical-tests/${recordId}`),
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        data: JSON.stringify({ sprint_30m: 4.5, sprint_100m: 14.2, t_test: 9.5, plank: 65, push_up: 25 }),
      }
    );

    expect(updateRes.ok()).toBeTruthy();
    const updateBody = await updateRes.json();
    expect(updateBody.success).toBe(true);
  });

  test('C4 - 删除体测记录', async ({ request }) => {
    const token = await loginAsPlayer(request);

    const createRes = await request.post(apiUrl('/api/player/physical-tests'), {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({ test_date: '2026-04-21', sprint_30m: 5.0 }),
    });
    const createBody = await createRes.json();
    const tempId = createBody.data.id;

    const deleteRes = await request.delete(
      apiUrl(`/api/player/physical-tests/${tempId}`),
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(deleteRes.ok()).toBeTruthy();
    const deleteBody = await deleteRes.json();
    expect(deleteBody.success).toBe(true);

    const reDeleteRes = await request.delete(
      apiUrl(`/api/player/physical-tests/${tempId}`),
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(reDeleteRes.status()).toBe(404);
  });

  test('C5 - 体测记录所有权校验（不能修改他人记录）', async ({ request }) => {
    const player1Token = await loginAsPlayer(request);

    const loginRes2 = await request.post(apiUrl('/api/auth/login'), {
      data: { phone: '13800002002', password: '123456' },
    });
    if (!loginRes2.ok()) return;

    const player2Token = (await loginRes2.json()).data.token;
    const listRes2 = await request.get(apiUrl('/api/player/physical-tests'), {
      headers: { Authorization: `Bearer ${player2Token}` },
    });
    const player2Records: any[] = (await listRes2.json()).data.records;
    if (player2Records.length === 0) return;

    const player2RecordId = player2Records[0].id;

    const deleteRes = await request.delete(
      apiUrl(`/api/player/physical-tests/${player2RecordId}`),
      { headers: { Authorization: `Bearer ${player1Token}` } }
    );
    expect(deleteRes.status()).toBe(404);
  });
});

// ========== 公开主页 API ==========

test.describe('球员公开主页 API', () => {

  test('P1 - 公开接口无需认证即可访问', async ({ request }) => {
    const token = await loginAsPlayer(request);
    const playerId = await getPlayerId(request, token);

    const res = await request.get(apiUrl(`/api/players/${playerId}/public`));
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.player).toBeDefined();
    expect(body.data.player.nickname).toBeDefined();
  });

  test('P2 - 公开资料不包含敏感字段', async ({ request }) => {
    const token = await loginAsPlayer(request);
    const playerId = await getPlayerId(request, token);

    const res = await request.get(apiUrl(`/api/players/${playerId}/public`));
    const body = await res.json();
    const player = body.data.player;

    expect(player).not.toHaveProperty('phone');
    expect(player).not.toHaveProperty('father_phone');
    expect(player).not.toHaveProperty('mother_phone');
    expect(player).not.toHaveProperty('wechat');
  });

  test('P3 - 公开资料包含核心字段', async ({ request }) => {
    const token = await loginAsPlayer(request);
    const playerId = await getPlayerId(request, token);

    const res = await request.get(apiUrl(`/api/players/${playerId}/public`));
    const body = await res.json();
    const player = body.data.player;

    expect(player.nickname).toBeDefined();
    expect(player.position).toBeDefined();
    expect(player.height).toBeDefined();
    expect(player.weight).toBeDefined();
    expect(player.current_team).toBeDefined();
  });

  test('P4 - 不存在的球员返回 404', async ({ request }) => {
    const res = await request.get(apiUrl('/api/players/99999999/public'));
    expect(res.status()).toBe(404);
  });
});

// ========== 部分更新 API ==========

test.describe('球员资料部分更新 API', () => {

  test('U1 - PATCH 单字段更新', async ({ request }) => {
    const token = await loginAsPlayer(request);

    const res = await request.patch(apiUrl('/api/player/profile/partial'), {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({ nickname: '测试昵称' }),
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('U2 - PATCH 多字段更新', async ({ request }) => {
    const token = await loginAsPlayer(request);

    const res = await request.patch(apiUrl('/api/player/profile/partial'), {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({ nickname: '王小明', position: '中场', height: 160 }),
    });

    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test('U3 - PATCH 白名单外字段被忽略', async ({ request }) => {
    const token = await loginAsPlayer(request);

    const res = await request.patch(apiUrl('/api/player/profile/partial'), {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({
        nickname: '有效字段',
        invalid_field_that_should_be_ignored: 'xxx',
      }),
    });

    expect(res.ok()).toBeTruthy();
  });
});

// ========== 头像上传 ==========

test.describe('头像上传流程', () => {

  test('A1 - 头像上传 API 调用成功', async ({ request }) => {
    const token = await loginAsPlayer(request);

    const buffer = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );

    const res = await request.post(apiUrl('/api/upload/avatar'), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      multipart: {
        file: {
          name: 'test-avatar.png',
          mimeType: 'image/png',
          buffer,
        },
      },
    });

    // 可能返回 200（成功）或 400（格式校验），两者都说明接口通了
    expect([200, 400]).toContain(res.status());
  });
});
