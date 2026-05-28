-- Migration number: 0004 	 2026-05-27T04:02:54.263Z
CREATE TABLE
    tracks_new (
        id INTEGER PRIMARY KEY,
        room_id INTEGER NOT NULL,
        creator_id TEXT NOT NULL,
        created_at REAL NOT NULL DEFAULT (unixepoch ('now', 'subsec')),
        kind TEXT NOT NULL CHECK (kind IN ('soundcloud', 'youtube')),
        url TEXT NOT NULL,
        FOREIGN KEY (room_id) REFERENCES rooms (id),
        FOREIGN KEY (creator_id) REFERENCES users (id)
    );

DROP TABLE tracks;

ALTER TABLE tracks_new
RENAME TO tracks;