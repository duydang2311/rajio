-- Migration number: 0002 	 2026-05-26T12:00:19.132Z
CREATE TABLE
    rooms (
        id INTEGER PRIMARY KEY,
        owner_id CHAR(36) NOT NULL,
        created_at REAL NOT NULL DEFAULT (unixepoch ('now', 'subsec')),
        FOREIGN KEY (owner_id) REFERENCES users (id)
    );