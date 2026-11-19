import { useSyncExternalStore } from 'react';
import { getSuggestedInviteCode, isReferrerBannerHidden, subscribeReferrer } from '@/lib/installReferrer';

/** Install Referrer'dan gelen davet kodu önerisi (yalnız cihazda; kullanıcı onaylamadan gönderilmez) */
export function useSuggestedInviteCode(): string | null {
  return useSyncExternalStore(subscribeReferrer, getSuggestedInviteCode, getSuggestedInviteCode);
}

export function useReferrerBannerHidden(): boolean {
  return useSyncExternalStore(subscribeReferrer, isReferrerBannerHidden, isReferrerBannerHidden);
}
