export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

let tokens: TokenPair | null = null;

export function setTokens(t: TokenPair): void {
  tokens = t;
}

export function getTokens(): TokenPair | null {
  return tokens;
}

export function clearTokens(): void {
  tokens = null;
}