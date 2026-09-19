import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
const db = new PGlite();
const alice = randomUUID(),
  bob = randomUUID(),
  legacy = randomUUID();
async function publish(actor: string, payload: unknown, editing = false) {
  return db.query<{ id: string }>(
    "select public.social_publish_post($1,$2::jsonb,$3) id",
    [actor, JSON.stringify(payload), editing]
  );
}
async function upload(user = alice) {
  const id = randomUUID();
  await db.query(
    "insert into social_uploads(id,user_id,path,width,height) values($1,$2,$3,600,800)",
    [id, user, `${user}/${id}.webp`]
  );
  return id;
}
beforeAll(async () => {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth;create schema private;create table auth.users(id uuid primary key);
 create table public.users(id uuid primary key references auth.users(id) on delete cascade,username text,avatar_path text);
 create table public.products(id bigint primary key,name text,brand text,image_path text);
 create table public.user_closet_items(user_id uuid references auth.users(id) on delete cascade,product_id text,primary key(user_id,product_id));
 create table public.user_digbox_items(user_id uuid references auth.users(id) on delete cascade,product_id text,primary key(user_id,product_id));
 grant usage on schema public,auth to service_role;
 grant all on all tables in schema public,auth to service_role;
 `);
  await db.exec(
    readFileSync(
      "supabase/migrations/20260826140026_create_outfit_explorer.sql",
      "utf8"
    ).split("insert into storage.buckets")[0]
  );
  await db.exec(
    readFileSync(
      "supabase/migrations/20260826153704_add_outfit_explorer_uploader.sql",
      "utf8"
    )
  );
  await db.query("insert into auth.users values($1),($2)", [alice, bob]);
  await db.query(
    "insert into public.users(id,username) values($1,'alice'),($2,'bob')",
    [alice, bob]
  );
  await db.query(
    "insert into outfit_explorer_posts(id,image_path,user_id) values($1,'legacy.jpg',$2)",
    [legacy, alice]
  );
  await db.exec(
    readFileSync(
      "supabase/migrations/20260914112007_social_style_posts.sql",
      "utf8"
    )
  );
  await db.exec(
    readFileSync(
      "supabase/migrations/20260919092933_allow_saved_product_tags.sql",
      "utf8"
    )
  );
  await db.exec(
    "insert into products values(1,'Shirt','Brand','shirt.jpg'),(2,'Shoes','Brand','shoes.jpg'),(3,'Jacket','Brand','jacket.jpg'),(4,'Coat','Brand','coat.jpg');"
  );
  await db.query("insert into user_closet_items values($1,'1'),($1,'3'),($2,'2')", [
    alice,
    bob,
  ]);
  await db.query("insert into user_digbox_items values($1,'2')", [alice]);
}, 60000);
afterAll(async () => {
  await db.close();
});
describe("social migration and atomic publishing", () => {
  it("preserves legacy post identity and media", async () => {
    expect(
      (
        await db.query(
          "select * from outfit_explorer_images where post_id=$1",
          [legacy]
        )
      ).rows
    ).toHaveLength(1);
  });
  it("denies all direct browser table access and publish RPC", async () => {
    await db.exec("set role anon");
    try {
      await expect(db.query("select * from social_saves")).rejects.toThrow(
        /permission denied/
      );
      await expect(publish(alice, {})).rejects.toThrow(/permission denied/);
    } finally {
      await db.exec("reset role");
    }
    await db.exec("set role authenticated");
    try {
      await expect(
        db.query("select * from outfit_explorer_tags")
      ).rejects.toThrow(/permission denied/);
    } finally {
      await db.exec("reset role");
    }
  });
  it("publishes untagged photos, idempotently retries and returns feed stats", async () => {
    const id = randomUUID(),
      image = await upload();
    const payload = { id, caption: "Hello", images: [{ id: image, tags: [] }] };
    await publish(alice, payload);
    await publish(alice, payload);
    expect(
      (await db.query("select * from outfit_explorer_posts where id=$1", [id]))
        .rows
    ).toHaveLength(1);
    const stats = await db.query<{ image_count: number }>(
      "select * from social_post_stats(array[$1::uuid],$2)",
      [id, alice]
    );
    expect(Number(stats.rows[0].image_count)).toBe(1);
    const feed = await db.query(
      "select * from social_feed_ids($1,'all',null,null,null)",
      [alice]
    );
    expect(feed.rows.length).toBeGreaterThan(0);
  });
  it("rolls back foreign closet tags and upload theft without partial publication", async () => {
    const id = randomUUID(),
      image = await upload();
    await expect(
      publish(alice, {
        id,
        caption: "",
        images: [{ id: image, tags: [{ productId: "4", x: 0.2, y: 0.5 }] }],
      })
    ).rejects.toThrow(/not_in_closet/);
    expect(
      (await db.query("select * from outfit_explorer_posts where id=$1", [id]))
        .rows
    ).toHaveLength(0);
    expect(
      (
        await db.query<{ used: boolean }>(
          "select used from social_uploads where id=$1",
          [image]
        )
      ).rows[0].used
    ).toBe(false);
    await expect(
      publish(bob, {
        id: randomUUID(),
        caption: "",
        images: [{ id: image, tags: [] }],
      })
    ).rejects.toThrow(/invalid_upload/);
  });
  it("allows tags for products saved to Digbox without requiring a closet entry", async () => {
    const id = randomUUID();
    const image = await upload();
    await publish(alice, {
      id,
      caption: "saved product tag",
      images: [{ id: image, tags: [{ productId: "2", x: 0.2, y: 0.5 }] }],
    });
    expect(
      (await db.query<{ product_id: number }>(
        "select product_id from outfit_explorer_tags where image_id=$1",
        [image]
      )).rows[0].product_id
    ).toBe(2);
  });
  it("preserves tags after closet removal and reorders images atomically", async () => {
    const id = randomUUID(),
      a = await upload(),
      b = await upload();
    await publish(alice, {
      id,
      caption: "look",
      images: [
        { id: a, tags: [{ productId: "1", x: 0.1, y: 0.2 }] },
        { id: b, tags: [] },
      ],
    });
    const tag = (
      await db.query<{ id: string; snapshot: Record<string, string> }>(
        "select * from outfit_explorer_tags where image_id=$1",
        [a]
      )
    ).rows[0];
    expect(Object.keys(tag.snapshot).sort()).toEqual([
      "brand",
      "imagePath",
      "name",
    ]);
    await db.query(
      "delete from user_closet_items where user_id=$1 and product_id='1'",
      [alice]
    );
    const updatedAt = (
      await db.query<{ updated_at: string }>(
        "select updated_at from outfit_explorer_posts where id=$1",
        [id]
      )
    ).rows[0].updated_at;
    const payload = {
      id,
      updatedAt,
      caption: "edited",
      images: [
        { id: b, tags: [] },
        {
          id: a,
          tags: [{ productId: "1", existingTagId: tag.id, x: 0.7, y: 0.8 }],
        },
      ],
    };
    await publish(alice, payload, true);
    expect(
      (
        await db.query<{ id: string }>(
          "select id from outfit_explorer_images where post_id=$1 order by position",
          [id]
        )
      ).rows.map((i) => i.id)
    ).toEqual([b, a]);
    await expect(publish(bob, payload, true)).rejects.toThrow(/forbidden/);
    await expect(publish(alice, payload, true)).rejects.toThrow(/conflict/);
    await db.query("delete from products where id=1");
    expect(
      (
        await db.query<{ product_id: null }>(
          "select product_id from outfit_explorer_tags where id=$1",
          [tag.id]
        )
      ).rows[0].product_id
    ).toBeNull();
  });
  it("replaces an existing image while retaining its image identity and tags", async () => {
    const id = randomUUID(), original = await upload(), replacement = await upload();
    await publish(alice, {
      id,
      caption: "before",
      images: [{ id: original, tags: [{ productId: "3", x: 0.2, y: 0.2 }] }],
    });
    const current = (
      await db.query<{ updated_at: string }>(
        "select updated_at from outfit_explorer_posts where id=$1",
        [id]
      )
    ).rows[0];
    const tag = (
      await db.query<{ id: string }>(
        "select id from outfit_explorer_tags where image_id=$1",
        [original]
      )
    ).rows[0];
    await publish(alice, {
      id,
      updatedAt: current.updated_at,
      caption: "after",
      images: [{
        id: original,
        replacementUploadId: replacement,
        tags: [{ productId: "3", existingTagId: tag.id, x: 0.2, y: 0.2 }],
      }],
    }, true);
    expect(
      (await db.query<{ image_path: string }>("select image_path from outfit_explorer_images where id=$1", [original]))
        .rows[0].image_path
    ).toContain(replacement);
    expect(
      (await db.query("select id from outfit_explorer_tags where id=$1", [tag.id]))
        .rows
    ).toHaveLength(1);
  });
  it("limits image/tag counts and rejects duplicate image identifiers", async () => {
    const image = await upload();
    await expect(
      publish(alice, {
        id: randomUUID(),
        caption: "",
        images: Array.from({ length: 11 }, () => ({ id: image, tags: [] })),
      })
    ).rejects.toThrow(/invalid_input/);
    await expect(
      publish(alice, {
        id: randomUUID(),
        caption: "",
        images: [
          { id: image, tags: [] },
          { id: image, tags: [] },
        ],
      })
    ).rejects.toThrow(/invalid_input/);
  });
  it("keeps saved ordering, rejects self follows and removes relations on auth deletion", async () => {
    await expect(
      db.query(
        "insert into social_follows(follower_id,following_id) values($1,$1)",
        [bob]
      )
    ).rejects.toThrow();
    await db.query(
      "insert into social_follows(follower_id,following_id) values($1,$2)",
      [bob, alice]
    );
    await db.query("insert into social_saves(user_id,post_id) values($1,$2)", [
      bob,
      legacy,
    ]);
    await db.query("insert into social_likes(user_id,post_id) values($1,$2)", [
      bob,
      legacy,
    ]);
    expect(
      (
        await db.query(
          "select * from social_feed_ids($1,'saved',null,null,null)",
          [bob]
        )
      ).rows
    ).toHaveLength(1);
    expect(
      (
        await db.query(
          "select * from social_feed_ids($1,'saved',null,null,null)",
          [alice]
        )
      ).rows
    ).toHaveLength(0);
    await db.query("delete from auth.users where id=$1", [alice]);
    expect(
      (
        await db.query("select * from outfit_explorer_posts where user_id=$1", [
          alice,
        ])
      ).rows
    ).toHaveLength(0);
    expect(
      (
        await db.query(
          "select * from social_file_cleanup where path='legacy.jpg'"
        )
      ).rows
    ).toHaveLength(1);
    expect((await db.query("select * from social_saves")).rows).toHaveLength(0);
    expect((await db.query("select * from social_follows")).rows).toHaveLength(
      0
    );
  });
  it("expires only unused uploads and queues abandoned files", async () => {
    const image = await upload(bob);
    await db.query(
      "update social_uploads set created_at=now()-interval '2 days' where id=$1",
      [image]
    );
    await db.query("select social_expire_uploads()");
    expect(
      (await db.query("select * from social_uploads where id=$1", [image])).rows
    ).toHaveLength(0);
    expect(
      (
        await db.query("select * from social_file_cleanup where path=$1", [
          `${bob}/${image}.webp`,
        ])
      ).rows
    ).toHaveLength(1);
  });
});
