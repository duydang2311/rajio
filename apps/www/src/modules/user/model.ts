import type { CamelCase } from '$lib/utils/types';

export interface UserRow {
    id: string;
    created_at: number;
    display_name: string;
}

export type User = CamelCase<UserRow>;
