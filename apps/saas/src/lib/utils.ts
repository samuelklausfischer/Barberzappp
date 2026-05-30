
export const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

export const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).substr(2);

export const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1);

export const truncate = (str: string, length: number): string =>
  str.length > length ? str.substring(0, length) + '...' : str;
