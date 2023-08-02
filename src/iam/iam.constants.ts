import { CookieOptions } from 'express';

export const REQUEST_USER_KEY = 'user';

export const COOKIE_REFRESH_TOKEN_KEY = 't';

export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
};
