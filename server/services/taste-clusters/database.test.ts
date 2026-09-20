import { afterAll, beforeAll, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
const db = new PGlite();
const user = "00000000-0000-4000-8000-000000000001";
beforeAll(async () => {
  await db.exec(
    `create role anon; create role authenticated; create role service_role bypassrls; create table users(id uuid primary key); insert into users values('${user}'); grant usage on schema public to service_role;`
  );
  await db.exec(
    readFileSync(
      "supabase/migrations/20260919092340_user_taste_cluster_shadow.sql",
      "utf8"
    )
  );
});
afterAll(() => db.close());
it("restricts all cluster tables and observation RPC to server role", async () => {
  const result = await db.query<{ allowed: boolean }>(
    "select has_table_privilege('anon','user_taste_cluster_models','SELECT') allowed union all select has_table_privilege('authenticated','user_taste_cluster_evaluations','INSERT') union all select has_function_privilege('authenticated','observe_user_taste_cluster(uuid,text,text)','EXECUTE')"
  );
  expect(result.rows.every((r) => !r.allowed)).toBe(true);
});
it("unchanged fingerprints preserve quiet time; changed input invalidates it", async () => {
  await db.query("select observe_user_taste_cluster($1,'digbox','first')", [
    user,
  ]);
  await db.exec("update user_taste_cluster_state set observed_at='2020-01-01'");
  await db.query("select observe_user_taste_cluster($1,'digbox','first')", [
    user,
  ]);
  const unchanged = await db.query<{ old: boolean }>(
    "select observed_at < '2021-01-01' old from user_taste_cluster_state"
  );
  expect(unchanged.rows[0].old).toBe(true);
  await db.query("select observe_user_taste_cluster($1,'digbox','second')", [
    user,
  ]);
  const changed = await db.query<{ fresh: boolean }>(
    "select observed_at > '2021-01-01' fresh from user_taste_cluster_state"
  );
  expect(changed.rows[0].fresh).toBe(true);
});
