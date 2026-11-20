/**
 * Where the API token lives: a module variable, so only memory. It is never written to storage, never
 * put in a URL and never part of the bundle; closing or reloading the tab forgets it.
 */
let token: string | undefined;

export const tokenVault = {
  set(value: string): void {
    token = value.trim() || undefined;
  },
  clear(): void {
    token = undefined;
  },
  get(): string | undefined {
    return token;
  },
  has(): boolean {
    return token !== undefined;
  },
};
