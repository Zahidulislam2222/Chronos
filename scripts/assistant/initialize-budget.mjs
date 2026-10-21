import { loadAssistantConfig, loadProviderSecrets } from './config.mjs';
import { initializeBudget } from './budget.mjs';

try {
  const config = loadAssistantConfig();
  const {budgetPath} = loadProviderSecrets();
  if (!budgetPath) throw new Error('Private budget path required');
  initializeBudget(budgetPath, config.openrouter.budgetUsd);
  console.log('Private project budget initialized once; no provider request made.');
} catch {
  console.error('Budget initialization failed. Preserve existing accounting; inspect configuration privately.');
  process.exitCode = 1;
}
