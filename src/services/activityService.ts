import { supabase, isUsingDemoData } from '../lib/supabaseClient';
import type { Activity, ActivityType } from '../types/crm.types';

let localDemoActivities: Activity[] = [
  {
    id: 'a1000000-0000-0000-0000-000000000001',
    lead_id: 'd1000000-0000-0000-0000-000000000001',
    actor_id: '00000000-0000-0000-0000-000000000001',
    activity_type: 'created',
    description: 'Lead created from Website enquiry form',
    metadata: { course: 'Full Stack Web Development', source: 'Website' },
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    actor: {
      id: '00000000-0000-0000-0000-000000000001',
      full_name: 'Ananya Deshmukh',
      role: 'counsellor',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  {
    id: 'a1000000-0000-0000-0000-000000000002',
    lead_id: 'd1000000-0000-0000-0000-000000000002',
    actor_id: '00000000-0000-0000-0000-000000000001',
    activity_type: 'status_changed',
    description: 'Status changed from New to Contacted',
    metadata: { from: 'New', to: 'Contacted' },
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    actor: {
      id: '00000000-0000-0000-0000-000000000001',
      full_name: 'Ananya Deshmukh',
      role: 'counsellor',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  {
    id: 'a1000000-0000-0000-0000-000000000003',
    lead_id: 'd1000000-0000-0000-0000-000000000004',
    actor_id: '00000000-0000-0000-0000-000000000001',
    activity_type: 'status_changed',
    description: 'Status changed from Qualified to Converted (Enrolled)',
    metadata: { from: 'Qualified', to: 'Converted' },
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    actor: {
      id: '00000000-0000-0000-0000-000000000001',
      full_name: 'Ananya Deshmukh',
      role: 'counsellor',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  {
    id: 'a1000000-0000-0000-0000-000000000004',
    lead_id: 'd1000000-0000-0000-0000-000000000004',
    actor_id: '00000000-0000-0000-0000-000000000001',
    activity_type: 'follow_up_completed',
    description: 'Completed follow-up: "Collect KYC documents and onboarding verification"',
    metadata: {},
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    actor: {
      id: '00000000-0000-0000-0000-000000000001',
      full_name: 'Ananya Deshmukh',
      role: 'counsellor',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  },
  {
    id: 'a1000000-0000-0000-0000-000000000005',
    lead_id: 'd1000000-0000-0000-0000-000000000005',
    actor_id: '00000000-0000-0000-0000-000000000001',
    activity_type: 'status_changed',
    description: 'Status changed to Lost. Reason: Batch timings clash with current college schedule',
    metadata: { reason: 'Batch timings clash with current college schedule' },
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    actor: {
      id: '00000000-0000-0000-0000-000000000001',
      full_name: 'Ananya Deshmukh',
      role: 'counsellor',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  }
];

export const activityService = {
  /**
   * Fetches chronological activity logs for a lead
   */
  async getActivitiesForLead(leadId: string): Promise<{ activities: Activity[]; error: string | null }> {
    if (isUsingDemoData()) {
      const filtered = localDemoActivities.filter((a) => a.lead_id === leadId);
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return { activities: filtered, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('activities')
        .select(`
          *,
          actor:profiles!activities_actor_id_fkey(id, full_name, role)
        `)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) return { activities: [], error: error.message };
      return { activities: (data || []) as Activity[], error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to retrieve activities.';
      return { activities: [], error: message };
    }
  },

  /**
   * Logs a new activity event
   */
  async logActivity(
    leadId: string,
    type: ActivityType,
    description: string,
    metadata?: Record<string, unknown>,
    actorId?: string
  ): Promise<{ activity: Activity | null; error: string | null }> {
    if (isUsingDemoData()) {
      const newAct: Activity = {
        id: `act-demo-${Date.now()}`,
        lead_id: leadId,
        actor_id: actorId || null,
        activity_type: type,
        description,
        metadata: metadata || {},
        created_at: new Date().toISOString()
      };
      localDemoActivities.unshift(newAct);
      return { activity: newAct, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('activities')
        .insert({
          lead_id: leadId,
          actor_id: actorId || null,
          activity_type: type,
          description,
          metadata: metadata || {}
        })
        .select()
        .single();

      if (error) return { activity: null, error: error.message };
      return { activity: data as Activity, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to log activity.';
      return { activity: null, error: message };
    }
  }
};
