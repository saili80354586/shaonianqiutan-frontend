export interface ScoutProfileFormData {
  avatar: string;
  name: string;
  gender: string;
  phone: string;
  province: string;
  city: string;
  scoutingExperience: string;
  specialties: string[];
  preferredAgeGroups: string[];
  bio: string;
  currentOrganization: string;
  verified: boolean;
}

export interface ScoutProfileUpdateForm {
  scoutingExperience: string;
  specialties: string[];
  preferredAgeGroups: string[];
  bio: string;
  currentOrganization: string;
}

export function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  if (typeof value !== 'string' || value.trim() === '') {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

export function mapScoutProfileResponse(data: any): ScoutProfileFormData {
  const user = data?.user || {};
  return {
    avatar: user.avatar || data?.avatar || '',
    name: user.name || user.nickname || data?.name || '',
    gender: user.gender || data?.gender || '',
    phone: user.phone || data?.phone || '',
    province: user.province || data?.province || '',
    city: user.city || data?.city || '',
    scoutingExperience: data?.scouting_experience || data?.scoutingExperience || '',
    specialties: toStringArray(data?.specialties),
    preferredAgeGroups: toStringArray(data?.preferred_age_groups ?? data?.preferredAgeGroups),
    bio: data?.bio || '',
    currentOrganization: data?.current_organization || data?.currentOrganization || '',
    verified: Boolean(data?.verified),
  };
}

export function buildScoutProfileUpdatePayload(form: ScoutProfileUpdateForm) {
  return {
    scouting_experience: form.scoutingExperience,
    specialties: JSON.stringify(form.specialties),
    preferred_age_groups: JSON.stringify(form.preferredAgeGroups),
    bio: form.bio,
    current_organization: form.currentOrganization,
  };
}
