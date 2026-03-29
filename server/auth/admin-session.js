import {
  clearAdminCookie,
  getAdminTokenFromCookieHeader,
  makeAdminCookie,
  makeAdminSessionToken,
  safeCompare,
  verifyAdminSessionToken,
} from "../shared.js";

export {
  clearAdminCookie,
  getAdminTokenFromCookieHeader,
  makeAdminCookie,
  makeAdminSessionToken,
  safeCompare,
  verifyAdminSessionToken,
};

export const getAdminTokenFromRequest = (request) =>
  getAdminTokenFromCookieHeader(
    request?.headers?.cookie || request?.headers?.Cookie || ""
  );
