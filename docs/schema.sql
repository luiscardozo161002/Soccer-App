-- =========================================================
-- Soccer App - Database schema (PostgreSQL)
-- Mirrors prisma/schema.prisma exactly (same tables/columns).
-- Superseded the earlier SQL Server draft after the project
-- settled on Next.js + Prisma + PostgreSQL.
-- =========================================================

CREATE TYPE status AS ENUM ('active', 'inactive');
-- Estado de los equipos, jugadores, canchas, partidos, tarjetas, sanciones, ajustes de puntos, usuarios
CREATE TYPE match_status AS ENUM ('scheduled', 'played', 'postponed', 'cancelled');
-- Estado de los partidos
CREATE TYPE card_type AS ENUM ('yellow', 'red');
-- Tipo de tarjeta

CREATE TABLE teams ( -- Equipos
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name VARCHAR(100) NOT NULL,
    photo BYTEA, -- optimizada a webp 512x512 antes de guardarse
    photo_type VARCHAR(50),
    registered_at TIMESTAMP NOT NULL DEFAULT now(),
    status status NOT NULL DEFAULT 'active'
);

CREATE TABLE fields ( --Canchas
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200),
    status status NOT NULL DEFAULT 'active'
);

CREATE TABLE players ( -- Jugadores
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    team_id UUID NOT NULL REFERENCES teams (id),
    name VARCHAR(100) NOT NULL,
    photo BYTEA, -- optimizada a webp 512x512 antes de guardarse
    photo_type VARCHAR(50),
    birth_date DATE,
    registration_number VARCHAR(30) NOT NULL UNIQUE,
    status status NOT NULL DEFAULT 'active'
);

-- Home/away como dos FKs explicitas a teams (no un id_equipo generico
-- ambiguo). Sin columnas de conteo/puntos derivados: eso se calcula
-- en la vista `standings` a partir de esta tabla y de `cards`.
CREATE TABLE matches ( -- Partidos
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    home_team_id UUID NOT NULL REFERENCES teams (id),
    away_team_id UUID NOT NULL REFERENCES teams (id),
    field_id UUID NOT NULL REFERENCES fields (id),
    matchday INT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    home_goals INT,
    away_goals INT,
    status match_status NOT NULL DEFAULT 'scheduled',
    CONSTRAINT chk_matches_different_teams CHECK (home_team_id <> away_team_id)
);

-- Una tarjeta pertenece a un jugador en un partido (la FK vive aqui,
-- no al reves como en el borrador anterior donde matches apuntaba a
-- una sola tarjeta).
CREATE TABLE cards ( -- Tarjetas
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    player_id UUID NOT NULL REFERENCES players (id),
    match_id UUID NOT NULL REFERENCES matches (id),
    type card_type NOT NULL,
    amount DECIMAL(10, 2),
    detail VARCHAR(255),
    recorded_at TIMESTAMP NOT NULL DEFAULT now(),
    status status NOT NULL DEFAULT 'active'
);

-- Suspension derivada de una tarjeta (no toda tarjeta genera una).
-- Guarda el rango de jornadas afectadas, no solo un contador suelto,
-- para poder consultar "esta jugador suspendido en la jornada N".
CREATE TABLE sanctions ( -- Sanciones
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    card_id UUID NOT NULL REFERENCES cards (id),
    matchday_start INT NOT NULL,
    matchday_end INT NOT NULL,
    matches_suspended INT NOT NULL,
    fulfilled BOOLEAN NOT NULL DEFAULT false,
    status status NOT NULL DEFAULT 'active'
);

CREATE TABLE point_adjustments ( -- Ajustes de puntos
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    team_id UUID NOT NULL REFERENCES teams (id),
    points INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    date TIMESTAMP NOT NULL DEFAULT now(),
    status status NOT NULL DEFAULT 'active'
);

CREATE TABLE users ( -- Usuarios
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone_number VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'admin',
    status status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- =========================================================
-- Torneo de Copa (eliminación directa) — separado por completo de
-- matches/standings. Mezcla equipos de cualquier categoría; los cruces
-- se arman a mano por el admin (sin sorteo automático).
-- =========================================================
CREATE TYPE cup_status AS ENUM ('active', 'archived');
CREATE TYPE cup_entry_status AS ENUM ('active', 'eliminated', 'withdrawn');
CREATE TYPE cup_match_status AS ENUM ('scheduled', 'played', 'postponed', 'cancelled');

CREATE TABLE cups ( -- Copas
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name VARCHAR(100) NOT NULL,
    status cup_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Un equipo inscrito en una copa. eliminated/withdrawn son estados del
-- bracket, independientes de teams.status (ese es global/de la liga).
CREATE TABLE cup_entries ( -- Equipos inscritos en una copa
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    cup_id UUID NOT NULL REFERENCES cups (id),
    team_id UUID NOT NULL REFERENCES teams (id),
    status cup_entry_status NOT NULL DEFAULT 'active',
    eliminated_reason VARCHAR(300),
    eliminated_at TIMESTAMP,
    CONSTRAINT uq_cup_entries_cup_team UNIQUE (cup_id, team_id)
);

-- Un cruce del bracket. field_id es opcional a proposito: un equipo
-- puede retirarse antes de que se le asigne cancha real (gane "default"
-- sin jugarse). created_at se usa para saber si un resultado ya se
-- puede reabrir (nadie avanzo todavia usando ese resultado).
CREATE TABLE cup_matches ( -- Partidos de copa
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    cup_id UUID NOT NULL REFERENCES cups (id),
    round VARCHAR(80) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    home_team_id UUID NOT NULL REFERENCES teams (id),
    away_team_id UUID NOT NULL REFERENCES teams (id),
    field_id UUID REFERENCES fields (id),
    date DATE NOT NULL,
    time TIME,
    home_goals INT,
    away_goals INT,
    forfeit BOOLEAN NOT NULL DEFAULT false,
    forfeit_reason VARCHAR(300),
    result_locked BOOLEAN NOT NULL DEFAULT false,
    status cup_match_status NOT NULL DEFAULT 'scheduled',
    CONSTRAINT chk_cup_matches_different_teams CHECK (home_team_id <> away_team_id)
);

-- =========================================================
-- View: standings (calculated, not stored)
-- =========================================================
CREATE VIEW standings AS
WITH
    results AS (
        SELECT
            home_team_id AS team_id,
            CASE
                WHEN home_goals > away_goals THEN 1
                ELSE 0
            END AS won,
            CASE
                WHEN home_goals = away_goals THEN 1
                ELSE 0
            END AS drawn,
            CASE
                WHEN home_goals < away_goals THEN 1
                ELSE 0
            END AS lost,
            home_goals AS goals_for,
            away_goals AS goals_against
        FROM matches
        WHERE
            status = 'played'
        UNION ALL
        SELECT
            away_team_id,
            CASE
                WHEN away_goals > home_goals THEN 1
                ELSE 0
            END,
            CASE
                WHEN away_goals = home_goals THEN 1
                ELSE 0
            END,
            CASE
                WHEN away_goals < home_goals THEN 1
                ELSE 0
            END,
            away_goals,
            home_goals
        FROM matches
        WHERE
            status = 'played'
    ),
    aggregated AS (
        SELECT
            team_id,
            COUNT(*) AS played,
            SUM(won) AS won,
            SUM(drawn) AS drawn,
            SUM(lost) AS lost,
            SUM(goals_for) AS goals_for,
            SUM(goals_against) AS goals_against
        FROM results
        GROUP BY
            team_id
    )
SELECT
    t.id AS team_id,
    t.name,
    COALESCE(a.played, 0) AS played,
    (
        SELECT COUNT(*)
        FROM matches m
        WHERE
            m.status <> 'played'
            AND (
                m.home_team_id = t.id
                OR m.away_team_id = t.id
            )
    ) AS pending,
    COALESCE(a.won, 0) AS won,
    COALESCE(a.drawn, 0) AS drawn,
    COALESCE(a.lost, 0) AS lost,
    COALESCE(a.goals_for, 0) AS goals_for,
    COALESCE(a.goals_against, 0) AS goals_against,
    COALESCE(a.goals_for, 0) - COALESCE(a.goals_against, 0) AS goal_difference,
    COALESCE(a.won, 0) * 3 + COALESCE(a.drawn, 0) + COALESCE(
        (
            SELECT SUM(points)
            FROM point_adjustments p
            WHERE
                p.team_id = t.id
        ),
        0
    ) AS points
FROM teams t
    LEFT JOIN aggregated a ON a.team_id = t.id;