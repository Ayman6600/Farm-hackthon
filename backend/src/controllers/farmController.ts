import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabase } from '../config/supabase';

// Get Profile, Farm, Fields, Crops
export const getProfileOverview = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const userId = req.user.id;

        // Get or create profile
        let { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileError && profileError.code === 'PGRST116') {
            // Profile doesn't exist, create it
            const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                    id: userId,
                    email: req.user.email,
                    name: req.user.email?.split('@')[0] || 'Farmer',
                    region: null,
                    preferred_language: 'en'
                })
                .select()
                .single();

            if (createError) {
                console.error('Error creating profile:', createError);
                return res.status(500).json({ error: 'Failed to create profile' });
            }
            profile = newProfile;
        } else if (profileError) {
            console.error('Error fetching profile:', profileError);
            return res.status(500).json({ error: 'Failed to fetch profile' });
        }

        // Get farms with fields and crops
        const { data: farms, error: farmsError } = await supabase
            .from('farms')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (farmsError) {
            console.error('Error fetching farms:', farmsError);
            return res.status(500).json({ error: 'Failed to fetch farms' });
        }

        // For each farm, get fields and crops
        const farmsWithDetails = await Promise.all(
            (farms || []).map(async (farm) => {
                const { data: fields } = await supabase
                    .from('fields')
                    .select('*')
                    .eq('farm_id', farm.id)
                    .order('created_at', { ascending: false });

                const fieldsWithCrops = await Promise.all(
                    (fields || []).map(async (field) => {
                        const { data: crops } = await supabase
                            .from('crops')
                            .select('*')
                            .eq('field_id', field.id)
                            .order('created_at', { ascending: false });

                        return {
                            ...field,
                            crops: crops || []
                        };
                    })
                );

                return {
                    ...farm,
                    fields: fieldsWithCrops
                };
            })
        );

        res.json({
            profile: profile || {
                id: userId,
                email: req.user.email,
                name: null,
                region: null,
                preferred_language: 'en'
            },
            farms: farmsWithDetails
        });
    } catch (error) {
        console.error('Error fetching profile overview:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Update Profile
export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const userId = req.user.id;
        const updates = req.body;

        const { data: profile, error } = await supabase
            .from('profiles')
            .update({
                name: updates.name,
                region: updates.region,
                preferred_language: updates.preferred_language || 'en',
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error updating profile:', error);
            return res.status(500).json({ error: 'Failed to update profile' });
        }

        res.json(profile);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

// Create/Update Farm
export const upsertFarm = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const userId = req.user.id;
        const { id, name, location_text, primary_crops } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Farm name is required' });
        }

        let farm;
        if (id) {
            // Update existing farm
            const { data, error } = await supabase
                .from('farms')
                .update({
                    name,
                    location_text: location_text || null,
                    primary_crops: primary_crops || [],
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) {
                console.error('Error updating farm:', error);
                return res.status(500).json({ error: 'Failed to update farm' });
            }
            farm = data;
        } else {
            // Create new farm
            const { data, error } = await supabase
                .from('farms')
                .insert({
                    user_id: userId,
                    name,
                    location_text: location_text || null,
                    primary_crops: primary_crops || []
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating farm:', error);
                return res.status(500).json({ error: 'Failed to create farm' });
            }
            farm = data;
        }

        res.json(farm);
    } catch (error) {
        console.error('Error upserting farm:', error);
        res.status(500).json({ error: 'Failed to save farm' });
    }
};

// Create/Update Field
export const upsertField = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { id, farm_id, name, area_hectares, soil_type, irrigation_type } = req.body;

        if (!name || !farm_id) {
            return res.status(400).json({ error: 'Field name and farm_id are required' });
        }

        // Verify farm belongs to user
        const { data: farm } = await supabase
            .from('farms')
            .select('id')
            .eq('id', farm_id)
            .eq('user_id', req.user.id)
            .single();

        if (!farm) {
            return res.status(403).json({ error: 'Farm not found or access denied' });
        }

        let field;
        if (id) {
            // Update existing field
            const { data, error } = await supabase
                .from('fields')
                .update({
                    name,
                    area_hectares: area_hectares || null,
                    soil_type: soil_type || 'unknown',
                    irrigation_type: irrigation_type || 'other',
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Error updating field:', error);
                return res.status(500).json({ error: 'Failed to update field' });
            }
            field = data;
        } else {
            // Create new field
            const { data, error } = await supabase
                .from('fields')
                .insert({
                    farm_id,
                    name,
                    area_hectares: area_hectares || null,
                    soil_type: soil_type || 'unknown',
                    irrigation_type: irrigation_type || 'other'
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating field:', error);
                return res.status(500).json({ error: 'Failed to create field' });
            }
            field = data;
        }

        res.json(field);
    } catch (error) {
        console.error('Error upserting field:', error);
        res.status(500).json({ error: 'Failed to save field' });
    }
};

// Create/Update Crop
export const upsertCrop = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { id, field_id, name, variety, sowing_date, expected_harvest_date, current_stage } = req.body;

        if (!name || !field_id) {
            return res.status(400).json({ error: 'Crop name and field_id are required' });
        }

        // Verify field belongs to user's farm
        const { data: field } = await supabase
            .from('fields')
            .select('farm_id')
            .eq('id', field_id)
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

        let crop;
        if (id) {
            // Update existing crop
            const { data, error } = await supabase
                .from('crops')
                .update({
                    name,
                    variety: variety || null,
                    sowing_date: sowing_date || null,
                    expected_harvest_date: expected_harvest_date || null,
                    current_stage: current_stage || 'unknown',
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Error updating crop:', error);
                return res.status(500).json({ error: 'Failed to update crop' });
            }
            crop = data;
        } else {
            // Create new crop
            const { data, error } = await supabase
                .from('crops')
                .insert({
                    field_id,
                    name,
                    variety: variety || null,
                    sowing_date: sowing_date || null,
                    expected_harvest_date: expected_harvest_date || null,
                    current_stage: current_stage || 'unknown'
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating crop:', error);
                return res.status(500).json({ error: 'Failed to create crop' });
            }
            crop = data;
        }

        res.json(crop);
    } catch (error) {
        console.error('Error upserting crop:', error);
        res.status(500).json({ error: 'Failed to save crop' });
    }
};
