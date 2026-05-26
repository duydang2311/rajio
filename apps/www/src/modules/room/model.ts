export interface RoomRow {
    id: number;
    created_at: number;
    display_name: string;
}

export interface Room {
    id: string;
    createdAt: number;
    ownerId: string;
}
