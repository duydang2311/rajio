import type { CamelCaseKeys, EncodedKeys } from './types';

export interface TrackRow {
    id: number;
    room_id: number;
    creator_id: string;
    created_at: number;
    kind: 'soundcloud' | 'youtube';
    url: string;
    duration: number;
}

export interface Track extends CamelCaseKeys<TrackRow> {}

export interface TrackDto extends EncodedKeys<Track, 'id' | 'roomId'> {}
