import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';

// Get Monthly Report
export const getMonthlyReport = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const userId = req.user.id;
        const { month } = req.query;
        const reportMonth = (month as string) || new Date().toISOString().slice(0, 7);

        // Check if report already exists
        const { data: existingReport } = await supabase
            .from('monthly_reports')
            .select('*')
            .eq('user_id', userId)
            .eq('month', reportMonth)
            .single();

        if (existingReport) {
            return res.json(existingReport);
        }

        // Generate new report from data
        const monthStart = `${reportMonth}-01`;
        const nextMonth = new Date(`${reportMonth}-01`);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const monthEnd = nextMonth.toISOString().slice(0, 10);

        // Get total actions for the month
        const { count: totalActions } = await supabase
            .from('actions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('action_timestamp', monthStart)
            .lt('action_timestamp', monthEnd);

        // Get average scores for the month
        const { data: scores } = await supabase
            .from('scores')
            .select('soil_health_score, weed_risk_score, smart_irrigation_score')
            .eq('user_id', userId)
            .gte('date', monthStart)
            .lt('date', monthEnd);

        let averageSoilHealth = 0;
        let averageWeedRisk = 0;
        let averageIrrigation = 0;

        if (scores && scores.length > 0) {
            averageSoilHealth = Math.round(
                scores.reduce((sum, s) => sum + (s.soil_health_score || 0), 0) / scores.length
            );
            averageWeedRisk = Math.round(
                scores.reduce((sum, s) => sum + (s.weed_risk_score || 0), 0) / scores.length
            );
            averageIrrigation = Math.round(
                scores.reduce((sum, s) => sum + (s.smart_irrigation_score || 0), 0) / scores.length
            );
        }

        // Get total irrigated area (sum of irrigation actions with quantity)
        const { data: irrigationActions } = await supabase
            .from('actions')
            .select('quantity, unit')
            .eq('user_id', userId)
            .eq('action_type', 'irrigation')
            .gte('action_timestamp', monthStart)
            .lt('action_timestamp', monthEnd);

        let totalIrrigated = 0;
        if (irrigationActions) {
            totalIrrigated = irrigationActions.reduce((sum, action) => {
                if (action.unit === 'hectares' || action.unit === 'ha') {
                    return sum + (Number(action.quantity) || 0);
                }
                return sum;
            }, 0);
        }

        // Calculate rewards tier based on average scores
        const avgScore = (averageSoilHealth + averageIrrigation + (100 - averageWeedRisk)) / 3;
        let rewardsTier: 'none' | 'bronze' | 'silver' | 'gold' = 'none';
        if (avgScore >= 85) rewardsTier = 'gold';
        else if (avgScore >= 70) rewardsTier = 'silver';
        else if (avgScore >= 60) rewardsTier = 'bronze';

        const summaryJson = {
            totalActions: totalActions || 0,
            averageSoilHealth,
            averageWeedRisk,
            averageIrrigation,
            totalIrrigated,
            unit: 'hectares'
        };

        // Create and save report
        const { data: report, error } = await supabase
            .from('monthly_reports')
            .insert({
                user_id: userId,
                month: reportMonth,
                summary_json: summaryJson,
                rewards_tier: rewardsTier
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating report:', error);
            return res.status(500).json({ error: 'Failed to generate report' });
        }

        res.json(report);
    } catch (error) {
        console.error('Error fetching report:', error);
        res.status(500).json({ error: 'Failed to fetch report' });
    }
};

// Generate Report
export const generateReport = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const userId = req.user.id;
        const { month } = req.body;
        const reportMonth = month || new Date().toISOString().slice(0, 7);

        // Force regenerate by deleting existing report and creating new one
        await supabase
            .from('monthly_reports')
            .delete()
            .eq('user_id', userId)
            .eq('month', reportMonth);

        // Call getMonthlyReport logic to regenerate
        const monthStart = `${reportMonth}-01`;
        const nextMonth = new Date(`${reportMonth}-01`);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const monthEnd = nextMonth.toISOString().slice(0, 10);

        const { count: totalActions } = await supabase
            .from('actions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('action_timestamp', monthStart)
            .lt('action_timestamp', monthEnd);

        const { data: scores } = await supabase
            .from('scores')
            .select('soil_health_score, weed_risk_score, smart_irrigation_score')
            .eq('user_id', userId)
            .gte('date', monthStart)
            .lt('date', monthEnd);

        let averageSoilHealth = 0;
        let averageWeedRisk = 0;
        let averageIrrigation = 0;

        if (scores && scores.length > 0) {
            averageSoilHealth = Math.round(
                scores.reduce((sum, s) => sum + (s.soil_health_score || 0), 0) / scores.length
            );
            averageWeedRisk = Math.round(
                scores.reduce((sum, s) => sum + (s.weed_risk_score || 0), 0) / scores.length
            );
            averageIrrigation = Math.round(
                scores.reduce((sum, s) => sum + (s.smart_irrigation_score || 0), 0) / scores.length
            );
        }

        const avgScore = (averageSoilHealth + averageIrrigation + (100 - averageWeedRisk)) / 3;
        let rewardsTier: 'none' | 'bronze' | 'silver' | 'gold' = 'none';
        if (avgScore >= 85) rewardsTier = 'gold';
        else if (avgScore >= 70) rewardsTier = 'silver';
        else if (avgScore >= 60) rewardsTier = 'bronze';

        const summaryJson = {
            totalActions: totalActions || 0,
            averageSoilHealth,
            averageWeedRisk,
            averageIrrigation,
            totalIrrigated: 0,
            unit: 'hectares'
        };

        const { data: report, error } = await supabase
            .from('monthly_reports')
            .insert({
                user_id: userId,
                month: reportMonth,
                summary_json: summaryJson,
                rewards_tier: rewardsTier
            })
            .select()
            .single();

        if (error) {
            console.error('Error generating report:', error);
            return res.status(500).json({ error: 'Failed to generate report' });
        }

        res.json({
            success: true,
            message: 'Report generated successfully',
            reportId: report.id,
            report
        });
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
};
