import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { Lead, LeadStatus, LeadSource } from '../types/crm.types';

// In-memory demo store when Supabase is not connected yet
let localDemoLeads: Lead[] = [
  {
    id: 'd1000000-0000-0000-0000-000000000001',
    full_name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    phone: '+91 98765 43210',
    course_interest: 'Full Stack Web Development',
    source: 'Website',
    status: 'New',
    lost_reason: null,
    assigned_to: '00000000-0000-0000-0000-000000000001',
    created_by: '00000000-0000-0000-0000-000000000001',
    notes: 'Enquired via website contact form about upcoming weekend batch.',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'd1000000-0000-0000-0000-000000000002',
    full_name: 'Priya Patel',
    email: 'priya.patel@example.com',
    phone: '+91 98123 45678',
    course_interest: 'Data Science & AI Masterclass',
    source: 'Social Media',
    status: 'Contacted',
    lost_reason: null,
    assigned_to: '00000000-0000-0000-0000-000000000001',
    created_by: '00000000-0000-0000-0000-000000000001',
    notes: 'Had introductory call. Requested detailed syllabus and fee structure.',
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    id: 'd1000000-0000-0000-0000-000000000003',
    full_name: 'Rohan Verma',
    email: 'rohan.verma@example.com',
    phone: '+91 97234 56789',
    course_interest: 'Cloud DevOps Engineering',
    source: 'Referral',
    status: 'Qualified',
    lost_reason: null,
    assigned_to: '00000000-0000-0000-0000-000000000001',
    created_by: '00000000-0000-0000-0000-000000000001',
    notes: 'Software engineer with 2 yrs experience looking to transition to DevOps.',
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: 'd1000000-0000-0000-0000-000000000004',
    full_name: 'Sneha Iyer',
    email: 'sneha.iyer@example.com',
    phone: '+91 96345 67890',
    course_interest: 'UI/UX Design Bootcamp',
    source: 'Walk-in',
    status: 'Converted',
    lost_reason: null,
    assigned_to: '00000000-0000-0000-0000-000000000001',
    created_by: '00000000-0000-0000-0000-000000000001',
    notes: 'Enrolled and paid registration deposit for October batch.',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: 'd1000000-0000-0000-0000-000000000005',
    full_name: 'Vikram Singh',
    email: 'vikram.singh@example.com',
    phone: '+91 95456 78901',
    course_interest: 'Full Stack Web Development',
    source: 'Call',
    status: 'Lost',
    lost_reason: 'Batch timings clash with current college schedule',
    assigned_to: '00000000-0000-0000-0000-000000000001',
    created_by: '00000000-0000-0000-0000-000000000001',
    notes: 'Followed up twice. Timings did not suit.',
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 8).toISOString()
  }
];

const LOCAL_STORAGE_KEY = 'brightpath_local_leads';

const loadLocalLeads = (): Lead[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load local leads cache', e);
  }
  return [...localDemoLeads];
};

const saveLocalLeads = (leads: Lead[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(leads));
  } catch (e) {
    console.warn('Failed to save local leads cache', e);
  }
};

export interface LeadFilterParams {
  search?: string;
  status?: LeadStatus | '';
  source?: LeadSource | '';
  assigned_to?: string | '';
}

export const leadService = {
  /**
   * Fetches leads applying search and multi-column filters
   */
  async getLeads(filters?: LeadFilterParams): Promise<{ leads: Lead[]; error: string | null }> {
    if (!isSupabaseConfigured) {
      let filtered = loadLocalLeads();
      if (filters?.search && filters.search.trim()) {
        const q = filters.search.trim().toLowerCase();
        filtered = filtered.filter(
          (l) =>
            l.full_name.toLowerCase().includes(q) ||
            l.phone.toLowerCase().includes(q) ||
            (l.email && l.email.toLowerCase().includes(q)) ||
            l.course_interest.toLowerCase().includes(q)
        );
      }
      if (filters?.status) {
        filtered = filtered.filter((l) => l.status === filters.status);
      }
      if (filters?.source) {
        filtered = filtered.filter((l) => l.source === filters.source);
      }
      if (filters?.assigned_to) {
        filtered = filtered.filter((l) => l.assigned_to === filters.assigned_to);
      }
      return { leads: filtered, error: null };
    }

    try {
      let query = supabase
        .from('leads')
        .select(`
          *,
          assignee:profiles!leads_assigned_to_fkey(id, full_name, role)
        `)
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.source) {
        query = query.eq('source', filters.source);
      }
      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }
      if (filters?.search && filters.search.trim()) {
        const clean = filters.search.trim().replace(/[%_]/g, '');
        const s = `%${clean}%`;
        query = query.or(`full_name.ilike.${s},email.ilike.${s},phone.ilike.${s},course_interest.ilike.${s}`);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching leads:', error);
        return { leads: [], error: error.message };
      }

      return { leads: (data || []) as Lead[], error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to retrieve leads.';
      return { leads: [], error: message };
    }
  },

  /**
   * Fetches a single lead by its UUID
   */
  async getLeadById(id: string): Promise<{ lead: Lead | null; error: string | null }> {
    if (!isSupabaseConfigured) {
      const found = loadLocalLeads().find((l) => l.id === id) || null;
      return { lead: found, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          assignee:profiles!leads_assigned_to_fkey(id, full_name, role)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) return { lead: null, error: error.message };
      return { lead: data as Lead, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch lead details.';
      return { lead: null, error: message };
    }
  },

  /**
   * Creates a new lead and logs the creation activity
   */
  async createLead(
    leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'assignee'>,
    actorId?: string
  ): Promise<{ lead: Lead | null; error: string | null }> {
    if (!isSupabaseConfigured) {
      const current = loadLocalLeads();
      const newLead: Lead = {
        ...leadData,
        id: `demo-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      current.unshift(newLead);
      saveLocalLeads(current);
      return { lead: newLead, error: null };
    }

    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          full_name: leadData.full_name.trim(),
          email: leadData.email ? leadData.email.trim() : null,
          phone: leadData.phone.trim(),
          course_interest: leadData.course_interest.trim(),
          source: leadData.source,
          status: leadData.status || 'New',
          lost_reason: leadData.lost_reason || null,
          assigned_to: leadData.assigned_to || null,
          created_by: actorId || null,
          notes: leadData.notes ? leadData.notes.trim() : null
        })
        .select()
        .single();

      if (error) return { lead: null, error: error.message };

      // Log creation activity
      await supabase.from('activities').insert({
        lead_id: data.id,
        actor_id: actorId || null,
        activity_type: 'created',
        description: `Lead created from ${leadData.source} enquiry`,
        metadata: { course: leadData.course_interest, source: leadData.source }
      });

      return { lead: data as Lead, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create lead.';
      return { lead: null, error: message };
    }
  },

  /**
   * Updates lead fields and creates an activity log if status changed
   */
  async updateLead(
    id: string,
    updates: Partial<Lead>,
    previousStatus?: LeadStatus,
    actorId?: string
  ): Promise<{ lead: Lead | null; error: string | null }> {
    if (!isSupabaseConfigured) {
      const current = loadLocalLeads();
      const idx = current.findIndex((l) => l.id === id);
      if (idx !== -1) {
        current[idx] = {
          ...current[idx],
          ...updates,
          updated_at: new Date().toISOString()
        };
        saveLocalLeads(current);
        return { lead: current[idx], error: null };
      }
      return { lead: null, error: 'Lead not found.' };
    }

    try {
      const { data, error } = await supabase
        .from('leads')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) return { lead: null, error: error.message };

      // If status changed, record status_changed activity
      if (updates.status && previousStatus && updates.status !== previousStatus) {
        let desc = `Status changed from ${previousStatus} to ${updates.status}`;
        if (updates.status === 'Lost' && updates.lost_reason) {
          desc += `. Reason: ${updates.lost_reason}`;
        }

        await supabase.from('activities').insert({
          lead_id: id,
          actor_id: actorId || null,
          activity_type: 'status_changed',
          description: desc,
          metadata: { from: previousStatus, to: updates.status, reason: updates.lost_reason || null }
        });
      }

      return { lead: data as Lead, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update lead.';
      return { lead: null, error: message };
    }
  },

  /**
   * Deletes a lead
   */
  async deleteLead(id: string): Promise<{ success: boolean; error: string | null }> {
    if (!isSupabaseConfigured) {
      const current = loadLocalLeads().filter((l) => l.id !== id);
      saveLocalLeads(current);
      return { success: true, error: null };
    }

    try {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) return { success: false, error: error.message };
      return { success: true, error: null };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete lead.';
      return { success: false, error: message };
    }
  }
};
