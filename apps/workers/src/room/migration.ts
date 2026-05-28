export function migrate(ctx: DurableObjectState) {
    ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS _sql_schema_migrations (
            id INTEGER PRIMARY KEY,
            applied_at TEXT NOT NULL DEFAULT (datetime ('now'))
        )
    `);

    const version = ctx.storage.sql
        .exec<{
            version: number;
        }>('SELECT COALESCE(MAX(id), 0) AS version FROM _sql_schema_migrations')
        .one().version;
        console.log(version);

    if (version < 1) {
        ctx.storage.sql.exec(`
            CREATE TABLE playback_states (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                current_track_id INTEGER NULL,
                played_at_epoch_ms INTEGER NULL,
                position_ms INTEGER NOT NULL DEFAULT 0
            );
            INSERT INTO playback_states (id) VALUES (1);
            INSERT INTO _sql_schema_migrations (id) VALUES (1);
        `);
    }

    if (version < 2) {
        ctx.storage.sql.exec(`
            DROP TABLE playback_states;
            CREATE TABLE playback_states (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                current_track_id TEXT NULL,
                played_at_epoch_ms INTEGER NULL,
                position_ms INTEGER NOT NULL DEFAULT 0
            );
            INSERT INTO playback_states (id) VALUES (1);
            INSERT INTO _sql_schema_migrations (id) VALUES (2);
        `);
    }

    if (version < 3) {
        ctx.storage.sql.exec(`
            DROP TABLE playback_states;
            CREATE TABLE playback_states (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                current_track_id TEXT NULL,
                started_at_ms INTEGER NULL,
                position_ms INTEGER NOT NULL DEFAULT 0
            );
            INSERT INTO playback_states (id) VALUES (1);
            INSERT INTO _sql_schema_migrations (id) VALUES (3);
        `);
    }

    if (version < 4) {
        ctx.storage.sql.exec(`
            DROP TABLE playback_states;
            CREATE TABLE playback_states (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                current_track_id TEXT NULL,
                started_at_ms INTEGER NULL,
                position_ms INTEGER NOT NULL DEFAULT 0,
                volume REAL NOT NULL DEFAULT 1 CHECK (volume >= 0 AND volume <= 1)
            );
            INSERT INTO playback_states (id) VALUES (1);
            INSERT INTO _sql_schema_migrations (id) VALUES (4);
        `);
    }

    if (version < 5) {
        ctx.storage.sql.exec(`
            DROP TABLE playback_states;
            CREATE TABLE playback_states (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                current_track_id INTEGER NULL,
                started_at_ms INTEGER NULL,
                position_ms INTEGER NOT NULL DEFAULT 0,
                volume REAL NOT NULL DEFAULT 1 CHECK (volume >= 0 AND volume <= 1)
            );
            INSERT INTO playback_states (id) VALUES (1);
            INSERT INTO _sql_schema_migrations (id) VALUES (5);
        `);
    }
}
