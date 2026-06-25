import { randomUUID } from 'node:crypto';

/**
 * Account store port. The account is the durable identity sessions bind to. In-memory adapter for
 * standalone/dev; a Postgres adapter swaps in later without touching the service logic.
 */
export interface Account {
  id: string;
  displayName: string;
  telegramId?: string;
  vkId?: string;
  avatarIcon?: string;
  achievements: string[];
}

export interface AccountStore {
  /** Re-claim an existing account (updating its name) or create a new one. */
  upsert(displayName: string, id?: string): Account;
  get(id: string): Account | undefined;
  findBySocial(network: 'telegram' | 'vk', socialId: string): Account | undefined;
  linkSocial(id: string, network: 'telegram' | 'vk', socialId: string): Account | undefined;
  addAchievement(id: string, achievement: string): void;
}

export const createMemoryAccountStore = (): AccountStore => {
  const accounts = new Map<string, Account>();
  return {
    upsert(displayName, id) {
      if (id) {
        const existing = accounts.get(id);
        if (existing) {
          existing.displayName = displayName;
          return existing;
        }
      }
      const account: Account = { id: id ?? randomUUID(), displayName, achievements: [] };
      accounts.set(account.id, account);
      return account;
    },
    get: (id) => accounts.get(id),
    findBySocial: (network, socialId) => {
      for (const acc of accounts.values()) {
        if (network === 'telegram' && acc.telegramId === socialId) return acc;
        if (network === 'vk' && acc.vkId === socialId) return acc;
      }
      return undefined;
    },
    linkSocial: (id, network, socialId) => {
      const acc = accounts.get(id);
      if (!acc) return undefined;
      if (network === 'telegram') acc.telegramId = socialId;
      if (network === 'vk') acc.vkId = socialId;
      return acc;
    },
    addAchievement: (id, ach) => {
      const acc = accounts.get(id);
      if (acc && !acc.achievements.includes(ach)) {
        acc.achievements.push(ach);
      }
    }
  };
};
