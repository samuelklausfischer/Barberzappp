import { createClient } from "npm:@supabase/supabase-js@2";

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];
const MAX_BODY_BYTES = 16_384;

type TrialRequest = {
  full_name?: unknown;
  company_name?: unknown;
  phone?: unknown;
  email?: unknown;
  password?: unknown;
  cpf?: unknown;
  terms_accepted?: unknown;
  website?: unknown;
};

function allowedOrigins(): string[] {
  const configured = Deno.env.get("TRIAL_ALLOWED_ORIGINS");
  if (!configured) return DEFAULT_ALLOWED_ORIGINS;

  return configured
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function corsHeaders(origin: string): HeadersInit {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json; charset=utf-8",
    "Vary": "Origin",
  };
}

function json(status: number, body: Record<string, unknown>, origin: string): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) });
}

function trialError(status: number, code: string, error: string, origin: string): Response {
  return json(status, { code, error }, origin);
}

function stringField(value: unknown): string | null {
  return typeof value === "string" ? value.trim() : null;
}

function normalizedCpf(value: string): string {
  return value.replace(/\D/g, "");
}

function isValidCpf(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;

  const digitAt = (position: number, startWeight: number) => {
    let sum = 0;
    for (let index = 0; index < position; index += 1) {
      sum += Number(cpf[index]) * (startWeight - index);
    }
    const digit = (sum * 10) % 11;
    return digit === 10 ? 0 : digit;
  };

  return digitAt(9, 10) === Number(cpf[9]) && digitAt(10, 11) === Number(cpf[10]);
}

function isValidEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string | null): boolean {
  if (phone === null || phone === "") return true;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 13 && phone.length <= 32;
}

function hasValidLength(value: string | null, minimum: number, maximum: number): value is string {
  return value !== null && value.length >= minimum && value.length <= maximum;
}

Deno.serve(async (request) => {
  const origin = request.headers.get("origin");
  if (!origin || !allowedOrigins().includes(origin)) {
    return new Response(null, { status: 403, headers: { "Vary": "Origin" } });
  }

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (request.method !== "POST") {
    return json(405, { error: "Metodo nao permitido." }, origin);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return json(415, { error: "O conteudo deve ser JSON." }, origin);
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return json(413, { error: "Solicitacao muito grande." }, origin);
  }

  let payload: TrialRequest;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return json(413, { error: "Solicitacao muito grande." }, origin);
    }
    const parsed: unknown = JSON.parse(rawBody);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return json(400, { error: "Dados de cadastro invalidos." }, origin);
    }
    payload = parsed as TrialRequest;
  } catch {
    return json(400, { error: "Dados de cadastro invalidos." }, origin);
  }

  if (stringField(payload.website)) {
    return json(400, { error: "Dados de cadastro invalidos." }, origin);
  }

  if (payload.terms_accepted !== true) {
    return trialError(
      400,
      "trial_invalid_payload",
      "Voce precisa aceitar os termos para criar um teste.",
      origin,
    );
  }
  const fullName = stringField(payload.full_name);
  const companyName = stringField(payload.company_name);
  const phone = stringField(payload.phone);
  const email = stringField(payload.email)?.toLowerCase() ?? null;
  const password = stringField(payload.password);
  const cpfInput = stringField(payload.cpf);
  const cpf = cpfInput ? normalizedCpf(cpfInput) : "";

  if (
    !hasValidLength(fullName, 2, 120) ||
    !hasValidLength(companyName, 2, 120) ||
    !isValidPhone(phone) ||
    !email ||
    !isValidEmail(email) ||
    !password ||
    password.length < 8 ||
    password.length > 128 ||
    !isValidCpf(cpf)
  ) {
    return trialError(400, "trial_invalid_payload", "Verifique os dados informados.", origin);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return trialError(
      500,
      "trial_temporarily_unavailable",
      "Cadastro temporariamente indisponivel.",
      origin,
    );
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });

  const { data: signupData, error: signupError } = await authClient.auth.signUp({
    email,
    password,
  });

  // Supabase intentionally obscures an existing email with an empty identities array.
  const user = signupData.user;
  if (signupError || !user?.id || !user.identities?.length) {
    return trialError(
      409,
      "trial_registration_conflict",
      "Nao foi possivel iniciar um teste com estes dados.",
      origin,
    );
  }

  const { error: workspaceError } = await adminClient.rpc("register_trial_workspace", {
    p_user_id: user.id,
    p_company_name: companyName,
    p_full_name: fullName,
    p_phone: phone || null,
    p_cpf: cpf,
  });

  if (workspaceError) {
    const { error: cleanupError } = await adminClient.auth.admin.deleteUser(user.id);
    if (cleanupError) console.error("trial_registration_compensation_failed");

    const workspaceMessage = `${workspaceError.code ?? ""} ${workspaceError.message ?? ""}`
      .toLowerCase();

    if (workspaceMessage.includes("trial_cpf_already_used")) {
      return trialError(
        409,
        "trial_cpf_already_used",
        "Este CPF ja utilizou o periodo de teste.",
        origin,
      );
    }

    if (
      workspaceMessage.includes("trial_user_already_claimed") ||
      workspaceMessage.includes("23505")
    ) {
      return trialError(
        409,
        "trial_registration_conflict",
        "Nao foi possivel iniciar um teste com estes dados.",
        origin,
      );
    }

    console.error("trial_registration_workspace_failed");
    return trialError(
      500,
      "trial_temporarily_unavailable",
      "Cadastro temporariamente indisponivel.",
      origin,
    );
  }

  return json(
    201,
    {
      success: true,
      message: signupData.session === null
        ? "Teste criado. Verifique seu email para confirmar o cadastro."
        : "Teste criado com sucesso.",
      requires_email_confirmation: signupData.session === null,
    },
    origin,
  );
});
