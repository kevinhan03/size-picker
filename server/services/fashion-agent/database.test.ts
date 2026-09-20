import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
const db = new PGlite();
const alice = randomUUID(),
  bob = randomUUID(),
  conversation = randomUUID();
const begin = (actor: string, convo = randomUUID(), request = randomUUID()) =>
  db.query<{ result: Record<string, unknown> }>(
    "select fashion_agent_begin($1,$2,$3,'Find a jacket') result",
    [actor, convo, request]
  );
beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create table users(id uuid primary key);
    create table products(id bigint primary key,brand text,name text,category text,sub_category text,url text,image_path text,slug text,created_at timestamptz default now(),target_gender text,human_target_gender text,style_attributes jsonb,human_style_attributes jsonb,style_axes jsonb,human_style_axes jsonb,facts_reviewed_at timestamptz,style_axes_reviewed_at timestamptz);
    grant usage on schema public to service_role;
    grant select on products to service_role;`);
  await db.query("insert into users values($1),($2)", [alice, bob]);
  await db.exec(
    readFileSync("supabase/migrations/20260917134806_fashion_agent.sql", "utf8")
  );
  await db.exec(
    readFileSync(
      "supabase/migrations/20260919173235_fashion_agent_operations.sql",
      "utf8"
    )
  );
  await db.exec(`insert into products(id,brand,name,category,style_attributes,style_axes) values
    (1,'Brand','Black wide trousers','Bottom','{"primary_color":"black","silhouette":"wide"}','{"formality":4}'),
    (2,'Brand','Unanalysed trousers','Bottom',null,null),
    (3,'Brand','Jacket','Outer','{"primary_color":"black"}','{"formality":7}'),
    (4,'Brand','Reviewed trousers','Bottom','{"primary_color":"black","silhouette":"wide"}','{"formality":4}');
    update products set human_style_attributes='{"primary_color":"white"}',facts_reviewed_at=now() where id=4;`);
}, 60000);
afterAll(async () => {
  await db.close();
});
describe("fashion agent persistence and search", () => {
  it("denies client table access and RPC invocation", async () => {
    for (const role of ["anon", "authenticated"]) {
      await db.exec(`set role ${role}`);
      try {
        await expect(
          db.query("select * from fashion_agent_conversations")
        ).rejects.toThrow(/permission denied/);
        await expect(begin(alice)).rejects.toThrow(/permission denied/);
        await expect(
          db.query("select fashion_agent_search('{}')")
        ).rejects.toThrow(/permission denied/);
      } finally {
        await db.exec("reset role");
      }
    }
  });
  it("isolates owners, prevents overlapping requests, and atomically commits an idempotent reply", async () => {
    const request = randomUUID();
    await begin(alice, conversation, request);
    await expect(begin(bob, conversation)).rejects.toThrow(
      "conversation_not_found"
    );
    await expect(begin(alice)).rejects.toThrow("conversation_busy");
    const state = { plan: null, resultIds: ["1", "3"] },
      result = {
        conversationId: conversation,
        messages: [
          { role: "user", text: "hi" },
          { role: "assistant", text: "hello" },
        ],
      };
    await expect(
      db.query("select fashion_agent_finish($1,$2,$3,$4,$5,$6)", [
        bob,
        conversation,
        request,
        JSON.stringify(result.messages),
        JSON.stringify(state),
        JSON.stringify(result),
      ])
    ).rejects.toThrow("request_expired");
    await db.query("select fashion_agent_finish($1,$2,$3,$4,$5,$6)", [
      alice,
      conversation,
      request,
      JSON.stringify(result.messages),
      JSON.stringify(state),
      JSON.stringify(result),
    ]);
    expect(
      (await begin(alice, conversation, request)).rows[0].result.cached
    ).toEqual(result);
    const saved = await db.query<{ messages: unknown[]; state: unknown }>(
      "select messages,state from fashion_agent_conversations where id=$1",
      [conversation]
    );
    expect(saved.rows[0].messages).toHaveLength(2);
    expect(saved.rows[0].state).toEqual(state);
  });
  it("expires leases so a timed-out worker cannot overwrite a newer turn", async () => {
    const request = randomUUID();
    await begin(bob, undefined, request);
    await db.query(
      "update fashion_agent_requests set created_at=now()-interval '2 minutes' where id=$1",
      [request]
    );
    const row = (
      await db.query<{ conversation_id: string }>(
        "select conversation_id from fashion_agent_requests where id=$1",
        [request]
      )
    ).rows[0];
    await expect(
      db.query("select fashion_agent_finish($1,$2,$3,'[{},{}]','{}','{}')", [
        bob,
        row.conversation_id,
        request,
      ])
    ).rejects.toThrow("request_expired");
  });
  it("applies facts and axis bounds before candidate limiting, preserving unknown values", async () => {
    const filters = {
      category: "Bottom",
      facts: [
        { key: "primary_color", value: "black" },
        { key: "silhouette", value: "wide" },
      ],
      axes: [{ key: "formality", min: 3, max: 5 }],
      keywords: [],
    };
    const result = await db.query<{ product: { id: number } }>(
      "select fashion_agent_search($1) product",
      [JSON.stringify(filters)]
    );
    expect(result.rows.map((row) => row.product.id)).toEqual([1]);
    expect(JSON.stringify(result.rows)).not.toContain("embedding");
    expect(
      (
        await db.query("select fashion_agent_search($1)", [
          JSON.stringify({ ...filters, keywords: ["% OR 1=1"] }),
        ])
      ).rows
    ).toHaveLength(0);
  });
  it("limits model work per user across conversations", async () => {
    const id = randomUUID();
    await db.query("insert into users values($1)", [id]);
    const convo = randomUUID();
    await db.query(
      "insert into fashion_agent_conversations(id,user_id) values($1,$2)",
      [convo, id]
    );
    for (let i = 0; i < 30; i++)
      await db.query(
        "insert into fashion_agent_requests(id,user_id,conversation_id,status) values($1,$2,$3,'failed')",
        [randomUUID(), id, convo]
      );
    await expect(begin(id)).rejects.toThrow("rate_limited");
  });
});
