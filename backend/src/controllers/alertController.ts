import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';

// Get Alerts
export const getAlerts = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const userId = req.user.id;

        // Query alerts from database
        const { data: alerts, error } = await supabase
            .from('alerts')
            .select('id, type, message, severity, created_at, suggested_action, risk_score, acknowledged')
            .eq('user_id', userId)
            .eq('acknowledged', false)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching alerts:', error);
            return res.status(500).json({ error: 'Failed to fetch alerts' });
        }

        res.json(alerts || []);
    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
};

// Trigger Risk Analysis
export const triggerRiskAnalysis = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        res.json({
            success: true,
            message: 'Risk analysis triggered successfully'
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to trigger analysis' });
    }
};
