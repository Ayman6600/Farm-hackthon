import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';

// Ask Assistant
export const askAssistant = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { queryText } = req.body;

        let answer = "I'm here to help! Ask me about irrigation, weeds, or crop management.";

        if (queryText.toLowerCase().includes('irrigat')) {
            answer = "Based on current soil moisture levels, I recommend irrigating within the next 24 hours. Average water requirement is 25mm per week.";
        } else if (queryText.toLowerCase().includes('weed')) {
            answer = "Current weed risk is low. Monitor fields weekly and schedule weeding if you notice increased weed pressure.";
        } else if (queryText.toLowerCase().includes('fertiliz')) {
            answer = "For optimal growth, apply nitrogen-rich fertilizer during the vegetative stage. Recommended: 40kg/hectare.";
        }

        res.json({
            query: queryText,
            answer,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in assistant:', error);
        res.status(500).json({ error: 'Failed to process query' });
    }
};
