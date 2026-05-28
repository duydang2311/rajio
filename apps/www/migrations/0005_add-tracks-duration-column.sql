-- Migration number: 0005 	 2026-05-28T13:57:36.608Z
CREATE TABLE
    tracks_new (
        id INTEGER PRIMARY KEY,
        room_id INTEGER NOT NULL,
        creator_id TEXT NOT NULL,
        created_at REAL NOT NULL DEFAULT (unixepoch ('now', 'subsec')),
        kind TEXT NOT NULL CHECK (kind IN ('soundcloud', 'youtube')),
        url TEXT NOT NULL,
        duration INTEGER NOT NULL,
        FOREIGN KEY (room_id) REFERENCES rooms (id),
        FOREIGN KEY (creator_id) REFERENCES users (id)
    );

INSERT INTO tracks_new (id, room_id, creator_id, created_at, kind, url, duration) SELECT id, room_id, creator_id, created_at, kind, url, 9007199254740991 FROM tracks;

DROP TABLE tracks;

ALTER TABLE tracks_new
RENAME TO tracks;
