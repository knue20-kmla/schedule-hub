// Connects Google Calendar, Gmail and Google Drive (sync) with a single sign-in.
import { clearSlot, requestTokenFor, revokeAccessToken, type AccessToken } from './google-auth';
import { CAL_SCOPE } from './google-calendar';
import { MAIL_SCOPE } from './gmail';
import { DRIVE_SCOPE } from './drive-sync';

export type Service = 'cal' | 'mail' | 'drive';

const SERVICES: Record<Service, { slot: string; scope: string; label: string }> = {
  cal: { slot: 'cal', scope: CAL_SCOPE, label: '캘린더' },
  mail: { slot: 'mailm', scope: MAIL_SCOPE, label: 'Gmail' },
  drive: { slot: 'drive', scope: DRIVE_SCOPE, label: '드라이브' },
};
export const serviceLabel = (service: Service) => SERVICES[service].label;

// Requests every wanted service in one popup; returns which of them were really granted.
export async function requestServices(wanted: Service[]): Promise<{ token: AccessToken; granted: Service[] }> {
  const slotScopes = Object.fromEntries(wanted.map((service) => [SERVICES[service].slot, SERVICES[service].scope]));
  const { token, granted } = await requestTokenFor(slotScopes);
  return { token, granted: wanted.filter((service) => granted.includes(SERVICES[service].slot)) };
}

// Disconnects one service. The shared token is revoked at Google only when no other service still uses it.
export function releaseService(service: Service, tokens: Record<Service, AccessToken | null>) {
  const mine = tokens[service];
  clearSlot(SERVICES[service].slot);
  const shared = (Object.keys(tokens) as Service[]).some((other) => other !== service && tokens[other] && mine && tokens[other]!.value === mine.value);
  if (mine && !shared) revokeAccessToken(mine);
}
