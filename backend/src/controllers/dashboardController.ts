import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';

export const getDashboardSummary = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const userId = req.user.id;

        // Get latest sensor reading for weather data
        const { data: latestReading, error: sensorError } = await supabase
            .from('sensor_readings')
            .select('temperature, humidity, timestamp')
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();

        // Weather data from sensor or defaults
        const weather = {
            temp: latestReading?.temperature || 25,
            condition: latestReading?.humidity && latestReading.humidity > 70 ? 'Cloudy' : 'Sunny',
            humidity: latestReading?.humidity || 60,
            forecast: 'Clear skies expected for the next 24 hours.'
        };

        // Get latest sensor reading for soil mood calculation
        const { data: recentReadings } = await supabase
            .from('sensor_readings')
            .select('soil_moisture, soil_ph, temperature')
            .order('timestamp', { ascending: false })
            .limit(5);

        // Calculate soil mood based on recent readings
        let soilMood = {
            label: 'Neutral',
            icon: 'leaf',
            color: 'gray'
        };

        if (recentReadings && recentReadings.length > 0) {
            const avgMoisture = recentReadings.reduce((sum, r) => sum + (r.soil_moisture || 0), 0) / recentReadings.length;
            const avgPh = recentReadings.reduce((sum, r) => sum + (r.soil_ph || 7), 0) / recentReadings.length;

            if (avgMoisture > 60 && avgPh >= 6 && avgPh <= 7.5) {
                soilMood = { label: 'Happy', icon: 'leaf', color: 'green' };
            } else if (avgMoisture < 30 || avgPh < 5.5 || avgPh > 8) {
                soilMood = { label: 'Stressed', icon: 'leaf', color: 'red' };
            } else {
                soilMood = { label: 'Moderate', icon: 'leaf', color: 'yellow' };
            }
        }

        // Get today's action count
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count: actionCount } = await supabase
            .from('actions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('action_timestamp', today.toISOString());

        // Get current month average scores
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const { data: monthlyScores } = await supabase
            .from('scores')
            .select('soil_health_score, smart_irrigation_score, weed_risk_score')
            .eq('user_id', userId)
            .gte('date', `${currentMonth}-01`)
            .lt('date', `${currentMonth}-32`);

        let scores = {
            soilHealth: 0,
            smartIrrigation: 0,
            weedRisk: 0
        };

        if (monthlyScores && monthlyScores.length > 0) {
            const avgSoilHealth = monthlyScores.reduce((sum, s) => sum + (s.soil_health_score || 0), 0) / monthlyScores.length;
            const avgIrrigation = monthlyScores.reduce((sum, s) => sum + (s.smart_irrigation_score || 0), 0) / monthlyScores.length;
            const avgWeedRisk = monthlyScores.reduce((sum, s) => sum + (s.weed_risk_score || 0), 0) / monthlyScores.length;

            scores = {
                soilHealth: Math.round(avgSoilHealth),
                smartIrrigation: Math.round(avgIrrigation),
                weedRisk: Math.round(avgWeedRisk)
            };
        } else {
            // Default scores if no data
            scores = { soilHealth: 75, smartIrrigation: 75, weedRisk: 25 };
        }

        // Get latest 3 alerts
        const { data: alerts } = await supabase
            .from('alerts')
            .select('id, type, message, severity, created_at')
            .eq('user_id', userId)
            .eq('acknowledged', false)
            .order('created_at', { ascending: false })
            .limit(3);

        res.json({
            weather,
            soilMood,
            actionCount: actionCount || 0,
            scores,
            alerts: alerts || []
        });
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
