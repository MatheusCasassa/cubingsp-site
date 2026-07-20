/** Provedores sociais nativos do Supabase usados no site. */
export const SOCIAL_PROVIDERS = ["google", "facebook", "apple"] as const;
export type SocialProvider = (typeof SOCIAL_PROVIDERS)[number];

export const PROVIDER_LABEL: Record<SocialProvider | "wca", string> = {
  google: "Google",
  facebook: "Facebook",
  apple: "Apple",
  wca: "WCA",
};

/** Endpoints do OAuth2 da World Cube Association. */
export const WCA = {
  authorizeUrl: "https://www.worldcubeassociation.org/oauth/authorize",
  tokenUrl: "https://www.worldcubeassociation.org/oauth/token",
  meUrl: "https://www.worldcubeassociation.org/api/v0/me",
  // 'public' é obrigatório junto de qualquer outro escopo; 'email' dá o e-mail.
  scope: "public email",
};
