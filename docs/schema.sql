-- =========================================================
-- Soccer App - Esquema de base de datos (SQL Server)
-- =========================================================

CREATE TABLE equipos (
    id_equipo       INT IDENTITY(1,1) PRIMARY KEY,
    nombre          NVARCHAR(100) NOT NULL,
    fecha_ingreso   DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    foto            NVARCHAR(255) NULL
);

CREATE TABLE canchas (
    id_cancha       INT IDENTITY(1,1) PRIMARY KEY,
    nombre          NVARCHAR(100) NOT NULL,
    ubicacion       NVARCHAR(200) NULL
);

CREATE TABLE jugadores (
    id_jugador          INT IDENTITY(1,1) PRIMARY KEY,
    id_equipo           INT NOT NULL,
    nombre              NVARCHAR(100) NOT NULL,
    foto                NVARCHAR(255) NULL,
    fecha_nacimiento    DATE NULL,
    folio               NVARCHAR(30) NOT NULL,
    CONSTRAINT FK_jugadores_equipo FOREIGN KEY (id_equipo) REFERENCES equipos(id_equipo),
    CONSTRAINT UQ_jugadores_folio UNIQUE (folio)
);

-- Fusiona "Horario partidos" + "Resultados": son la misma entidad
-- antes y despues de jugarse, no dos tablas separadas.
CREATE TABLE partidos (
    id_partido          INT IDENTITY(1,1) PRIMARY KEY,
    id_equipo_local     INT NOT NULL,
    id_equipo_visitante INT NOT NULL,
    id_cancha           INT NOT NULL,
    jornada             INT NOT NULL,
    fecha               DATE NOT NULL,
    hora                TIME NOT NULL,
    goles_local         INT NULL,
    goles_visitante     INT NULL,
    estado              VARCHAR(15) NOT NULL DEFAULT 'programado',
    CONSTRAINT FK_partidos_local FOREIGN KEY (id_equipo_local) REFERENCES equipos(id_equipo),
    CONSTRAINT FK_partidos_visitante FOREIGN KEY (id_equipo_visitante) REFERENCES equipos(id_equipo),
    CONSTRAINT FK_partidos_cancha FOREIGN KEY (id_cancha) REFERENCES canchas(id_cancha),
    CONSTRAINT CK_partidos_estado CHECK (estado IN ('programado','jugado','pospuesto','cancelado')),
    CONSTRAINT CK_partidos_equipos_distintos CHECK (id_equipo_local <> id_equipo_visitante)
);

CREATE TABLE tarjetas (
    id_tarjeta          INT IDENTITY(1,1) PRIMARY KEY,
    id_jugador          INT NOT NULL,
    id_partido          INT NOT NULL,
    tipo                VARCHAR(10) NOT NULL,
    fecha_modificacion  DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    monto               DECIMAL(10,2) NULL,
    detalle             NVARCHAR(255) NULL,
    CONSTRAINT FK_tarjetas_jugador FOREIGN KEY (id_jugador) REFERENCES jugadores(id_jugador),
    CONSTRAINT FK_tarjetas_partido FOREIGN KEY (id_partido) REFERENCES partidos(id_partido),
    CONSTRAINT CK_tarjetas_tipo CHECK (tipo IN ('amarilla','roja'))
);

-- Castigos tipo "3 partidos expulsado, jornadas 8,9,10"
CREATE TABLE sanciones (
    id_sancion          INT IDENTITY(1,1) PRIMARY KEY,
    id_tarjeta          INT NOT NULL,
    jornada_inicio      INT NOT NULL,
    jornada_fin         INT NOT NULL,
    partidos_sancion    INT NOT NULL,
    cumplida            BIT NOT NULL DEFAULT 0,
    CONSTRAINT FK_sanciones_tarjeta FOREIGN KEY (id_tarjeta) REFERENCES tarjetas(id_tarjeta)
);

-- Opcional: descuentos/bonos de puntos por disciplina u otras causas,
-- separado del calculo automatico de la tabla de posiciones.
CREATE TABLE ajustes_puntos (
    id_ajuste   INT IDENTITY(1,1) PRIMARY KEY,
    id_equipo   INT NOT NULL,
    puntos      INT NOT NULL,
    motivo      NVARCHAR(255) NOT NULL,
    fecha       DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    CONSTRAINT FK_ajustes_equipo FOREIGN KEY (id_equipo) REFERENCES equipos(id_equipo)
);
GO

-- =========================================================
-- Vista: tabla de posiciones (calculada, no almacenada)
-- =========================================================
CREATE VIEW vw_tabla_posiciones AS
WITH resultados AS (
    SELECT id_equipo_local AS id_equipo,
           CASE WHEN goles_local > goles_visitante THEN 1 ELSE 0 END AS ganado,
           CASE WHEN goles_local = goles_visitante THEN 1 ELSE 0 END AS empatado,
           CASE WHEN goles_local < goles_visitante THEN 1 ELSE 0 END AS perdido,
           goles_local AS goles_favor,
           goles_visitante AS goles_contra
    FROM partidos
    WHERE estado = 'jugado'
    UNION ALL
    SELECT id_equipo_visitante,
           CASE WHEN goles_visitante > goles_local THEN 1 ELSE 0 END,
           CASE WHEN goles_visitante = goles_local THEN 1 ELSE 0 END,
           CASE WHEN goles_visitante < goles_local THEN 1 ELSE 0 END,
           goles_visitante,
           goles_local
    FROM partidos
    WHERE estado = 'jugado'
),
agregado AS (
    SELECT id_equipo,
           COUNT(*) AS juegos_jugados,
           SUM(ganado) AS juegos_ganados,
           SUM(empatado) AS juegos_empatados,
           SUM(perdido) AS juegos_perdidos,
           SUM(goles_favor) AS goles_favor,
           SUM(goles_contra) AS goles_contra
    FROM resultados
    GROUP BY id_equipo
)
SELECT
    e.id_equipo,
    e.nombre,
    ISNULL(a.juegos_jugados, 0) AS juegos_jugados,
    (SELECT COUNT(*) FROM partidos p
       WHERE p.estado <> 'jugado'
         AND (p.id_equipo_local = e.id_equipo OR p.id_equipo_visitante = e.id_equipo)) AS juegos_pendientes,
    ISNULL(a.juegos_ganados, 0) AS juegos_ganados,
    ISNULL(a.juegos_empatados, 0) AS juegos_empatados,
    ISNULL(a.juegos_perdidos, 0) AS juegos_perdidos,
    ISNULL(a.goles_favor, 0) AS goles_favor,
    ISNULL(a.goles_contra, 0) AS goles_contra,
    ISNULL(a.goles_favor, 0) - ISNULL(a.goles_contra, 0) AS diferencia_goles,
    ISNULL(a.juegos_ganados, 0) * 3 + ISNULL(a.juegos_empatados, 0)
        + ISNULL((SELECT SUM(puntos) FROM ajustes_puntos ap WHERE ap.id_equipo = e.id_equipo), 0) AS numero_puntos_acumulados
FROM equipos e
LEFT JOIN agregado a ON a.id_equipo = e.id_equipo;
GO
