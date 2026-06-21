import { randomUUID } from 'node:crypto';

/**
 * Account store port. The account is the durable identity sessions bind to. In-memory adapter for
 * standalone/dev; a Postgres adapter swaps in later without touching the service logic.
 */
export interface Account {
  id: string;
  displayName: string;
}

export interface AccountStore {
  /** Re-claim an existing account (updating its name) or create a new one. */
  upsert(displayName: string, id?: string): Account;
  get(id: string): Account | undefined;
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
      const account: Account = { id: id ?? randomUUID(), displayName };
      accounts.set(account.id, account);
      return account;
    },
    get: (id) => accounts.get(id),
  };
};
