import { expect, test, type Page } from '@playwright/test';
import { APP_BASE_URL } from '../config';

const PASSWORD = '123456';

async function loginByPhone(page: Page, phone: string, expectedPath: RegExp) {
  await page.goto('/login');
  await page.getByPlaceholder('请输入账号').fill(phone);
  await page.getByPlaceholder('请输入密码').fill(PASSWORD);
  await page.getByRole('button', { name: '登录' }).click();
  await page.waitForURL(expectedPath, { timeout: 15000 });
}

async function getStoredUserID(page: Page): Promise<number> {
  return page.evaluate(() => {
    const user = localStorage.getItem('user');
    if (!user) return 0;
    return Number(JSON.parse(user).id || 0);
  });
}

async function toggleFollow(page: Page, followingID: number): Promise<boolean> {
  const result = await page.evaluate(async (id) => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/social/follow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ following_id: id }),
    });
    return {
      ok: response.ok,
      status: response.status,
      body: await response.json(),
    };
  }, followingID);

  expect(result.ok, JSON.stringify(result.body)).toBeTruthy();
  expect(result.body.success).toBe(true);
  return Boolean(result.body.data?.following);
}

async function deleteNotification(page: Page, notificationID: number) {
  await page.evaluate(async (id) => {
    const token = localStorage.getItem('token');
    await fetch(`/api/notifications/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }, notificationID);
}

function findFollowNotificationFrame(frames: string[]) {
  for (const frame of frames) {
    for (const chunk of frame.split('\n').filter(Boolean)) {
      try {
        const message = JSON.parse(chunk);
        if (
          message.type === 'notification' &&
          message.content?.type === 'follow' &&
          message.content?.title === '新增关注'
        ) {
          return message;
        }
      } catch {
        // Ignore non-JSON frames from dev-server internals.
      }
    }
  }
  return null;
}

test.describe('通知实时推送专项 E2E', () => {
  test('关注通知通过 WebSocket 实时到达在线用户', async ({ browser }) => {
    const recipientContext = await browser.newContext({ baseURL: APP_BASE_URL });
    const actorContext = await browser.newContext({ baseURL: APP_BASE_URL });
    const recipientPage = await recipientContext.newPage();
    const actorPage = await actorContext.newPage();

    const wsFrames: string[] = [];
    const consoleMessages: string[] = [];
    let restoreOriginalFollow = false;
    let notificationID: number | undefined;

    recipientPage.on('websocket', (ws) => {
      ws.on('framereceived', (event) => {
        wsFrames.push(String(event.payload));
      });
    });
    recipientPage.on('console', (message) => {
      consoleMessages.push(message.text());
    });

    try {
      await loginByPhone(recipientPage, '13800002002', /\/user-dashboard/);
      await expect
        .poll(() => consoleMessages.filter((message) => message.includes('WebSocket: 连接成功')).length, {
          timeout: 10000,
        })
        .toBeGreaterThan(0);

      const recipientID = await getStoredUserID(recipientPage);
      expect(recipientID).toBeGreaterThan(0);

      await loginByPhone(actorPage, '13800002001', /\/user-dashboard/);

      const firstToggleFollowing = await toggleFollow(actorPage, recipientID);
      if (firstToggleFollowing) {
        restoreOriginalFollow = true;
      } else {
        const secondToggleFollowing = await toggleFollow(actorPage, recipientID);
        expect(secondToggleFollowing).toBe(true);
      }

      await expect
        .poll(() => findFollowNotificationFrame(wsFrames), { timeout: 10000 })
        .not.toBeNull();

      const notificationFrame = findFollowNotificationFrame(wsFrames);
      notificationID = notificationFrame?.content?.id;
      expect(notificationID).toBeGreaterThan(0);
      expect(consoleMessages.some((message) => message.includes('WebSocket: 连接错误'))).toBe(false);
    } finally {
      if (restoreOriginalFollow) {
        await toggleFollow(actorPage, await getStoredUserID(recipientPage));
      }
      if (notificationID) {
        await deleteNotification(recipientPage, notificationID);
      }
      await actorContext.close();
      await recipientContext.close();
    }
  });
});
