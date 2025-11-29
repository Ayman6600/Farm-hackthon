interface WeedRiskParams {
    humidity: number;
    temperature: number;
    soilType: string;
    cropSpacing: string; // 'narrow', 'medium', 'wide'
    irrigationFrequency: number; // times in last 7 days
}

export const calculateWeedRiskScore = (params: WeedRiskParams): { score: number; level: string; message: string } => {
    let score = 0;

    // Rule 1: High humidity increases risk
    if (params.humidity > 80) score += 30;
    else if (params.humidity > 60) score += 15;

    // Rule 2: Moderate temperature (20-30C) is ideal for weeds
    if (params.temperature >= 20 && params.temperature <= 30) score += 20;

    // Rule 3: Frequent irrigation promotes weeds
    if (params.irrigationFrequency > 3) score += 25;
    else if (params.irrigationFrequency > 1) score += 10;

    // Rule 4: Narrow spacing makes weeding harder but might suppress some weeds?
    // Let's assume narrow spacing + high moisture = high risk of hidden weeds
    if (params.cropSpacing === 'narrow') score += 10;

    // Rule 5: Soil type
    if (params.soilType === 'loamy') score += 15; // Fertile soil

    // Cap score at 100
    score = Math.min(score, 100);

    let level = 'low';
    if (score > 70) level = 'high';
    else if (score > 40) level = 'medium';

    let message = `Weed Risk: ${score}/100 (${level})`;
    if (level === 'high') message += ' – Early weeding required.';
    else if (level === 'medium') message += ' – Monitor field closely.';
    else message += ' – Low risk currently.';

    return { score, level, message };
};
