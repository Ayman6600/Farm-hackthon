import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';
import { calculateWeedRiskScore } from '../services/weedRiskService';

// Log Farm Action
export const logAction = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const userId = req.user.id;
        const { actionType, farmId, fieldId, cropId, actionTimestamp, quantity, unit, notes, voiceTranscript } = req.body;

        // Insert action into database
        const { data: action, error: actionError } = await supabase
            .from('actions')
            .insert({
                user_id: userId,
                farm_id: farmId || null,
                field_id: fieldId || null,
                crop_id: cropId || null,
                action_type: actionType,
                action_timestamp: actionTimestamp || new Date().toISOString(),
                quantity: quantity || null,
                unit: unit || null,
                notes: notes || null,
                voice_transcript: voiceTranscript || null
            })
            .select()
            .single();

        if (actionError) {
            console.error('Error inserting action:', actionError);
            return res.status(500).json({ error: 'Failed to log action' });
        }

        // Get latest sensor readings for score calculation
        const { data: latestReading } = await supabase
            .from('sensor_readings')
            .select('humidity, temperature, soil_moisture, soil_ph')
            .eq('field_id', fieldId || '')
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();

        // Get field info for weed risk calculation
        const { data: field } = await supabase
            .from('fields')
            .select('soil_type, irrigation_type')
            .eq('id', fieldId || '')
            .single();

        // Get irrigation frequency (actions in last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const { count: irrigationCount } = await supabase
            .from('actions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('action_type', 'irrigation')
            .gte('action_timestamp', sevenDaysAgo.toISOString());

        // Calculate weed risk score
        const weedRiskParams = {
            humidity: latestReading?.humidity || 60,
            temperature: latestReading?.temperature || 25,
            soilType: field?.soil_type || 'unknown',
            cropSpacing: 'medium', // Default, could be enhanced
            irrigationFrequency: irrigationCount || 0
        };

        const weedRiskResult = calculateWeedRiskScore(weedRiskParams);

        // Calculate scores based on action type and sensor data
        let soilHealth = 75;
        let smartIrrigation = 75;

        if (latestReading) {
            // Soil health based on moisture and pH
            const moistureScore = latestReading.soil_moisture ? Math.min(100, (latestReading.soil_moisture / 100) * 100) : 75;
            const phScore = latestReading.soil_ph 
                ? (latestReading.soil_ph >= 6 && latestReading.soil_ph <= 7.5 ? 100 : Math.max(50, 100 - Math.abs(7 - latestReading.soil_ph) * 20))
                : 75;
            soilHealth = Math.round((moistureScore + phScore) / 2);

            // Smart irrigation based on moisture levels and irrigation actions
            if (actionType === 'irrigation') {
                smartIrrigation = latestReading.soil_moisture < 40 ? 90 : 70;
            } else {
                smartIrrigation = latestReading.soil_moisture >= 40 && latestReading.soil_moisture <= 80 ? 85 : 65;
            }
        }

        // Insert scores into database
        const today = new Date().toISOString().split('T')[0];
        const { data: score } = await supabase
            .from('scores')
            .insert({
                user_id: userId,
                farm_id: farmId || null,
                field_id: fieldId || null,
                crop_id: cropId || null,
                action_id: action.id,
                date: today,
                soil_health_score: soilHealth,
                smart_irrigation_score: smartIrrigation,
                weed_risk_score: weedRiskResult.score
            })
            .select()
            .single();

        // Generate alerts if needed
        const alerts = [];
        if (weedRiskResult.score > 70) {
            const { data: alert } = await supabase
                .from('alerts')
                .insert({
                    user_id: userId,
                    farm_id: farmId || null,
                    field_id: fieldId || null,
                    crop_id: cropId || null,
                    type: 'weed_risk',
                    severity: 'high',
                    risk_score: weedRiskResult.score,
                    message: weedRiskResult.message,
                    suggested_action: 'Schedule weeding activity immediately'
                })
                .select()
                .single();

            if (alert) alerts.push(alert);
        } else if (weedRiskResult.score > 40) {
            const { data: alert } = await supabase
                .from('alerts')
                .insert({
                    user_id: userId,
                    farm_id: farmId || null,
                    field_id: fieldId || null,
                    crop_id: cropId || null,
                    type: 'weed_risk',
                    severity: 'medium',
                    risk_score: weedRiskResult.score,
                    message: weedRiskResult.message,
                    suggested_action: 'Monitor field closely for weed growth'
                })
                .select()
                .single();

            if (alert) alerts.push(alert);
        }

        // Check for water stress
        if (latestReading && latestReading.soil_moisture < 30) {
            const { data: alert } = await supabase
                .from('alerts')
                .insert({
                    user_id: userId,
                    farm_id: farmId || null,
                    field_id: fieldId || null,
                    crop_id: cropId || null,
                    type: 'water_stress',
                    severity: 'medium',
                    message: `Low soil moisture detected (${latestReading.soil_moisture}%) - consider irrigation`,
                    suggested_action: 'Schedule irrigation within 24 hours'
                })
                .select()
                .single();

            if (alert) alerts.push(alert);
        }

        res.json({
            success: true,
            actionId: action.id,
            scores: {
                soilHealth,
                smartIrrigation,
                weedRisk: {
                    score: weedRiskResult.score,
                    level: weedRiskResult.level
                }
            },
            alerts
        });
    } catch (error) {
        console.error('Error logging action:', error);
        res.status(500).json({ error: 'Failed to log action' });
    }
};

// Get Weed Risk
export const getWeedRisk = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const userId = req.user.id;

        // Get latest weed risk score from scores table
        const { data: latestScore } = await supabase
            .from('scores')
            .select('weed_risk_score, date, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        // Get previous score for trend calculation
        const { data: previousScore } = await supabase
            .from('scores')
            .select('weed_risk_score, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(2);

        let trend = 'stable';
        if (previousScore && previousScore.length === 2) {
            const current = previousScore[0].weed_risk_score || 0;
            const previous = previousScore[1].weed_risk_score || 0;
            if (current > previous + 5) trend = 'increasing';
            else if (current < previous - 5) trend = 'decreasing';
        }

        const currentScore = latestScore?.weed_risk_score || 25;
        let level = 'low';
        if (currentScore > 70) level = 'high';
        else if (currentScore > 40) level = 'medium';

        res.json({
            currentScore,
            level,
            trend,
            lastUpdated: latestScore?.created_at || new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting weed risk:', error);
        res.status(500).json({ error: 'Failed to get weed risk' });
    }
};
