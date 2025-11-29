import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';

export const compareCrops = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { crops } = req.body; // Array of crop names

        if (!crops || !Array.isArray(crops) || crops.length === 0) {
            return res.status(400).json({ error: 'Crops array is required' });
        }

        // Get user's fields to determine soil type for suitability
        const { data: userFields } = await supabase
            .from('fields')
            .select('soil_type, farms!inner(user_id)')
            .eq('farms.user_id', req.user.id)
            .limit(1);

        const userSoilType = userFields && userFields.length > 0 ? userFields[0].soil_type : 'unknown';

        // Query crop reference data for all requested crops
        const { data: cropRefs } = await supabase
            .from('crop_reference')
            .select('*')
            .in('name', crops);

        // Query latest market prices for crops
        const { data: marketPrices } = await supabase
            .from('market_prices')
            .select('crop_name, price_per_quintal, date')
            .in('crop_name', crops)
            .order('date', { ascending: false });

        // Build results with real data
        const results = crops.map((cropName: string) => {
            const cropRef = cropRefs?.find((cr: any) => cr.name.toLowerCase() === cropName.toLowerCase());
            const latestPrice = marketPrices?.find((mp: any) => mp.crop_name.toLowerCase() === cropName.toLowerCase());

            // Calculate profit range from base profit per hectare
            let profitRange = 'Unknown';
            if (cropRef?.base_profit_per_hectare) {
                const base = Number(cropRef.base_profit_per_hectare);
                profitRange = `₹${Math.round(base * 0.8 / 1000)}k-${Math.round(base * 1.2 / 1000)}k`;
            }

            // Risk level from base_risk_level
            let riskLevel = 'Unknown';
            if (cropRef?.base_risk_level !== null && cropRef?.base_risk_level !== undefined) {
                const risk = cropRef.base_risk_level;
                if (risk >= 70) riskLevel = 'high';
                else if (risk >= 40) riskLevel = 'medium';
                else riskLevel = 'low';
            }

            // Water need from water_need_level
            const waterNeed = cropRef?.water_need_level || 'Unknown';

            // Calculate soil suitability from soil_preference
            let soilSuitability = 0;
            if (cropRef?.soil_preference && userSoilType !== 'unknown') {
                const preference = cropRef.soil_preference as Record<string, number>;
                soilSuitability = preference[userSoilType] || 50;
            } else {
                soilSuitability = 50; // Default
            }

            return {
                name: cropName,
                profitRange,
                riskLevel,
                waterNeed: waterNeed.toString(),
                soilSuitability,
                marketPrice: latestPrice?.price_per_quintal || null
            };
        });

        res.json({ crops: results });
    } catch (error) {
        console.error('Error comparing crops:', error);
        res.status(500).json({ error: 'Comparison failed' });
    }
};

export const getSwitchSuggestion = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { fieldId } = req.query;

        if (!fieldId) {
            return res.status(400).json({ error: 'fieldId is required' });
        }

        // Verify field belongs to user
        const { data: field } = await supabase
            .from('fields')
            .select('id, soil_type, farm_id')
            .eq('id', fieldId)
            .single();

        if (!field) {
            return res.status(403).json({ error: 'Field not found' });
        }

        // Verify farm belongs to user
        const { data: farm } = await supabase
            .from('farms')
            .select('id, user_id')
            .eq('id', field.farm_id)
            .eq('user_id', req.user.id)
            .single();

        if (!farm) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get current crop for this field
        const { data: currentCrop } = await supabase
            .from('crops')
            .select('*')
            .eq('field_id', fieldId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (!currentCrop) {
            return res.json({
                shouldSwitch: false,
                message: 'No crop found for this field.'
            });
        }

        // Get latest scores and alerts for this field/crop
        const { data: latestScores } = await supabase
            .from('scores')
            .select('weed_risk_score, soil_health_score')
            .eq('field_id', fieldId)
            .eq('crop_id', currentCrop.id)
            .order('created_at', { ascending: false })
            .limit(5);

        const { data: recentAlerts } = await supabase
            .from('alerts')
            .select('type, severity, risk_score')
            .eq('field_id', fieldId)
            .eq('crop_id', currentCrop.id)
            .eq('acknowledged', false)
            .order('created_at', { ascending: false })
            .limit(5);

        // Calculate current risk
        const avgWeedRisk = latestScores && latestScores.length > 0
            ? latestScores.reduce((sum, s) => sum + (s.weed_risk_score || 0), 0) / latestScores.length
            : 0;

        const hasHighRiskAlert = recentAlerts?.some(a => a.severity === 'high' || (a.risk_score && a.risk_score > 70));

        // Get crop reference for current crop
        const { data: currentCropRef } = await supabase
            .from('crop_reference')
            .select('*')
            .eq('name', currentCrop.name)
            .single();

        const currentRiskLevel = currentCropRef?.base_risk_level || 50;

        // Determine if switch is needed
        const shouldSwitch = hasHighRiskAlert || avgWeedRisk > 70 || currentRiskLevel > 70;

        if (!shouldSwitch) {
            return res.json({
                shouldSwitch: false,
                message: 'Current crop is doing well.'
            });
        }

        // Find better alternative crops based on soil type and lower risk
        const { data: alternativeCrops } = await supabase
            .from('crop_reference')
            .select('*')
            .neq('name', currentCrop.name)
            .lt('base_risk_level', currentRiskLevel)
            .order('base_risk_level', { ascending: true })
            .limit(3);

        if (!alternativeCrops || alternativeCrops.length === 0) {
            return res.json({
                shouldSwitch: false,
                message: 'No better alternatives found at this time.'
            });
        }

        // Find best match based on soil preference
        const soilType = field.soil_type || 'unknown';
        let suggestedCrop = alternativeCrops[0];

        for (const crop of alternativeCrops) {
            const preference = crop.soil_preference as Record<string, number> | null;
            if (preference && preference[soilType]) {
                const currentPreference = (suggestedCrop.soil_preference as Record<string, number>)?.[soilType] || 0;
                if (preference[soilType] > currentPreference) {
                    suggestedCrop = crop;
                }
            }
        }

        // Build reason
        let reason = `Switch from ${currentCrop.name} to ${suggestedCrop.name}`;
        if (hasHighRiskAlert) {
            reason += ' — high risk alerts detected.';
        } else if (avgWeedRisk > 70) {
            reason += ' — elevated weed risk.';
        } else {
            reason += ' — lower risk alternative available.';
        }

        res.json({
            shouldSwitch: true,
            currentCrop: currentCrop.name,
            suggestedCrop: suggestedCrop.name,
            reason
        });
    } catch (error) {
        console.error('Error getting switch suggestion:', error);
        res.status(500).json({ error: 'Suggestion failed' });
    }
};
