export interface Model {
  chef: string;
  chefSlug: string;
  id: string;
  name: string;
  providers: string[];
}

export const models: Model[] = [
  {
    chef: "OpenAI",
    chefSlug: "openai",
    id: "openai/gpt-4o",
    name: "GPT-4o",
    providers: ["openai"],
  },
  {
    chef: "OpenAI",
    chefSlug: "openai",
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    providers: ["openai"],
  },
  {
    chef: "Anthropic",
    chefSlug: "anthropic",
    id: "anthropic/claude-sonnet-4-5-20250929",
    name: "Claude Sonnet 4.5",
    providers: ["anthropic"],
  },
  {
    chef: "Anthropic",
    chefSlug: "anthropic",
    id: "anthropic/claude-opus-4-20250514",
    name: "Claude Opus 4",
    providers: ["anthropic"],
  },
  {
    chef: "Anthropic",
    chefSlug: "anthropic",
    id: "anthropic/claude-haiku-4-5-20251001",
    name: "Claude Haiku 4.5",
    providers: ["anthropic"],
  },
  {
    chef: "Google",
    chefSlug: "google",
    id: "google/gemini-3-flash",
    name: "Gemini 3.0 Flash",
    providers: ["google"],
  },
  {
    chef: "Google",
    chefSlug: "google",
    id: "google/gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    providers: ["google"],
  },
  {
    chef: "Meta",
    chefSlug: "llama",
    id: "groq/llama-3.3-70b",
    name: "Llama 3.3 70B",
    providers: ["groq"],
  },
  {
    chef: "DeepSeek",
    chefSlug: "deepseek",
    id: "deepseek/deepseek-r1",
    name: "DeepSeek R1",
    providers: ["deepseek"],
  },
  {
    chef: "DeepSeek",
    chefSlug: "deepseek",
    id: "deepseek/deepseek-v3",
    name: "DeepSeek V3",
    providers: ["deepseek"],
  },
  {
    chef: "xAI",
    chefSlug: "xai",
    id: "xai/grok-3",
    name: "Grok 3",
    providers: ["xai"],
  },
  {
    chef: "Perplexity",
    chefSlug: "perplexity",
    id: "perplexity/sonar-pro",
    name: "Sonar Pro",
    providers: ["perplexity"],
  },
  {
    chef: "Mistral AI",
    chefSlug: "mistral",
    id: "mistral/mistral-large-3",
    name: "Mistral Large",
    providers: ["mistral"],
  },
  {
    chef: "Mistral AI",
    chefSlug: "mistral",
    id: "mistral/magistral-medium",
    name: "Magistral Medium",
    providers: ["mistral"],
  },
  {
    chef: "Mistral AI",
    chefSlug: "mistral",
    id: "mistral/codestral",
    name: "Codestral",
    providers: ["mistral"],
  },
];

export const suggestions = [
  "How does AI work?",
  "Are black holes real?",
  'How many Rs are in the word "strawberry"?',
  "What is the meaning of life?",
];

export const chefs = [...new Set(models.map((m) => m.chef))];
