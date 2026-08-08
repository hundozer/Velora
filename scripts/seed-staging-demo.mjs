import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const DEMO_COUNT = 100;
const CONFIRMATION = "SEED_INTIMO_STAGING_DEMOS";
const PREFIX = "demo|staging|";
const remove = process.argv.includes("--remove");

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function assertStagingTarget(url) {
  const parsed = new URL(url);
  const stagingRef = required("INTIMO_STAGING_SUPABASE_PROJECT_REF");
  const productionRef = process.env.INTIMO_PRODUCTION_SUPABASE_PROJECT_REF?.trim();
  if (process.env.INTIMO_ENVIRONMENT !== "staging") {
    throw new Error("Refusing demo seed: INTIMO_ENVIRONMENT must equal staging");
  }
  if (process.env.INTIMO_DEMO_SEED_CONFIRMATION !== CONFIRMATION) {
    throw new Error(`Refusing demo seed: set INTIMO_DEMO_SEED_CONFIRMATION=${CONFIRMATION}`);
  }
  if (parsed.hostname !== `${stagingRef}.supabase.co`) {
    throw new Error("Refusing demo seed: Supabase URL does not match the declared staging project ref");
  }
  if (productionRef && productionRef === stagingRef) {
    throw new Error("Refusing demo seed: staging and production project refs must differ");
  }
}

function deterministicUuid(index) {
  const hex = createHash("sha256").update(`intimo-staging-demo-${index}`).digest("hex").slice(0, 32).split("");
  hex[12] = "4";
  hex[16] = ((Number.parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex.slice(12, 16).join("")}-${hex.slice(16, 20).join("")}-${hex.slice(20).join("")}`;
}

const locations = [
  ["Czechia", "Prague"], ["Slovakia", "Bratislava"], ["Hungary", "Budapest"],
  ["Romania", "Bucharest"], ["Germany", "Berlin"], ["Austria", "Vienna"],
];
const interests = ["Conversation", "Culture", "Travel", "Dining", "Wellness", "Events"];

function demoProfile(index) {
  const number = String(index).padStart(3, "0");
  const [country, city] = locations[(index - 1) % locations.length];
  const couple = index % 5 === 0;
  return {
    id: deterministicUuid(index),
    auth_id: `${PREFIX}${number}`,
    email: `demo-${number}@intimo.invalid`,
    display_name: `Demo Member ${number}`,
    username: `demo_member_${number}`,
    role: "MEMBER",
    member_tier: "FREE",
    verification_status: "UNVERIFIED",
    verification_level: null,
    age_verification_status: "UNVERIFIED",
    age: 22 + ((index * 7) % 36),
    country,
    city,
    location: city,
    languages: ["English"],
    headline: "Fictional staging profile — not a real member",
    bio: `Demo profile ${number} exists only for staging UX testing. It does not represent a real person or real activity.`,
    interests: [interests[index % interests.length], interests[(index + 2) % interests.length]],
    lifestyle_tags: [],
    hobbies: [],
    looking_for: ["Demo connections"],
    is_couple_profile: couple,
    public_profile_visibility: true,
    profile_visibility: "EVERYONE",
    sensitive_fields_visibility: "PRIVATE",
    photo_visibility_default: "PRIVATE",
    location_precision: "CITY",
    show_online_status: false,
    show_distance: false,
    allow_direct_messages: false,
    require_verification_to_message: true,
    message_permission: "NOBODY",
    account_status: "ACTIVE",
    discovery_disabled: false,
    is_demo: true,
    avatar_url: null,
    cover_photo_url: null,
    followers_count: 0,
    subscribers_count: 0,
    total_content_count: 0,
  };
}

const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL");
assertStagingTarget(supabaseUrl);
const serviceKey = required("SUPABASE_SERVICE_ROLE_KEY");
const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

if (remove) {
  const { error } = await db.from("profiles").delete().eq("is_demo", true).like("auth_id", `${PREFIX}%`);
  if (error) throw error;
  console.log("Removed labeled Intimo staging demo profiles.");
} else {
  const profiles = Array.from({ length: DEMO_COUNT }, (_, index) => demoProfile(index + 1));
  const { error } = await db.from("profiles").upsert(profiles, { onConflict: "auth_id" });
  if (error) throw error;
  console.log(`Upserted ${DEMO_COUNT} clearly labeled fictional profiles into the declared staging project.`);
}
