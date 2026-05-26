-- Migration number: 0001 	 2026-05-25T07:25:18.829Z
CREATE TABLE
    users (
        id CHAR(36) NOT NULL PRIMARY KEY,
        created_at REAL NOT NULL DEFAULT (unixepoch ('now', 'subsec')),
        display_name TEXT NOT NULL
    );