const requiredVariables = [
  'VITE_SUPABASE_URL',
];

const publicKeyVariables = [
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_SUPABASE_ANON_KEY',
];

const explicitlyForbiddenVariables = [
  'VITE_SUPABASE_SERVICE_ROLE_KEY',
  'VITE_SUPABASE_SECRET_KEY',
  'VITE_GEMINI_API_KEY',
];

const forbiddenVariablePatterns = [
  /^VITE_.*(?:SERVICE_ROLE|SECRET|PRIVATE_KEY|TOKEN)/,
  /^VITE_(?:OPENAI|GEMINI|XAI|EVOLUTION|N8N|MINIO)_.*KEY$/,
];

const hasValue = (name) => Boolean(process.env[name]?.trim());
const missingVariables = requiredVariables.filter((name) => !hasValue(name));

if (!publicKeyVariables.some(hasValue)) {
  missingVariables.push('VITE_SUPABASE_PUBLISHABLE_KEY (ou VITE_SUPABASE_ANON_KEY)');
}

const invalidUrl = hasValue('VITE_SUPABASE_URL') && (() => {
  try {
    const url = new URL(process.env.VITE_SUPABASE_URL);
    return !['http:', 'https:'].includes(url.protocol);
  } catch {
    return true;
  }
})();

const forbiddenPresent = Object.keys(process.env)
  .filter(hasValue)
  .filter((name) =>
    explicitlyForbiddenVariables.includes(name)
    || forbiddenVariablePatterns.some((pattern) => pattern.test(name))
  )
  .sort();

if (missingVariables.length > 0) {
  console.error(`Variáveis públicas obrigatórias ausentes: ${missingVariables.join(', ')}`);
  process.exitCode = 1;
}

if (invalidUrl) {
  console.error('VITE_SUPABASE_URL deve usar uma URL HTTP ou HTTPS válida.');
  process.exitCode = 1;
}

if (forbiddenPresent.length > 0) {
  console.error(`Variáveis proibidas no frontend: ${forbiddenPresent.join(', ')}`);
  process.exitCode = 1;
}

if (hasValue('VITE_SUPABASE_PUBLISHABLE_KEY') && hasValue('VITE_SUPABASE_ANON_KEY')) {
  console.warn('Aviso: VITE_SUPABASE_PUBLISHABLE_KEY e VITE_SUPABASE_ANON_KEY coexistem; prefira somente VITE_SUPABASE_PUBLISHABLE_KEY.');
}
