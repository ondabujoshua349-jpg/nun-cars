import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { EnvironmentVariables } from '../../config/env.validation';

/**
 * Optional integration: the app boots without Supabase configured, and only
 * code paths that actually call `getAdminClient()` require the env vars.
 */
@Injectable()
export class SupabaseService {
  private adminClient?: SupabaseClient;

  constructor(
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  /** Service-role client — bypasses RLS. Server-side use only. */
  getAdminClient(): SupabaseClient {
    if (!this.adminClient) {
      const url = this.config.get('SUPABASE_URL', { infer: true });
      const key = this.config.get('SUPABASE_SERVICE_ROLE_KEY', { infer: true });
      if (!url || !key) {
        throw new Error(
          'Supabase is not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
        );
      }
      this.adminClient = createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
    }
    return this.adminClient;
  }
}
