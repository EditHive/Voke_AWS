// OnlineCompiler.io API Client for Multi-Language Code Execution
// API Documentation: https://onlinecompiler.io/docs

import { supabase } from "@/integrations/supabase/client";

// Language IDs mapped to Judge0 CE compiler keys
// The edge function strips everything after "-" to get the lang key
export const ONLINE_COMPILER_IDS = {
  python:     'python-3',
  javascript: 'javascript-nodejs',
  typescript: 'typescript-3',
  java:       'java-openjdk',
  cpp:        'cpp-gcc',
  c:          'c-gcc',
  rust:       'rust-1',
  go:         'go-1',
  ruby:       'ruby-2',
  php:        'php-7',
  csharp:     'csharp-mono',
  fsharp:     'fsharp-mono',
  haskell:    'haskell-ghc',
} as const;

export type OnlineCompilerLanguage = keyof typeof ONLINE_COMPILER_IDS;

export interface OnlineCompilerRequest {
  compiler: string;
  code: string;
  input?: string;
}

export interface OnlineCompilerResponse {
  output: string;
  errors: string;
  cpu_time: string;
  memory: string;
  exit_code: number;
}

export interface OnlineExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime?: number;
  language: string;
  exitCode: number;
}

/**
 * Execute code using OnlineCompiler.io API
 */
export async function executeOnlineCode(
  language: OnlineCompilerLanguage,
  code: string,
  stdin?: string,
  options?: {
    onLog?: (log: string) => void;
  }
): Promise<OnlineExecutionResult> {
  const startTime = Date.now();
  
  const compilerId = ONLINE_COMPILER_IDS[language];
  if (!compilerId) {
    return {
      success: false,
      output: '',
      error: `Unsupported language: ${language}`,
      language,
      exitCode: -1,
    };
  }

  const payload: OnlineCompilerRequest = {
    compiler: compilerId,
    code: code,
    input: stdin || '',
  };

  try {
    const { data, error: invokeError } = await supabase.functions.invoke('execute-code', {
      body: payload
    });

    if (invokeError) {
      throw new Error(`Edge Function error: ${invokeError.message}`);
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    const result: OnlineCompilerResponse = data;
    const executionTime = Date.now() - startTime;

    const hasError = result.exit_code !== 0 || result.errors.length > 0;
    const output = result.output;

    if (options?.onLog && output) {
      options.onLog(output);
    }
    if (options?.onLog && result.errors) {
      options.onLog(result.errors);
    }

    return {
      success: !hasError,
      output,
      error: hasError ? result.errors || `Process exited with code ${result.exit_code}` : undefined,
      executionTime,
      language,
      exitCode: result.exit_code,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      output: '',
      error: `Execution failed: ${errorMessage}`,
      executionTime,
      language,
      exitCode: -1,
    };
  }
}

/**
 * Check if a language is supported
 */
export function isOnlineLanguageSupported(language: string): language is OnlineCompilerLanguage {
  return language in ONLINE_COMPILER_IDS;
}
