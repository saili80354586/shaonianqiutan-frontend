import { describe, expect, it } from 'vitest';
import {
  buildScoutProfileUpdatePayload,
  mapScoutProfileResponse,
  toStringArray,
} from './scoutData';

describe('scoutData helpers', () => {
  it('normalizes array fields from arrays and JSON strings', () => {
    expect(toStringArray(['前锋', '中场', 1])).toEqual(['前锋', '中场']);
    expect(toStringArray('["U12","U14"]')).toEqual(['U12', 'U14']);
    expect(toStringArray('not-json')).toEqual([]);
  });

  it('maps backend scout profile fields to the form shape', () => {
    const form = mapScoutProfileResponse({
      scouting_experience: '3-5年',
      specialties: '["前锋"]',
      preferred_age_groups: ['U12'],
      bio: '华东青训观察',
      current_organization: '少年球探',
      verified: true,
      user: {
        avatar: '/avatar.png',
        name: '赵云帆',
        phone: '13800000024',
        province: '上海',
        city: '上海市',
      },
    });

    expect(form).toMatchObject({
      avatar: '/avatar.png',
      name: '赵云帆',
      phone: '13800000024',
      province: '上海',
      city: '上海市',
      scoutingExperience: '3-5年',
      specialties: ['前锋'],
      preferredAgeGroups: ['U12'],
      bio: '华东青训观察',
      currentOrganization: '少年球探',
      verified: true,
    });
  });

  it('builds the snake_case payload accepted by the backend', () => {
    expect(buildScoutProfileUpdatePayload({
      scoutingExperience: '5-10年',
      specialties: ['后卫'],
      preferredAgeGroups: ['U14', 'U16'],
      bio: '长期跟踪青训赛事',
      currentOrganization: '绿地青训',
    })).toEqual({
      scouting_experience: '5-10年',
      specialties: '["后卫"]',
      preferred_age_groups: '["U14","U16"]',
      bio: '长期跟踪青训赛事',
      current_organization: '绿地青训',
    });
  });
});
