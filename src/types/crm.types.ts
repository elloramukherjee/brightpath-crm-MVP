export type UserRole = 'admin' | 'manager' | 'counsellor';

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Lost';

export type LeadSource = 'Website' | 'Call' | 'Walk-in' | 'Referral' | 'Social Media' | 'Other';

export type FollowUpStatus = 'pending' | 'completed' | 'cancelled';

export type ActivityType = 
  | 'created' 
  | 'status_changed' 
  | 'note_added' 
  | 'follow_up_created' 
  | 'follow_up_completed';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  course_interest: string;
  source: LeadSource;
  status: LeadStatus;
  lost_reason?: string | null;
  assigned_to: string | null;
  created_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  assignee?: Profile | null;
}

export interface FollowUp {
  id: string;
  lead_id: string;
  assigned_to: string | null;
  due_at: string;
  note: string;
  status: FollowUpStatus;
  completed_at?: string | null;
  created_by: string | null;
  created_at: string;
  lead?: {
    id: string;
    full_name: string;
    phone: string;
    course_interest: string;
  } | null;
  assignee?: Profile | null;
}

export interface Activity {
  id: string;
  lead_id: string;
  actor_id: string | null;
  activity_type: ActivityType;
  description: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  actor?: Profile | null;
}

export interface DashboardMetrics {
  totalLeads: number;
  newLeads: number;
  convertedLeads: number;
  overdueFollowUps: number;
  conversionRate: number; // Percentage
  statusDistribution: Record<LeadStatus, number>;
  sourceDistribution: Record<LeadSource, number>;
}
