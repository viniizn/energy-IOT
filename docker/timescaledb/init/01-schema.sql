CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE setores (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE dispositivos (
    id SERIAL PRIMARY KEY,
    setor_id INTEGER NOT NULL REFERENCES setores(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('ar_condicionado', 'servidor', 'iluminacao', 'outro')),
    limite_consumo_w NUMERIC,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    papel TEXT NOT NULL CHECK (papel IN ('admin', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE leituras_consumo (
    tempo TIMESTAMPTZ NOT NULL,
    dispositivo_id INTEGER NOT NULL REFERENCES dispositivos(id) ON DELETE CASCADE,
    consumo_w NUMERIC NOT NULL,
    PRIMARY KEY (tempo, dispositivo_id)
);

SELECT create_hypertable('leituras_consumo', 'tempo');

CREATE INDEX idx_leituras_dispositivo_tempo ON leituras_consumo (dispositivo_id, tempo DESC);

CREATE MATERIALIZED VIEW consumo_por_hora
WITH (timescaledb.continuous) AS
SELECT
    dispositivo_id,
    time_bucket('1 hour', tempo) AS hora,
    avg(consumo_w) AS consumo_medio_w,
    max(consumo_w) AS consumo_max_w
FROM leituras_consumo
GROUP BY dispositivo_id, hora;

SELECT add_continuous_aggregate_policy('consumo_por_hora',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour'
);

INSERT INTO setores (nome) VALUES
    ('Climatização'),
    ('TI / Servidores'),
    ('Iluminação');

INSERT INTO dispositivos (setor_id, nome, tipo, limite_consumo_w) VALUES
    (1, 'Ar Condicionado - Sala 1', 'ar_condicionado', 2000),
    (2, 'Servidor Principal', 'servidor', 500),
    (3, 'Iluminação - Andar 1', 'iluminacao', 300);