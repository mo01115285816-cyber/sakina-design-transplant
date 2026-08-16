const EXPECTED_SUPABASE_ORIGIN = "https://vmidpocwksqdvsyrvcog.supabase.co";
const PLACEHOLDER_PATTERNS = [
  /your-project/i,
  /your_public_key/i,
  /your-anon-key/i,
  /replace[-_ ]?me/i,
];

const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim() ?? "";
const supabaseKey =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.VITE_SUPABASE_ANON_KEY?.trim() ||
  "";

const errors = [];

if (!supabaseUrl) {
  errors.push("VITE_SUPABASE_URL is missing.");
} else if (PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(supabaseUrl))) {
  errors.push("VITE_SUPABASE_URL contains a placeholder value.");
} else {
  try {
    const parsed = new URL(supabaseUrl);
    if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".supabase.co")) {
      errors.push("VITE_SUPABASE_URL must be an HTTPS Supabase project URL.");
    } else if (parsed.origin !== EXPECTED_SUPABASE_ORIGIN) {
      errors.push(`VITE_SUPABASE_URL must point to ${EXPECTED_SUPABASE_ORIGIN}.`);
    }
  } catch {
    errors.push("VITE_SUPABASE_URL is not a valid URL.");
  }
}

if (!supabaseKey) {
  errors.push(
    "Set VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY before building.",
  );
} else if (PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(supabaseKey))) {
  errors.push("The Supabase public key contains a placeholder value.");
}

if (errors.length > 0) {
  console.error("\nInvalid public Supabase build configuration:\n");
  for (const error of errors) console.error(`- ${error}`);
  console.error(
    "\nConfigure the real values in the build environment; do not copy .env.example into a build environment.\n",
  );
  process.exit(1);
}

console.log(`Supabase build configuration verified for ${new URL(supabaseUrl).hostname}.`);
