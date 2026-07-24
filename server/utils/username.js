const USERNAME_PATTERN = /^[A-Za-z0-9_.]{3,20}$/;

export function normalizeUsername(value) {
  return String(value || '').trim();
}

export function validateUsername(value) {
  const username = normalizeUsername(value);
  if (!username) return '사용자 이름을 입력해 주세요.';
  if (!USERNAME_PATTERN.test(username)) {
    return '사용자 이름은 영문, 숫자, 밑줄(_), 마침표(.)만 사용해 3~20자로 입력해 주세요.';
  }
  return null;
}

/** @param {any} db @param {unknown} value @param {string | null | undefined} currentUserId */
export async function isUsernameAvailable(db, value, currentUserId = null) {
  const username = normalizeUsername(value);
  if (validateUsername(username)) return false;
  const key = username.toLowerCase();

  const [{ data: users, error: usersError }, { data: aliases, error: aliasesError }] = await Promise.all([
    db.from('users').select('id, username').ilike('username', username).limit(1),
    db.from('username_aliases').select('username, user_id, available_at').eq('username', key).limit(1),
  ]);
  if (usersError) throw usersError;
  if (aliasesError) throw aliasesError;

  const currentMatch = Array.isArray(users) && users[0];
  if (currentMatch && String(currentMatch.id) !== String(currentUserId || '')) return false;
  const activeAlias = Array.isArray(aliases)
    ? aliases.find((alias) => new Date(String(alias.available_at || 0)).getTime() > Date.now())
    : null;
  return !activeAlias || String(activeAlias.user_id) === String(currentUserId || '');
}

function emailBase(email) {
  const localPart = String(email || '').split('@')[0].split('+')[0].toLowerCase();
  const sanitized = localPart
    .replace(/[^a-z0-9_.]+/g, '_')
    .replace(/[._]{2,}/g, '_')
    .replace(/^[._]+|[._]+$/g, '');
  return (sanitized || 'digbox_user').slice(0, 16).padEnd(3, '0');
}

/** @param {any} db @param {unknown} email @param {string | null | undefined} currentUserId */
export async function getUsernameSuggestions(db, email, currentUserId = null) {
  const base = emailBase(email);
  const candidates = [base, `${base.slice(0, 17)}_1`, `${base.slice(0, 17)}_2`];
  const suggestions = [];

  for (let suffix = 0; suggestions.length < 3 && suffix < 100; suffix += 1) {
    const candidate = suffix < candidates.length
      ? candidates[suffix]
      : `${base.slice(0, Math.max(3, 20 - String(suffix + 1).length - 1))}_${suffix + 1}`;
    if (!USERNAME_PATTERN.test(candidate) || suggestions.includes(candidate)) continue;
    if (await isUsernameAvailable(db, candidate, currentUserId)) suggestions.push(candidate);
  }

  return suggestions;
}
