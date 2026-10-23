import { leadService } from './leadService';
import { followUpService } from './followUpService';
import type { DashboardMetrics, Lead, FollowUp, LeadStatus, LeadSource } from '../types/crm.types';

export const dashboardService = {
  /**
   * Calculates dashboard KPIs reconciling strictly with accessible records
   */
  async getMetrics(): Promise<{ metrics: DashboardMetrics; recentLeads: Lead[]; upcomingFollowUps: FollowUp[]; error: string | null }> {
    const [leadsRes, followUpsRes] = await Promise.all([
      leadService.getLeads(),
      followUpService.getFollowUps()
    ]);

    if (leadsRes.error) {
      return {
        metrics: this.getEmptyMetrics(),
        recentLeads: [],
        upcomingFollowUps: [],
        error: leadsRes.error
      };
    }

    const leads = leadsRes.leads;
    const followUps = followUpsRes.followUps || [];

    const totalLeads = leads.length;
    const newLeads = leads.filter((l) => l.status === 'New').length;
    const convertedLeads = leads.filter((l) => l.status === 'Converted').length;

    // Overdue logic: pending and due_at < now
    const overdueFollowUps = followUps.filter((f) => followUpService.isOverdue(f)).length;

    // Conversion rate with division by zero guard
    const conversionRate = totalLeads > 0 
      ? Math.round((convertedLeads / totalLeads) * 100 * 10) / 10 
      : 0;

    // Status breakdown
    const statusDistribution: Record<LeadStatus, number> = {
      New: 0,
      Contacted: 0,
      Qualified: 0,
      Converted: 0,
      Lost: 0
    };
    leads.forEach((l) => {
      if (statusDistribution[l.status] !== undefined) {
        statusDistribution[l.status]++;
      }
    });

    // Source breakdown
    const sourceDistribution: Record<LeadSource, number> = {
      Website: 0,
      Call: 0,
      'Walk-in': 0,
      Referral: 0,
      'Social Media': 0,
      Other: 0
    };
    leads.forEach((l) => {
      if (sourceDistribution[l.source] !== undefined) {
        sourceDistribution[l.source]++;
      }
    });

    // Upcoming pending follow-ups
    const upcomingFollowUps = followUps
      .filter((f) => f.status === 'pending' && !followUpService.isOverdue(f))
      .slice(0, 5);

    // Recent 5 leads
    const recentLeads = leads.slice(0, 5);

    return {
      metrics: {
        totalLeads,
        newLeads,
        convertedLeads,
        overdueFollowUps,
        conversionRate,
        statusDistribution,
        sourceDistribution
      },
      recentLeads,
      upcomingFollowUps,
      error: null
    };
  },

  getEmptyMetrics(): DashboardMetrics {
    return {
      totalLeads: 0,
      newLeads: 0,
      convertedLeads: 0,
      overdueFollowUps: 0,
      conversionRate: 0,
      statusDistribution: {
        New: 0,
        Contacted: 0,
        Qualified: 0,
        Converted: 0,
        Lost: 0
      },
      sourceDistribution: {
        Website: 0,
        Call: 0,
        'Walk-in': 0,
        Referral: 0,
        'Social Media': 0,
        Other: 0
      }
    };
  }
};
