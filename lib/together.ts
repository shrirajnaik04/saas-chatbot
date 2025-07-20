import { createOpenAI } from '@ai-sdk/openai';

// Create Together AI provider using the OpenAI-compatible API
export const together = createOpenAI({
  name: 'together',
  apiKey: process.env.TOGETHER_API_KEY,
  baseURL: 'https://api.together.xyz/v1',
});

// Popular models available on Together AI
export const togetherModels = {
  // Llama models
  'llama-3.1-8b': 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
  'llama-3.1-70b': 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
  'llama-3.1-405b': 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',
  
  // Mistral models
  'mistral-7b': 'mistralai/Mistral-7B-Instruct-v0.1',
  'mixtral-8x7b': 'mistralai/Mixtral-8x7B-Instruct-v0.1',
  'mixtral-8x22b': 'mistralai/Mixtral-8x22B-Instruct-v0.1',
  
  // Code models
  'codellama-7b': 'codellama/CodeLlama-7b-Instruct-hf',
  'codellama-13b': 'codellama/CodeLlama-13b-Instruct-hf',
  'codellama-34b': 'codellama/CodeLlama-34b-Instruct-hf',
};
