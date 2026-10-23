import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { FollowUp, FollowUpStatus } from '../types/crm.types';

// In-memory demo store for follow-ups
let localDemoFollowUps: FollowUp[] = [
  {
    id: 'f1000000-0000-0000-0000-000000000001',
    lead_id: 'd1000000-0000-0000-0000-000000000001',
    assigned_to: '00000000-0000-0000-0000-000000000001',
    due_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday -> OVERDUE
    note: 'Send course brochure and confirm demo class attendance.',
    status: 'pending',
    completed_at: null,
    created_by: '00000000-0000-0000-0000-000000000001',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    lead: {
      id: 'd1000000-0000-0000-0000-000000000001',
      full_name: 'Aarav Sharma',
      phone: '+91 98765 43210',
      course_interest: 'Full Stack Web Development'
    }
  },
  {
    id: 'f1000000-0000-0000-0000-000000000002',
    lead_id: 'd1000000-0000-0000-0000-000000000002',
    assigned_to: '00000000-0000-0000-0000-000000000001',
    due_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow -> UPCOMING
    note: 'Review fee discount options with student over phone.',
    status: 'pending',
    completed_at: null,
    created_by: '00000000-0000-0000-0000-000000000001',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    lead: {
      id: 'd1000000-0000-0000-0000-000000000002',
      full_name: 'Priya Patel',
      phone: '+91 98123 45678',
      course_interest: 'Data Science & AI Masterclass'
    }
  },
  {
    id: 'f1000000-0000-0000-0000-000000000003',
    lead_id: 'd1000000-0000-0000-0000-000000000004',
    assigned_to: '00000000-0000-0000-0000-000000000001',
    due_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    note: 'Collect KYC documents and onboarding verification.',
    status: 'completed',
    completed_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    created_by: '00000000-0000-0000-0000-000000000001',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    lead: {
      id: 'd1000000-0000-0000-0000-000000000004',
      full_name: 'Sneha Iyer',
      phone: '+91 96345 67890',
      course_interest: 'UI/UX Design Bootcamp'
    }
  }
];

export const followUpService = {
  /**
   * Retrieves follow-ups optionally filtered by leadId or status
   */
  async getFollowUps(leadId?: string, status?: FollowUpStatus): Promise<{ followUps: FollowUp[]; error: string | null }> {
    if (!isSupabaseConfigured) {
      let items = [...localDemoFollowUps];
      if (leadId) items = items.filter((f) => f.lead_id === leadId);
      if (status) items = items.filter((f) => f.status === status);
      // Sort: pending first by due date ascending
      items.sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());
      return { followUps: items, error: null };
    }

    try {
      let query = supabase
        .from('follow_ups')
        .select(`
          *,
          lead:leads(id, full_name, phone, course_interest),
          assignee:profiles!follow_ups_assigned_to_fkey(id, full_name, role)
        `)
        .order('due_at', { ascending: true });

      if (leadId) {
        query = query.eq('lead_id', leadId);
      }
      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) return { followUps: [], error: error.message };
      return { followUps: (data || []) as FollowUp[], error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch follow-ups.';
      return { followUps: [], error: message };
    }
  },

  /**
   * Creates a new follow-up and logs an activity event
   */
  async createFollowUp(
    data: {
      lead_id: string;
      due_at: string;
      note: string;
      assigned_to?: string | null;
    },
    actorId?: string
  ): Promise<{ followUp: FollowUp | null; error: string | null }> {
    if (!isSupabaseConfigured) {
      const newFollowUp: FollowUp = {
        id: `fup-demo-${Date.now()}`,
        lead_id: data.lead_id,
        due_at: data.due_at,
        note: data.note,
        assigned_to: data.assigned_to || null,
        status: 'pending',
        completed_at: null,
        created_by: actorId || null,
        created_at: new Date().toISOString()
      };
      localDemoFollowUps.push(newFollowUp);
      return { followUp: newFollowUp, error: null };
    }

    try {
      const { data: created, error } = await supabase
        .from('follow_ups')
        .insert({
          lead_id: data.lead_id,
          due_at: data.due_at,
          note: data.note.trim(),
          assigned_to: data.assigned_to || null,
          created_by: actorId || null,
          status: 'pending'
        })
        .select()
        .single();

      if (error) return { followUp: null, error: error.message };

      // Log activity
      const formattedDate = new Date(data.due_at).toLocaleString();
      await supabase.from('activities').insert({
        lead_id: data.lead_id,
        actor_id: actorId || null,
        activity_type: 'follow_up_created',
        description: `Scheduled follow-up for ${formattedDate}: "${data.note.trim()}"`,
        metadata: { due_at: data.due_at, note: data.note }
      });

      return { followUp: created as FollowUp, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create follow-up.';
      return { followUp: null, error: message };
    }
  },

  /**
   * Marks a follow-up as completed and logs an activity event
   */
  async completeFollowUp(id: string, actorId?: string): Promise<{ success: boolean; error: string | null }> {
    const completedAt = new Date().toISOString();

    if (!isSupabaseConfigured) {
      const f = localDemoFollowUps.find((item) => item.id === id);
      if (f) {
        f.status = 'completed';
        f.completed_at = completedAt;
        return { success: true, error: null };
      }
      return { success: false, error: 'Follow-up not found' };
    }

    try {
      // 1. Fetch follow-up details to get lead_id & note for audit log
      const { data: existing } = await supabase
        .from('follow_ups')
        .select('lead_id, note')
        .eq('id', id)
        .single();

      // 2. Update status and completed_at
      const { error } = await supabase
        .from('follow_ups')
        .update({
          status: 'completed',
          completed_at: completedAt
        })
        .eq('id', id);

      if (error) return { success: false, error: error.message };

      // 3. Log follow_up_completed activity
      if (existing) {
        await supabase.from('activities').insert({
          lead_id: existing.lead_id,
          actor_id: actorId || null,
          activity_type: 'follow_up_completed',
          description: `Completed follow-up: "${existing.note}"`,
          metadata: { follow_up_id: id, completed_at: completedAt }
        });
      }

      return { success: true, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to complete follow-up.';
      return { success: false, error: message };
    }
  },

  /**
   * Checks if a follow-up is overdue
   * Prompt Definition: overdue ONLY when status is pending AND due_at is earlier than current time
   */
  isOverdue(item: FollowUp): boolean {
    if (item.status !== 'pending') return false;
    return new Date(item.due_at).getTime() < Date.now();
  }
};
