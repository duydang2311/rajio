-- Migration number: 0003 	 2026-05-27T03:52:52.797Z
CREATE TABLE
    tracks (
        id INTEGER PRIMARY KEY,
        room_id CHAR(36) NOT NULL,
        creator_id CHAR(36) NOT NULL,
        created_at REAL NOT NULL DEFAULT (unixepoch ('now', 'subsec')),
        kind TEXT CHECK (kind IN ('soundcloud', 'youtube')) NOT NULL,
        url TEXT NOT NULL,
        FOREIGN KEY (room_id) REFERENCES rooms (id),
        FOREIGN KEY (creator_id) REFERENCES users (id)
    );