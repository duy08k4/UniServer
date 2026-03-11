import { registerAs } from '@nestjs/config';

export default registerAs('supabase', () => {
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !anonKey) {
        throw new Error(
            'Missing required Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY)',
        );
    }

    return {
        url,
        anonKey,
        serviceRoleKey,
        storage: {
            bucket: 'report-attachments',
        },
    };
});