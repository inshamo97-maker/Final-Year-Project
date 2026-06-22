--
-- PostgreSQL database dump
--

\restrict Zw2gxgzFTZuzyp13x5w5ofME6pOatGrEfLUl9O11WlYDDYuO8fWeHucFjnEyqmU

-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

-- Started on 2026-06-22 17:55:19

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 3 (class 3079 OID 33502)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5309 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 2 (class 3079 OID 16694)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5310 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 253 (class 1259 OID 16706)
-- Name: ai_alerts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_alerts (
    id integer NOT NULL,
    event_id uuid NOT NULL,
    type text NOT NULL,
    confidence double precision DEFAULT 0,
    "timestamp" timestamp with time zone NOT NULL,
    hall_id integer NOT NULL,
    exam_id text,
    student_id integer,
    violation_id integer,
    alert_id integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL
);


ALTER TABLE public.ai_alerts OWNER TO postgres;

--
-- TOC entry 252 (class 1259 OID 16705)
-- Name: ai_alerts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ai_alerts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_alerts_id_seq OWNER TO postgres;

--
-- TOC entry 5311 (class 0 OID 0)
-- Dependencies: 252
-- Name: ai_alerts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ai_alerts_id_seq OWNED BY public.ai_alerts.id;


--
-- TOC entry 257 (class 1259 OID 42279)
-- Name: alert_evidence; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alert_evidence (
    id integer NOT NULL,
    event_id uuid,
    evidence_type character varying(50),
    file_path text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.alert_evidence OWNER TO postgres;

--
-- TOC entry 256 (class 1259 OID 42278)
-- Name: alert_evidence_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.alert_evidence_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alert_evidence_id_seq OWNER TO postgres;

--
-- TOC entry 5312 (class 0 OID 0)
-- Dependencies: 256
-- Name: alert_evidence_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.alert_evidence_id_seq OWNED BY public.alert_evidence.id;


--
-- TOC entry 242 (class 1259 OID 16552)
-- Name: alerts_old; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alerts_old (
    id integer CONSTRAINT alerts_id_not_null NOT NULL,
    violation_id integer,
    sent_to text,
    severity text,
    status text,
    "timestamp" timestamp without time zone
);


ALTER TABLE public.alerts_old OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 16551)
-- Name: alerts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.alerts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alerts_id_seq OWNER TO postgres;

--
-- TOC entry 5313 (class 0 OID 0)
-- Dependencies: 241
-- Name: alerts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.alerts_id_seq OWNED BY public.alerts_old.id;


--
-- TOC entry 236 (class 1259 OID 16487)
-- Name: attendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance (
    id integer NOT NULL,
    student_id integer,
    verification_method text,
    date date,
    time_in timestamp without time zone,
    time_out timestamp without time zone,
    status text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    confidence double precision DEFAULT 0,
    exam_id text,
    hall_id integer
);


ALTER TABLE public.attendance OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 16486)
-- Name: attendance_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.attendance_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attendance_id_seq OWNER TO postgres;

--
-- TOC entry 5314 (class 0 OID 0)
-- Dependencies: 235
-- Name: attendance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.attendance_id_seq OWNED BY public.attendance.id;


--
-- TOC entry 244 (class 1259 OID 16567)
-- Name: audio_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audio_logs (
    id integer NOT NULL,
    mic_id integer,
    hall_id integer,
    audio_path text,
    detected_text text,
    confidence numeric,
    "timestamp" timestamp without time zone
);


ALTER TABLE public.audio_logs OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 16566)
-- Name: audio_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.audio_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audio_logs_id_seq OWNER TO postgres;

--
-- TOC entry 5315 (class 0 OID 0)
-- Dependencies: 243
-- Name: audio_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.audio_logs_id_seq OWNED BY public.audio_logs.id;


--
-- TOC entry 230 (class 1259 OID 16437)
-- Name: cameras; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cameras (
    id integer NOT NULL,
    "position" text,
    is_active boolean,
    ip_address text,
    model text,
    hall_id integer
);


ALTER TABLE public.cameras OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16436)
-- Name: cameras_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cameras_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cameras_id_seq OWNER TO postgres;

--
-- TOC entry 5316 (class 0 OID 0)
-- Dependencies: 229
-- Name: cameras_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cameras_id_seq OWNED BY public.cameras.id;


--
-- TOC entry 226 (class 1259 OID 16412)
-- Name: exam_halls; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exam_halls (
    id integer NOT NULL,
    hall_number text,
    floor_number integer,
    capacity integer,
    location text,
    status text,
    technician_id integer
);


ALTER TABLE public.exam_halls OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16411)
-- Name: exam_halls_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.exam_halls_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.exam_halls_id_seq OWNER TO postgres;

--
-- TOC entry 5317 (class 0 OID 0)
-- Dependencies: 225
-- Name: exam_halls_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.exam_halls_id_seq OWNED BY public.exam_halls.id;


--
-- TOC entry 251 (class 1259 OID 16674)
-- Name: exams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exams (
    id integer NOT NULL,
    name text NOT NULL,
    subject text,
    date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    status text DEFAULT 'scheduled'::text,
    hall_id integer,
    program_name text,
    class_level text
);


ALTER TABLE public.exams OWNER TO postgres;

--
-- TOC entry 250 (class 1259 OID 16673)
-- Name: exams_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.exams_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.exams_id_seq OWNER TO postgres;

--
-- TOC entry 5318 (class 0 OID 0)
-- Dependencies: 250
-- Name: exams_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.exams_id_seq OWNED BY public.exams.id;


--
-- TOC entry 248 (class 1259 OID 16602)
-- Name: hardware_maintenance_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hardware_maintenance_logs (
    id integer NOT NULL,
    status text,
    date date,
    description text,
    speaker_id integer,
    technician_id integer,
    camera_id integer,
    microphone_id integer
);


ALTER TABLE public.hardware_maintenance_logs OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 16601)
-- Name: hardware_maintenance_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hardware_maintenance_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hardware_maintenance_logs_id_seq OWNER TO postgres;

--
-- TOC entry 5319 (class 0 OID 0)
-- Dependencies: 247
-- Name: hardware_maintenance_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hardware_maintenance_logs_id_seq OWNED BY public.hardware_maintenance_logs.id;


--
-- TOC entry 249 (class 1259 OID 16656)
-- Name: invigilator_halls; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invigilator_halls (
    invigilator_id integer NOT NULL,
    hall_id integer NOT NULL
);


ALTER TABLE public.invigilator_halls OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 16452)
-- Name: microphones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.microphones (
    id integer NOT NULL,
    is_active boolean,
    range text,
    sensitivity text,
    hall_id integer,
    row_number integer,
    column_number integer,
    ip_address text
);


ALTER TABLE public.microphones OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 16451)
-- Name: microphones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.microphones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.microphones_id_seq OWNER TO postgres;

--
-- TOC entry 5320 (class 0 OID 0)
-- Dependencies: 231
-- Name: microphones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.microphones_id_seq OWNED BY public.microphones.id;


--
-- TOC entry 240 (class 1259 OID 16532)
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    violation_id integer,
    user_id integer,
    review_type text,
    status text,
    comments text
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 16531)
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reviews_id_seq OWNER TO postgres;

--
-- TOC entry 5321 (class 0 OID 0)
-- Dependencies: 239
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- TOC entry 234 (class 1259 OID 16467)
-- Name: seat_allocations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seat_allocations (
    id integer NOT NULL,
    hall_id integer NOT NULL,
    student_id integer NOT NULL,
    row_number integer NOT NULL,
    column_number integer NOT NULL,
    exam_id integer NOT NULL
);


ALTER TABLE public.seat_allocations OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 16466)
-- Name: seat_allocations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.seat_allocations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.seat_allocations_id_seq OWNER TO postgres;

--
-- TOC entry 5322 (class 0 OID 0)
-- Dependencies: 233
-- Name: seat_allocations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.seat_allocations_id_seq OWNED BY public.seat_allocations.id;


--
-- TOC entry 246 (class 1259 OID 16587)
-- Name: speakers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.speakers (
    id integer NOT NULL,
    label text,
    status text,
    ip_address text,
    volume_level integer,
    last_active_timestamp timestamp without time zone,
    hall_id integer
);


ALTER TABLE public.speakers OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 16586)
-- Name: speakers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.speakers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.speakers_id_seq OWNER TO postgres;

--
-- TOC entry 5323 (class 0 OID 0)
-- Dependencies: 245
-- Name: speakers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.speakers_id_seq OWNED BY public.speakers.id;


--
-- TOC entry 255 (class 1259 OID 16735)
-- Name: student_embeddings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_embeddings (
    id integer NOT NULL,
    student_id integer NOT NULL,
    embedding jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.student_embeddings OWNER TO postgres;

--
-- TOC entry 254 (class 1259 OID 16734)
-- Name: student_embeddings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.student_embeddings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.student_embeddings_id_seq OWNER TO postgres;

--
-- TOC entry 5324 (class 0 OID 0)
-- Dependencies: 254
-- Name: student_embeddings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.student_embeddings_id_seq OWNED BY public.student_embeddings.id;


--
-- TOC entry 228 (class 1259 OID 16427)
-- Name: students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.students (
    id integer NOT NULL,
    name text,
    gender text,
    registration_number text,
    class_level integer,
    program_name text,
    hall_id integer,
    roll_number text,
    email text
);


ALTER TABLE public.students OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16426)
-- Name: students_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.students_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.students_id_seq OWNER TO postgres;

--
-- TOC entry 5325 (class 0 OID 0)
-- Dependencies: 227
-- Name: students_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.students_id_seq OWNED BY public.students.id;


--
-- TOC entry 224 (class 1259 OID 16402)
-- Name: support_technicians; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.support_technicians (
    id integer NOT NULL,
    name text,
    contact text,
    assigned_hall text
);


ALTER TABLE public.support_technicians OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16401)
-- Name: support_technicians_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.support_technicians_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.support_technicians_id_seq OWNER TO postgres;

--
-- TOC entry 5326 (class 0 OID 0)
-- Dependencies: 223
-- Name: support_technicians_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.support_technicians_id_seq OWNED BY public.support_technicians.id;


--
-- TOC entry 222 (class 1259 OID 16390)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name text NOT NULL,
    email text,
    phone_number text,
    department text,
    password text,
    last_login timestamp without time zone,
    is_admin boolean DEFAULT false NOT NULL,
    hall_id integer
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16389)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 5327 (class 0 OID 0)
-- Dependencies: 221
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 238 (class 1259 OID 16502)
-- Name: violations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.violations (
    id integer NOT NULL,
    "timestamp" timestamp without time zone,
    evidence_path text,
    type text,
    status text,
    confidence numeric,
    camera_id integer,
    hall_id integer,
    student_id integer,
    mic_id integer,
    exam_id text,
    severity character varying(20),
    event_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.violations OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 16501)
-- Name: violations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.violations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.violations_id_seq OWNER TO postgres;

--
-- TOC entry 5328 (class 0 OID 0)
-- Dependencies: 237
-- Name: violations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.violations_id_seq OWNED BY public.violations.id;


--
-- TOC entry 5014 (class 2604 OID 16709)
-- Name: ai_alerts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_alerts ALTER COLUMN id SET DEFAULT nextval('public.ai_alerts_id_seq'::regclass);


--
-- TOC entry 5021 (class 2604 OID 42282)
-- Name: alert_evidence id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert_evidence ALTER COLUMN id SET DEFAULT nextval('public.alert_evidence_id_seq'::regclass);


--
-- TOC entry 5008 (class 2604 OID 16555)
-- Name: alerts_old id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts_old ALTER COLUMN id SET DEFAULT nextval('public.alerts_id_seq'::regclass);


--
-- TOC entry 5002 (class 2604 OID 16490)
-- Name: attendance id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance ALTER COLUMN id SET DEFAULT nextval('public.attendance_id_seq'::regclass);


--
-- TOC entry 5009 (class 2604 OID 16570)
-- Name: audio_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audio_logs ALTER COLUMN id SET DEFAULT nextval('public.audio_logs_id_seq'::regclass);


--
-- TOC entry 4999 (class 2604 OID 16440)
-- Name: cameras id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cameras ALTER COLUMN id SET DEFAULT nextval('public.cameras_id_seq'::regclass);


--
-- TOC entry 4997 (class 2604 OID 16415)
-- Name: exam_halls id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_halls ALTER COLUMN id SET DEFAULT nextval('public.exam_halls_id_seq'::regclass);


--
-- TOC entry 5012 (class 2604 OID 16677)
-- Name: exams id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exams ALTER COLUMN id SET DEFAULT nextval('public.exams_id_seq'::regclass);


--
-- TOC entry 5011 (class 2604 OID 16605)
-- Name: hardware_maintenance_logs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hardware_maintenance_logs ALTER COLUMN id SET DEFAULT nextval('public.hardware_maintenance_logs_id_seq'::regclass);


--
-- TOC entry 5000 (class 2604 OID 16455)
-- Name: microphones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.microphones ALTER COLUMN id SET DEFAULT nextval('public.microphones_id_seq'::regclass);


--
-- TOC entry 5007 (class 2604 OID 16535)
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- TOC entry 5001 (class 2604 OID 16470)
-- Name: seat_allocations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seat_allocations ALTER COLUMN id SET DEFAULT nextval('public.seat_allocations_id_seq'::regclass);


--
-- TOC entry 5010 (class 2604 OID 16590)
-- Name: speakers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.speakers ALTER COLUMN id SET DEFAULT nextval('public.speakers_id_seq'::regclass);


--
-- TOC entry 5018 (class 2604 OID 16738)
-- Name: student_embeddings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_embeddings ALTER COLUMN id SET DEFAULT nextval('public.student_embeddings_id_seq'::regclass);


--
-- TOC entry 4998 (class 2604 OID 16430)
-- Name: students id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students ALTER COLUMN id SET DEFAULT nextval('public.students_id_seq'::regclass);


--
-- TOC entry 4996 (class 2604 OID 16405)
-- Name: support_technicians id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_technicians ALTER COLUMN id SET DEFAULT nextval('public.support_technicians_id_seq'::regclass);


--
-- TOC entry 4994 (class 2604 OID 16393)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5005 (class 2604 OID 16505)
-- Name: violations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violations ALTER COLUMN id SET DEFAULT nextval('public.violations_id_seq'::regclass);


--
-- TOC entry 5299 (class 0 OID 16706)
-- Dependencies: 253
-- Data for Name: ai_alerts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_alerts (id, event_id, type, confidence, "timestamp", hall_id, exam_id, student_id, violation_id, alert_id, created_at, status) FROM stdin;
5	7136f6f7-f0d1-443f-8c7a-d22be477db69	head_movement	0.6830860701724568	2026-06-20 11:24:28.15766+05	1	1	1	1	\N	2026-06-20 11:24:28.15766+05	confirmed
6	aa07ff04-0577-40b1-b3b0-dacfc4e58b11	whisper_detected	0.8	2026-06-20 11:24:52.706633+05	1	1	2	2	\N	2026-06-20 11:24:52.706633+05	confirmed
7	6a9ec5e6-9b27-45e9-b16f-57fd11d727f4	whisper_detected	0.8	2026-06-20 11:24:52.706633+05	1	1	1	3	\N	2026-06-20 11:24:52.706633+05	confirmed
4	d3cb4064-a4ab-4412-b4b8-6c7f816ef6e1	head_movement	0.40573800575104824	2026-06-20 11:24:23.057038+05	1	1	1	4	\N	2026-06-20 11:24:23.057038+05	confirmed
1	df733545-6861-45f9-a2bf-6a9e91b4a7d9	whisper_detected	0.8	2026-06-20 11:24:13.89076+05	1	1	2	\N	\N	2026-06-20 11:24:13.89076+05	dismissed
2	b4556559-ad6e-4450-beb7-17c99dbb0ea7	whisper_detected	0.8	2026-06-20 11:24:13.89076+05	1	1	1	\N	\N	2026-06-20 11:24:13.89076+05	dismissed
3	94142f8d-8e84-4022-8126-73f790a5b888	head_movement	0.4349385500084628	2026-06-20 11:24:20.040662+05	1	1	1	\N	\N	2026-06-20 11:24:20.040662+05	dismissed
11	e3f46d54-5c09-4366-999f-5bcb240b85d1	whisper_detected	0.8	2026-06-20 11:26:15.36009+05	1	1	1	\N	\N	2026-06-20 11:26:15.36009+05	dismissed
10	2b8e57c8-c7e3-47bb-b9ac-707cca322671	whisper_detected	0.8	2026-06-20 11:26:15.36009+05	1	1	2	\N	\N	2026-06-20 11:26:15.36009+05	dismissed
8	5e38b238-e939-4b3d-988c-7a43b28b604e	whisper_detected	0.8	2026-06-20 11:25:31.360543+05	1	1	2	\N	\N	2026-06-20 11:25:31.360543+05	dismissed
9	a2527e8f-3f70-4586-a47b-ce2f6c87f164	whisper_detected	0.8	2026-06-20 11:25:31.360543+05	1	1	1	\N	\N	2026-06-20 11:25:31.360543+05	dismissed
12	fb79b3b5-7de9-4664-bbf2-030f0ce6806a	whisper_detected	0.8	2026-06-20 11:26:58.178183+05	1	1	2	\N	\N	2026-06-20 11:26:58.178183+05	pending
13	96e328b2-6212-4732-b0ee-16d64c55a068	whisper_detected	0.8	2026-06-20 11:26:58.178183+05	1	1	1	\N	\N	2026-06-20 11:26:58.178183+05	pending
14	5dcc0cb9-6550-4bb0-8f16-4e7c4dc8cb1a	whisper_detected	0.8	2026-06-20 11:27:33.80107+05	1	1	2	\N	\N	2026-06-20 11:27:33.80107+05	pending
15	b6709feb-3921-47eb-9c8c-562a3531f4f9	whisper_detected	0.8	2026-06-20 11:27:33.80107+05	1	1	1	\N	\N	2026-06-20 11:27:33.80107+05	pending
16	41b8123d-8ded-4413-b984-7f5301e57cca	whisper_detected	0.8	2026-06-20 11:28:21.221603+05	1	1	2	\N	\N	2026-06-20 11:28:21.221603+05	pending
17	d315bd9f-3a37-43ba-b73e-a9161a269820	whisper_detected	0.8	2026-06-20 11:28:21.221603+05	1	1	1	\N	\N	2026-06-20 11:28:21.221603+05	pending
18	a7b391f4-65e2-4f0c-bba1-b6928c348b78	whisper_detected	0.8	2026-06-20 11:29:01.730318+05	1	1	2	\N	\N	2026-06-20 11:29:01.730318+05	pending
19	7589b4c1-7aa3-4168-95a9-5717e2d218f2	whisper_detected	0.8	2026-06-20 11:29:01.730318+05	1	1	1	\N	\N	2026-06-20 11:29:01.730318+05	pending
49	0cbb1fe5-73c3-4869-97e7-aba818fd1b42	unknown_face	0.298	2026-06-20 12:25:10.260009+05	1	2	\N	\N	\N	2026-06-20 12:25:10.260009+05	pending
50	7142fa36-83b9-42f2-adcd-ba776ddbcd56	seating_ok	1	2026-06-20 12:25:10.385763+05	1	2	2	\N	\N	2026-06-20 12:25:10.385763+05	pending
51	03d2d679-4f18-435a-bd2d-9e00a70e65ac	absent	1	2026-06-20 12:25:10.385763+05	1	2	1	\N	\N	2026-06-20 12:25:10.385763+05	pending
52	9be5d671-52e6-41d8-b9b4-e69f3ab0c7e2	whisper_detected	0.8	2026-06-20 12:25:13.692112+05	1	2	1	\N	\N	2026-06-20 12:25:13.692112+05	pending
53	4b0ab819-ea57-42c8-aca7-23562f59fa7d	whisper_detected	0.8	2026-06-20 12:25:13.692112+05	1	2	2	\N	\N	2026-06-20 12:25:13.692112+05	pending
54	d5ee7d45-aca5-41ad-87fd-48171d9b7b69	head_movement	0.591768422794307	2026-06-20 12:25:35.890331+05	1	2	1	\N	\N	2026-06-20 12:25:35.890331+05	pending
55	ed1552e8-e3dd-4603-9a0d-b500afd3edbb	head_movement	0.5261760147779638	2026-06-20 12:25:38.927793+05	1	2	1	\N	\N	2026-06-20 12:25:38.927793+05	pending
56	13c684b2-2d61-4a75-963c-e9d6416dfe94	head_movement	0.47356917726222136	2026-06-20 12:25:41.993127+05	1	2	1	\N	\N	2026-06-20 12:25:41.993127+05	pending
57	9b59f93a-a123-449c-a425-492b81fd279b	head_movement	0.4606461498268472	2026-06-20 12:25:45.009076+05	1	2	1	\N	\N	2026-06-20 12:25:45.009076+05	pending
58	33038d2b-bc23-4b84-a732-565a863bb7b8	head_movement	0.5461270217069634	2026-06-20 12:26:05.474415+05	1	2	1	\N	\N	2026-06-20 12:26:05.474415+05	pending
59	4ce146a8-9897-4bc0-83b4-1e34235c2ca2	head_movement	0.5574251927833023	2026-06-20 12:26:08.487895+05	1	2	1	\N	\N	2026-06-20 12:26:08.487895+05	pending
60	ce8a88d1-0267-4a33-b2af-370059da4a27	whisper_detected	0.8	2026-06-20 12:26:30.880229+05	1	2	1	\N	\N	2026-06-20 12:26:30.880229+05	pending
61	7c3f807d-c43b-4614-acdb-c2f35d58d0c9	whisper_detected	0.8	2026-06-20 12:26:30.880229+05	1	2	2	\N	\N	2026-06-20 12:26:30.880229+05	pending
62	a2a70fdd-a125-4c1e-954b-9a1f28eda221	head_movement	0.4147875807712436	2026-06-20 12:27:02.286091+05	1	2	2	\N	\N	2026-06-20 12:27:02.286091+05	pending
63	195f5ffc-ba9d-45ca-97ca-7c56a8332296	head_movement	0.4440291416264472	2026-06-20 12:27:24.59678+05	1	2	2	\N	\N	2026-06-20 12:27:24.59678+05	pending
64	ba0fa8f9-f546-4389-a3a7-e4400b0e8ee4	whisper_detected	0.8	2026-06-20 12:27:40.889485+05	1	2	1	\N	\N	2026-06-20 12:27:40.889485+05	pending
65	cb7bf686-69dc-4166-bb04-a344d68766ae	whisper_detected	0.8	2026-06-20 12:27:40.889485+05	1	2	2	\N	\N	2026-06-20 12:27:40.889485+05	pending
\.


--
-- TOC entry 5303 (class 0 OID 42279)
-- Dependencies: 257
-- Data for Name: alert_evidence; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alert_evidence (id, event_id, evidence_type, file_path, created_at) FROM stdin;
1	df733545-6861-45f9-a2bf-6a9e91b4a7d9	audio	evidence/audio_alerts\\whisper_mic_0_20260620_112413.wav	2026-06-20 11:24:09.554073
2	b4556559-ad6e-4450-beb7-17c99dbb0ea7	audio	evidence/audio_alerts\\whisper_mic_0_20260620_112413.wav	2026-06-20 11:24:09.554073
3	94142f8d-8e84-4022-8126-73f790a5b888	image	evidence/images/cheating\\cheat_1_1_20260620_112420.jpg	2026-06-20 11:24:17.850605
4	d3cb4064-a4ab-4412-b4b8-6c7f816ef6e1	image	evidence/images/cheating\\cheat_1_1_20260620_112423.jpg	2026-06-20 11:24:22.851638
5	7136f6f7-f0d1-443f-8c7a-d22be477db69	image	evidence/images/cheating\\cheat_1_1_20260620_112428.jpg	2026-06-20 11:24:27.853531
6	aa07ff04-0577-40b1-b3b0-dacfc4e58b11	audio	evidence/audio_alerts\\whisper_mic_0_20260620_112452.wav	2026-06-20 11:24:32.855139
7	6a9ec5e6-9b27-45e9-b16f-57fd11d727f4	audio	evidence/audio_alerts\\whisper_mic_0_20260620_112452.wav	2026-06-20 11:24:32.855139
8	5e38b238-e939-4b3d-988c-7a43b28b604e	audio	evidence/audio_alerts\\whisper_mic_0_20260620_112531.wav	2026-06-20 11:24:52.861155
9	a2527e8f-3f70-4586-a47b-ce2f6c87f164	audio	evidence/audio_alerts\\whisper_mic_0_20260620_112531.wav	2026-06-20 11:24:52.861155
10	2b8e57c8-c7e3-47bb-b9ac-707cca322671	audio	evidence/audio_alerts\\whisper_mic_0_20260620_112615.wav	2026-06-20 11:25:32.87227
11	e3f46d54-5c09-4366-999f-5bcb240b85d1	audio	evidence/audio_alerts\\whisper_mic_0_20260620_112615.wav	2026-06-20 11:25:32.87227
12	fb79b3b5-7de9-4664-bbf2-030f0ce6806a	audio	evidence/audio_alerts\\whisper_mic_0_20260620_112658.wav	2026-06-20 11:26:17.88951
13	96e328b2-6212-4732-b0ee-16d64c55a068	audio	evidence/audio_alerts\\whisper_mic_0_20260620_112658.wav	2026-06-20 11:26:17.88951
14	5dcc0cb9-6550-4bb0-8f16-4e7c4dc8cb1a	audio	evidence/audio_alerts\\whisper_mic_0_20260620_112733.wav	2026-06-20 11:27:02.904194
15	b6709feb-3921-47eb-9c8c-562a3531f4f9	audio	evidence/audio_alerts\\whisper_mic_0_20260620_112733.wav	2026-06-20 11:27:02.904194
16	41b8123d-8ded-4413-b984-7f5301e57cca	audio	evidence/audio_alerts\\whisper_mic_0_20260620_112821.wav	2026-06-20 11:27:37.91572
17	d315bd9f-3a37-43ba-b73e-a9161a269820	audio	evidence/audio_alerts\\whisper_mic_0_20260620_112821.wav	2026-06-20 11:27:37.91572
18	a7b391f4-65e2-4f0c-bba1-b6928c348b78	audio	evidence/audio_alerts\\whisper_mic_0_20260620_112901.wav	2026-06-20 11:28:22.930023
19	7589b4c1-7aa3-4168-95a9-5717e2d218f2	audio	evidence/audio_alerts\\whisper_mic_0_20260620_112901.wav	2026-06-20 11:28:22.930023
49	0cbb1fe5-73c3-4869-97e7-aba818fd1b42	image	evidence/images/unknown_faces\\unknown_unknown_2_20260620_122510.jpg	2026-06-20 12:25:03.007976
50	9be5d671-52e6-41d8-b9b4-e69f3ab0c7e2	audio	evidence/audio_alerts\\whisper_mic_0_20260620_122513.wav	2026-06-20 12:25:10.527996
51	4b0ab819-ea57-42c8-aca7-23562f59fa7d	audio	evidence/audio_alerts\\whisper_mic_0_20260620_122513.wav	2026-06-20 12:25:10.527996
52	d5ee7d45-aca5-41ad-87fd-48171d9b7b69	image	evidence/images/cheating\\cheat_1_2_20260620_122535.jpg	2026-06-20 12:25:18.01716
53	ed1552e8-e3dd-4603-9a0d-b500afd3edbb	image	evidence/images/cheating\\cheat_1_2_20260620_122538.jpg	2026-06-20 12:25:38.022186
54	13c684b2-2d61-4a75-963c-e9d6416dfe94	image	evidence/images/cheating\\cheat_1_2_20260620_122541.jpg	2026-06-20 12:25:42.001294
55	9b59f93a-a123-449c-a425-492b81fd279b	image	evidence/images/cheating\\cheat_1_2_20260620_122545.jpg	2026-06-20 12:25:43.02356
56	33038d2b-bc23-4b84-a732-565a863bb7b8	image	evidence/images/cheating\\cheat_1_2_20260620_122605.jpg	2026-06-20 12:25:48.024644
57	4ce146a8-9897-4bc0-83b4-1e34235c2ca2	image	evidence/images/cheating\\cheat_1_2_20260620_122608.jpg	2026-06-20 12:26:08.02984
58	ce8a88d1-0267-4a33-b2af-370059da4a27	audio	evidence/audio_alerts\\whisper_mic_0_20260620_122630.wav	2026-06-20 12:26:13.031151
59	7c3f807d-c43b-4614-acdb-c2f35d58d0c9	audio	evidence/audio_alerts\\whisper_mic_0_20260620_122630.wav	2026-06-20 12:26:13.031151
60	a2a70fdd-a125-4c1e-954b-9a1f28eda221	image	evidence/images/cheating\\cheat_2_2_20260620_122702.jpg	2026-06-20 12:26:33.037069
61	195f5ffc-ba9d-45ca-97ca-7c56a8332296	image	evidence/images/cheating\\cheat_2_2_20260620_122724.jpg	2026-06-20 12:27:03.044278
62	ba0fa8f9-f546-4389-a3a7-e4400b0e8ee4	audio	evidence/audio_alerts\\whisper_mic_0_20260620_122740.wav	2026-06-20 12:27:28.053135
63	cb7bf686-69dc-4166-bb04-a344d68766ae	audio	evidence/audio_alerts\\whisper_mic_0_20260620_122740.wav	2026-06-20 12:27:28.053135
\.


--
-- TOC entry 5288 (class 0 OID 16552)
-- Dependencies: 242
-- Data for Name: alerts_old; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alerts_old (id, violation_id, sent_to, severity, status, "timestamp") FROM stdin;
\.


--
-- TOC entry 5282 (class 0 OID 16487)
-- Dependencies: 236
-- Data for Name: attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendance (id, student_id, verification_method, date, time_in, time_out, status, created_at, confidence, exam_id, hall_id) FROM stdin;
1	2	face_recognition	2026-06-20	2026-06-20 12:25:10.260009	\N	present	2026-06-20 12:25:10.260009+05	0.527	2	1
2	1	\N	\N	\N	\N	absent	2026-06-20 12:25:10.387239+05	0	2	1
\.


--
-- TOC entry 5290 (class 0 OID 16567)
-- Dependencies: 244
-- Data for Name: audio_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.audio_logs (id, mic_id, hall_id, audio_path, detected_text, confidence, "timestamp") FROM stdin;
\.


--
-- TOC entry 5276 (class 0 OID 16437)
-- Dependencies: 230
-- Data for Name: cameras; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cameras (id, "position", is_active, ip_address, model, hall_id) FROM stdin;
1	front	t	0	logitech 270	1
\.


--
-- TOC entry 5272 (class 0 OID 16412)
-- Dependencies: 226
-- Data for Name: exam_halls; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exam_halls (id, hall_number, floor_number, capacity, location, status, technician_id) FROM stdin;
1	Hall A	1	20	Block B	open	\N
\.


--
-- TOC entry 5297 (class 0 OID 16674)
-- Dependencies: 251
-- Data for Name: exams; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exams (id, name, subject, date, start_time, end_time, status, hall_id, program_name, class_level) FROM stdin;
1	fyp test111	hb	2026-06-20	11:24:00	11:30:00	completed	1	FSC Pre-Engineering	12
2	exam 101	Computer Science	2026-06-20	12:25:00	12:30:00	running	1	FSC Pre-Engineering	12
\.


--
-- TOC entry 5294 (class 0 OID 16602)
-- Dependencies: 248
-- Data for Name: hardware_maintenance_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hardware_maintenance_logs (id, status, date, description, speaker_id, technician_id, camera_id, microphone_id) FROM stdin;
\.


--
-- TOC entry 5295 (class 0 OID 16656)
-- Dependencies: 249
-- Data for Name: invigilator_halls; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invigilator_halls (invigilator_id, hall_id) FROM stdin;
\.


--
-- TOC entry 5278 (class 0 OID 16452)
-- Dependencies: 232
-- Data for Name: microphones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.microphones (id, is_active, range, sensitivity, hall_id, row_number, column_number, ip_address) FROM stdin;
1	t	5m	Medium	1	1	1	0
\.


--
-- TOC entry 5286 (class 0 OID 16532)
-- Dependencies: 240
-- Data for Name: reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reviews (id, violation_id, user_id, review_type, status, comments) FROM stdin;
\.


--
-- TOC entry 5280 (class 0 OID 16467)
-- Dependencies: 234
-- Data for Name: seat_allocations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.seat_allocations (id, hall_id, student_id, row_number, column_number, exam_id) FROM stdin;
3	1	1	1	1	1
4	1	2	1	2	1
5	1	1	1	1	2
6	1	2	1	2	2
\.


--
-- TOC entry 5292 (class 0 OID 16587)
-- Dependencies: 246
-- Data for Name: speakers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.speakers (id, label, status, ip_address, volume_level, last_active_timestamp, hall_id) FROM stdin;
1	Speaker	inactive	5	100	\N	1
\.


--
-- TOC entry 5301 (class 0 OID 16735)
-- Dependencies: 255
-- Data for Name: student_embeddings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student_embeddings (id, student_id, embedding, created_at, updated_at) FROM stdin;
1	1	[0.46568796038627625, -0.7435010075569153, 0.22335070371627808, 1.1813678741455078, -2.111691474914551, 0.3491699993610382, 0.4657825827598572, -0.3622942268848419, -0.20012125372886658, -1.1261818408966064, 1.0151394605636597, -0.5991191864013672, -1.2671970129013062, 1.4887386560440063, 1.0078645944595337, -0.24390268325805664, 0.1183420941233635, -2.5482921600341797, -1.1549155712127686, -0.5108534097671509, -0.5392679572105408, 1.8793641328811646, -0.9379271864891052, 0.932325541973114, 0.27421844005584717, -1.3591327667236328, -1.4153642654418945, 1.334077000617981, 0.5193136930465698, 0.07281506061553955, -1.295135498046875, -0.17452497780323029, -2.7527081966400146, -0.3380129039287567, 1.1201103925704956, -0.48611652851104736, 0.20347440242767334, 0.37357139587402344, -1.3380118608474731, 1.380941390991211, 0.7199453115463257, 1.9196312427520752, 0.19762641191482544, 1.1893221139907837, -1.0281535387039185, 1.6749482154846191, -1.2120808362960815, 0.9454587697982788, 0.5233559012413025, 1.057611107826233, 1.0727771520614624, -0.14632615447044373, 0.8995635509490967, -0.5349774360656738, -1.150480031967163, 0.3857173025608063, 0.8074996471405029, 1.1379352807998657, 0.9894193410873413, -0.8778595328330994, 1.445385456085205, -0.03556789830327034, -2.4590892791748047, 0.6563655138015747, -0.3220154047012329, -0.4430769979953766, -0.8148694038391113, 0.7815864086151123, 0.6917113065719604, 0.02506434917449951, 0.5656634569168091, -0.1626395881175995, -0.3082630932331085, 1.2864515781402588, -0.9339951276779175, 0.7096837759017944, 0.8540903925895691, 0.7884178161621094, 3.093376398086548, 0.5928941965103149, 0.6404637694358826, -0.3463735580444336, 0.5393975973129272, -0.048827171325683594, -1.6167457103729248, 2.0324819087982178, 1.0281368494033813, 0.8157078623771667, 0.8645126819610596, -0.37165701389312744, -0.4120427966117859, 0.06887075304985046, -0.07096970081329346, -0.9981278777122498, -0.10020625591278076, 0.16764071583747864, -2.256298780441284, -0.1117909699678421, 0.7489206790924072, 0.4086047112941742, 0.8870607614517212, -0.6134119629859924, -0.8649582862854004, -1.3495514392852783, 2.3314285278320312, 0.6803960800170898, 0.6719829440116882, -1.729339361190796, -1.8171007633209229, -1.5170894861221313, -0.7792452573776245, -0.2268352061510086, 0.235565185546875, -0.24053502082824707, -1.1190768480300903, -1.9468011856079102, -2.1390976905822754, 2.2107226848602295, -0.06284475326538086, -1.6975984573364258, -1.0829932689666748, -0.12744805216789246, -0.15872880816459656, -0.17813779413700104, -1.2788500785827637, -1.779557704925537, 0.7492614984512329, -0.06235647201538086, -0.3503311574459076, -0.6044740080833435, -0.41008418798446655, 1.6088722944259644, -0.46757692098617554, -0.0638226866722107, 0.8702785968780518, -0.2739536762237549, 1.0671240091323853, 0.449734628200531, -1.2335636615753174, -0.9384273290634155, 2.7008471488952637, -0.2774079144001007, -2.535538673400879, -0.1270158737897873, 0.0422462522983551, -1.1582356691360474, -0.429542601108551, 1.1891762018203735, -0.2645966112613678, 2.2332653999328613, -1.2126859426498413, -1.0232303142547607, -0.16617996990680695, 0.15067386627197266, -0.4154786467552185, 1.9399175643920898, -0.23008441925048828, -1.7055082321166992, 1.9527263641357422, -0.36916208267211914, -0.40635693073272705, 0.08312374353408813, -0.3061050772666931, -1.0556448698043823, -2.2198450565338135, 0.7974780797958374, -0.9212184548377991, 0.33178049325942993, -0.7736297249794006, -0.09998881816864014, -0.6250121593475342, 1.5977095365524292, -0.07190187275409698, 0.7870473265647888, 0.9898296594619751, -1.1788475513458252, 1.3593961000442505, 1.3270204067230225, -0.6496825218200684, 1.5224816799163818, 0.19629248976707458, -0.28689074516296387, 0.5703405737876892, -2.5573108196258545, -1.8783607482910156, 0.38055312633514404, 0.22696396708488464, 0.8732504844665527, -0.9059430956840515, 2.2666661739349365, 0.8497345447540283, 0.35177257657051086, -0.6233518123626709, -1.5954337120056152, 1.212202548980713, -2.2820026874542236, 1.1387596130371094, -0.18664005398750305, 0.28814107179641724, -0.18410325050354004, -0.961643636226654, 2.1448967456817627, -0.7250769734382629, 0.5800610184669495, -0.386618971824646, 1.9910271167755127, 0.9807237982749939, -0.384158194065094, 0.22421100735664368, -0.04595354199409485, -0.26801377534866333, -0.09479725360870361, -1.5129320621490479, 0.7158647775650024, -0.1390504240989685, 0.9243552088737488, -0.9894226789474487, 0.45083728432655334, 0.8547884225845337, 2.6657180786132812, -0.9893931150436401, -1.3013355731964111, -0.8929879069328308, -0.5880251526832581, -2.170224666595459, -0.7945661544799805, 0.001826256513595581, 0.34178078174591064, 0.13643503189086914, -0.8878072500228882, 0.1932218074798584, -1.2341231107711792, -0.2360040247440338, 0.5073558688163757, 0.089989572763443, 1.0126802921295166, -1.1636481285095215, 2.48225474357605, 1.5802738666534424, 1.0125699043273926, 1.122937798500061, -2.3152518272399902, 0.1257609724998474, -1.6552410125732422, -0.9427115321159363, -0.060746170580387115, 0.3919389247894287, 0.23034638166427612, -0.011221319437026978, -0.5299287438392639, 0.6078513264656067, -0.4892705976963043, 0.02542710304260254, 1.180290937423706, 0.37748298048973083, 1.1354321241378784, -2.372117757797241, -1.3681106567382812, 0.20147624611854553, -0.07293212413787842, -2.078916549682617, 1.4423067569732666, -0.8131385445594788, 1.4155242443084717, -0.5885539650917053, -0.501953125, -2.3364510536193848, -0.3257560729980469, -0.5335692763328552, 3.0075185298919678, -0.3109472990036011, 0.03503210097551346, 0.15652406215667725, -0.023372381925582886, -0.7917590141296387, -0.2184371054172516, 0.042756080627441406, -0.00691533088684082, 0.6438783407211304, -2.1668694019317627, 0.5111051201820374, -0.5665547847747803, -0.4003331661224365, -1.0607980489730835, -1.273238182067871, 2.0196378231048584, 0.9584290981292725, -0.8730900883674622, 0.5722240209579468, 2.9696927070617676, 0.07897752523422241, -1.6971657276153564, -1.65778648853302, 1.7532577514648438, 0.7247082591056824, 1.8447445631027222, -0.24936997890472412, 0.5963590145111084, 1.0457851886749268, 0.9258430004119873, 0.7412015199661255, -1.1358367204666138, -1.0958939790725708, -1.012451410293579, 1.0599939823150635, 2.9416489601135254, -2.526214838027954, 0.38160499930381775, 0.0678333044052124, 0.3847281336784363, -1.396528959274292, 1.1562248468399048, 0.88047194480896, 0.5723833441734314, -0.6612159013748169, -0.34464991092681885, -0.09990543127059937, -1.2461403608322144, -0.35485124588012695, -0.09801018238067627, 1.1554629802703857, -0.7790676951408386, -1.093254566192627, -0.7284488677978516, 0.3874015808105469, -1.717794418334961, 1.1333093643188477, 0.6798637509346008, -2.121443271636963, 0.5618810057640076, 1.487687349319458, -1.8637592792510986, 0.028731822967529297, -0.2610095143318176, 0.8053815364837646, -0.17067833244800568, -0.6368557810783386, 0.08181454241275787, 1.2369921207427979, 0.023819297552108765, -0.2810380458831787, -0.14750930666923523, 1.5245658159255981, -0.3042379319667816, 1.4082889556884766, -1.3314547538757324, -2.2309410572052, 2.547520637512207, -0.0746222734451294, -0.09885889291763306, 0.46293842792510986, 1.4678065776824951, 1.64306640625, -1.5696120262145996, 1.406451940536499, 1.3019884824752808, -0.812340259552002, -1.403700351715088, 1.5354621410369873, 0.7903727889060974, 0.4225926399230957, -1.5579825639724731, 0.6763907670974731, -0.5817573070526123, -1.0646898746490479, -1.307591199874878, 0.2909139394760132, -0.2675677537918091, -0.27532321214675903, 0.294064462184906, -0.2582361698150635, 0.3209700584411621, -1.207964301109314, 1.0438344478607178, 1.6411329507827759, -0.3202822804450989, -1.4878432750701904, -0.7380131483078003, 1.2476269006729126, 1.0439356565475464, -1.523335576057434, -1.196500301361084, -0.30891045928001404, 1.911318302154541, -2.0690464973449707, -0.1452510952949524, -1.6155041456222534, 2.1373088359832764, 0.8151870965957642, -1.184523344039917, 1.176607608795166, -0.7579580545425415, 0.05690313130617142, 0.4502517580986023, 2.270357608795166, 0.1999751627445221, -1.9917091131210327, 0.5576887130737305, -1.0557537078857422, 1.7788257598876953, -2.3897557258605957, 0.08734011650085449, 1.2906053066253662, 1.598384141921997, -1.946614146232605, 0.5913830995559692, -0.34010791778564453, 1.3101047277450562, 1.0738307237625122, 0.7338033318519592, 0.34939372539520264, 1.2466249465942383, 0.7817537784576416, 0.4968456029891968, 0.36350512504577637, -1.0450822114944458, 2.266848087310791, 1.5523631572723389, -2.258056879043579, 1.1619296073913574, 0.5811136364936829, 1.1910892724990845, 0.22334176301956177, 0.1653485894203186, 0.24100297689437866, 1.8821704387664795, 0.014255821704864502, -0.2784450948238373, 1.348320722579956, -1.4693562984466553, -1.1031172275543213, -0.07518328726291656, 0.8137422800064087, 0.6359909772872925, 0.7438831925392151, 1.1854935884475708, 1.2562309503555298, 0.1838195025920868, 1.2064456939697266, 0.3193652629852295, -0.8876625299453735, -1.857328176498413, 0.6580861806869507, -0.9803035259246826, 1.4361904859542847, -2.0081348419189453, -0.9878955483436584, -0.481770396232605, -0.374068945646286, -1.2222542762756348, 1.7502198219299316, 0.8460274934768677, 1.4850504398345947, 0.472350150346756, 0.6699421405792236, 0.4534916877746582, 0.03906702995300293, 0.015562951564788818, -0.4356805086135864, -1.3098187446594238, -0.05529087781906128, -1.139469861984253, -0.90546715259552, -1.8719980716705322, -1.8759015798568726, 0.4809499979019165, -0.2781974673271179, 0.4033902883529663, 0.8694889545440674, 0.7397947907447815, 2.052556037902832, -0.748721718788147, -1.345862627029419, -0.47681769728660583, 1.521554946899414, -0.39794549345970154, -0.12443023920059204, 0.41483527421951294, 0.2894212603569031, 1.2253572940826416, -1.6865403652191162, -0.7616090178489685, 2.3142330646514893, 0.33414483070373535, -0.23857760429382324, 0.498030424118042, -1.3537211418151855, 1.053394079208374, 0.45692551136016846, 0.03405404090881348, -1.7914358377456665, -0.4519590437412262, 1.8176476955413818, -0.6898506879806519, 0.6284364461898804, -0.5116111040115356, -1.3605155944824219, -0.9588178396224976, -1.4271669387817383, 1.369816780090332, 1.841998815536499, -0.49568724632263184, -2.6259608268737793, -0.6533775329589844, 0.9135534763336182, -0.4884391129016876, -1.2065403461456299, 0.6359872817993164, 0.3737606704235077, -0.3050385117530823, 0.028176695108413696, 0.9909276366233826]	2026-06-20 11:19:15.570019+05	2026-06-20 11:19:40.545539+05
2	2	[-0.045652203261852264, -1.8607590198516846, 0.3251999616622925, 0.2513520419597626, 0.25074025988578796, -0.8504074811935425, -2.4281930923461914, 0.2454288899898529, 1.276117205619812, -0.003310859203338623, 0.7325190305709839, 0.012097254395484924, 0.1225966215133667, -1.5726227760314941, -0.9589743614196777, -0.06739531457424164, -0.02251943200826645, -1.4888043403625488, 0.6893420219421387, -0.09745007753372192, -0.8217843174934387, 1.1776081323623657, -1.0889666080474854, 1.826709508895874, -1.8718805313110352, 0.11923176050186157, -1.5534965991973877, -0.7975866794586182, -0.7965485453605652, -1.1726841926574707, -2.036550998687744, 0.41595518589019775, -0.10104489326477051, 0.2591717541217804, -0.9470378160476685, -0.41223806142807007, -0.33324044942855835, -1.2804441452026367, -1.1907713413238525, -1.703182578086853, -1.2054040431976318, 0.1428316980600357, 0.42454826831817627, -1.8420988321304321, 1.0424838066101074, 1.3756029605865479, 1.2081799507141113, 1.488486886024475, 0.41357412934303284, 0.7461267709732056, 1.7018520832061768, 0.5840080976486206, 1.609317660331726, 2.3943190574645996, 0.8559259176254272, 0.9246861934661865, -0.8273836374282837, -0.8735796213150024, 0.36805689334869385, -1.012542724609375, -0.1087523102760315, 0.32429444789886475, 0.8031166791915894, -0.44660693407058716, -0.7910726070404053, -0.12165999412536621, 1.968421220779419, 0.694494366645813, 1.9144141674041748, 0.6849046349525452, 0.2187904715538025, -0.1737266331911087, 2.2604753971099854, -0.43532824516296387, -2.193833827972412, -0.23699957132339478, 0.6985312104225159, 0.20091167092323303, 0.8704074025154114, 0.5269336700439453, 0.17284134030342102, -0.5738104581832886, 0.10970143973827362, 0.6605397462844849, 1.9636759757995605, -1.1668846607208252, -0.4264843463897705, -1.1793169975280762, -0.21411487460136414, -0.742016613483429, -1.1210492849349976, -0.5587986707687378, 1.3777719736099243, 1.2720574140548706, -0.2915061414241791, 0.770765483379364, -1.535707950592041, -1.3637316226959229, 0.85465008020401, -0.6937506198883057, 0.7858617305755615, -0.43256038427352905, -0.6398369073867798, 0.7312354445457458, 1.1197326183319092, 0.20088770985603333, 1.0066239833831787, -1.115811824798584, -0.9318606853485107, 0.1187603771686554, -1.704519271850586, 0.5813571214675903, 1.468511700630188, 0.5623972415924072, 0.5418129563331604, -1.1431331634521484, -0.6696826219558716, 1.9309732913970947, -0.00525212287902832, 2.259483814239502, -0.39203354716300964, 1.0506843328475952, 1.1736050844192505, -0.21535758674144745, 0.41592317819595337, 1.206386923789978, -1.3501087427139282, 1.710071086883545, 1.781761646270752, 0.9493547081947327, 1.055734395980835, -0.5274590253829956, 0.6325125694274902, 1.7580565214157104, 2.5395374298095703, -0.18993934988975525, 2.022949695587158, -1.0328991413116455, 1.4649603366851807, 0.7378969192504883, -1.3018909692764282, -0.15096823871135712, 0.8224247097969055, -1.1491730213165283, -0.5529916286468506, -0.4186028242111206, 1.0785647630691528, 0.0937597006559372, 1.9523086547851562, -0.76229327917099, -0.8202884197235107, 0.17693579196929932, -0.18083155155181885, -1.2994128465652466, -2.4401144981384277, -1.2200891971588135, 0.12651246786117554, 0.7807620763778687, -0.23560504615306854, 0.2691637873649597, 0.33208656311035156, 0.7135122418403625, 0.4146968126296997, -0.7817240357398987, -0.3362733721733093, -0.2648826837539673, 0.5215470194816589, -1.2096928358078003, -0.7548383474349976, 0.09806889295578003, -1.8141980171203613, 0.5437840223312378, -0.7465442419052124, 0.4225883483886719, 0.8262284994125366, -0.28496524691581726, 0.27330705523490906, -0.1838352531194687, -0.010616034269332886, 2.209290027618408, -0.23426631093025208, 0.43789464235305786, -1.1011760234832764, 0.46440282464027405, 0.2624730169773102, 0.6443878412246704, 0.2698015868663788, 1.7728722095489502, 1.0340819358825684, 0.498321533203125, 1.364692211151123, 1.0805083513259888, 1.3676552772521973, -0.21444982290267944, 1.877339482307434, 0.13381695747375488, 0.19872134923934937, -0.3610975742340088, -0.919922411441803, -1.2734907865524292, -1.1434471607208252, -0.7679415941238403, -0.7353010177612305, 0.06119567155838013, 0.11786752939224243, -0.10092005133628845, -0.4330577850341797, -0.7258481383323669, 0.32116198539733887, 0.1662268340587616, 0.5749162435531616, 1.2233095169067383, 0.20101085305213928, 0.17788538336753845, 1.4961612224578857, 0.208041250705719, 0.15340489149093628, -0.6303761601448059, 1.1514031887054443, 0.718999445438385, -0.21948939561843872, -0.8081582188606262, 0.5465680360794067, 0.4129394292831421, -1.0523309707641602, -0.22772467136383057, -1.7430198192596436, -0.9930770993232727, 0.04238688945770264, 0.702608585357666, -0.7657763957977295, 0.13546717166900635, 1.9548252820968628, 1.1845002174377441, 0.03456425666809082, -0.9150896668434143, -1.7732610702514648, 0.36043721437454224, -0.8534390926361084, 1.0972867012023926, -0.5656604766845703, -1.374016523361206, 1.1434799432754517, 0.9217295050621033, -0.5053820013999939, -0.653527021408081, 0.9635331630706787, -0.6760924458503723, 0.8964505195617676, 1.1139675378799438, 0.11103567481040955, -0.615612268447876, 0.669661819934845, 0.5077282190322876, 0.7884109020233154, -0.282312273979187, -1.1419931650161743, 0.3290284276008606, -0.11430269479751587, -0.5301922559738159, 1.0541993379592896, -0.28694772720336914, 1.6013038158416748, -0.5540777444839478, -0.7492983341217041, -0.7083563208580017, 0.6061288118362427, 0.3814331889152527, -0.4626105725765228, 0.42675983905792236, 3.27801513671875, 0.5019083619117737, 0.9772339463233948, 0.10385650396347046, 1.8020223379135132, 0.3700866997241974, 0.27847281098365784, 0.27174949645996094, 2.1464321613311768, 0.8708208203315735, -0.8889873623847961, -1.9413173198699951, 1.2191169261932373, 0.46659648418426514, -0.6571385264396667, 0.5523785352706909, 0.2284098118543625, -0.8017981648445129, -2.6462900638580322, 0.03134152293205261, 0.48928317427635193, 1.4409950971603394, 0.2887071967124939, -0.5563245415687561, 2.3026461601257324, 0.19637952744960785, -0.2635090947151184, 0.8868705034255981, -2.522184133529663, -0.2541545331478119, -1.8144556283950806, 0.7598944902420044, -0.01507103443145752, -0.48738282918930054, 2.5068776607513428, 0.2580578327178955, -0.6236063838005066, -0.12450772523880005, -0.827804684638977, 0.11391301453113556, 0.42766308784484863, 0.7421866655349731, -1.4340589046478271, -0.9550703763961792, -2.1566827297210693, 0.24744760990142822, -0.6655968427658081, -0.1393868774175644, -1.575204610824585, 0.3340066373348236, 0.5005713701248169, -0.3240489065647125, 0.1820300817489624, -0.9653584361076355, -0.24719597399234772, 0.3030896782875061, 0.2941237688064575, 0.9713271856307983, -1.2743730545043945, -0.8508260846138, -0.5846670269966125, 0.7987306714057922, -0.7751691341400146, 1.3942700624465942, 0.9158865809440613, 1.3374955654144287, 1.4484182596206665, 0.48566892743110657, -0.6094985008239746, -1.3979436159133911, -0.2593473196029663, 0.0010382533073425293, 0.6716431975364685, 0.9193450808525085, -0.04230065643787384, -1.1426705121994019, -1.4636797904968262, -0.10540539026260376, -0.013864398002624512, 0.5200478434562683, -0.0938180685043335, 0.1153164952993393, 0.17895299196243286, -0.5977121591567993, -0.2515043020248413, -0.3855947256088257, 0.15592393279075623, -0.12972214818000793, -0.07183170318603516, -0.6610509753227234, -0.018475398421287537, -0.3076592981815338, -0.1922263503074646, -1.4097564220428467, -2.2275562286376953, -1.893112301826477, -0.042256295680999756, 0.5145841240882874, 1.1068949699401855, -0.7139621376991272, -0.07988721132278442, 0.3435494601726532, -0.4243588149547577, -0.008931666612625122, 1.0509660243988037, 1.1662237644195557, -0.8917632102966309, 0.33201295137405396, -0.7746796607971191, -0.5721061825752258, -1.9475504159927368, 1.5178462266921997, -0.060435742139816284, -0.8717288374900818, 0.2928161919116974, 0.0636681467294693, 0.1703457236289978, -0.27386489510536194, -0.26928359270095825, -0.023242026567459106, -1.736487627029419, -0.5320091247558594, 0.5656461119651794, 1.343096375465393, -0.5292486548423767, 0.6995995044708252, 1.8494065999984741, -1.070509672164917, -0.6827122569084167, 0.2658381462097168, 0.9334869384765625, 0.3754584789276123, 1.0158514976501465, 0.05851905047893524, -0.1938868910074234, 1.600212574005127, -0.17192764580249786, -1.8337992429733276, -0.5270220041275024, 1.118147611618042, 0.48606082797050476, 1.5579197406768799, 0.6938760280609131, -1.4698147773742676, 0.11588439345359802, -0.202753484249115, 1.1039189100265503, -1.480780005455017, -2.190964698791504, 0.09671509265899658, -2.2585744857788086, 0.8313375115394592, -1.863250970840454, -0.10208240151405334, -1.2339996099472046, 0.3820025324821472, -0.9986867308616638, 0.6254106163978577, 0.41140902042388916, 1.2635047435760498, -0.11451363563537598, -0.1026444286108017, -1.1613606214523315, -0.8220822811126709, 0.6318907737731934, -0.5551211833953857, 0.12549853324890137, 0.09537239372730255, -0.29246971011161804, 0.37447643280029297, 0.7129379510879517, -1.0330889225006104, 0.15832117199897766, -1.7406810522079468, -1.2804269790649414, -0.23145508766174316, 1.2325899600982666, -0.08645722270011902, 1.432699203491211, 0.7328472137451172, 0.6060837507247925, 1.3647466897964478, 0.7309415340423584, -1.1992465257644653, 0.42096030712127686, -0.4138919413089752, -1.4816687107086182, 0.6547573208808899, 0.5106136798858643, 0.028726279735565186, 1.0680160522460938, 1.0825806856155396, -1.602463722229004, -0.3985508680343628, -2.53245210647583, 0.47712475061416626, 0.4283236563205719, 0.5538251996040344, 0.052823156118392944, -0.5257505178451538, -0.7285279035568237, 1.2323248386383057, -0.4162498116493225, -0.028031915426254272, 0.038046419620513916, -1.6996086835861206, -2.0380702018737793, 0.6703183650970459, -0.27139511704444885, -1.3527802228927612, 0.7619705200195312, -0.7655982971191406, 0.03507331758737564, 0.9413551092147827, -1.8595740795135498, 1.3904362916946411, 1.2897967100143433, -2.2465858459472656, 0.6519367694854736, 0.7851924896240234, 0.2998538613319397, -0.7681373357772827, 1.0387623310089111, 0.8529593348503113, -0.3406035304069519, 1.8248887062072754, 0.7061557769775391, -1.7317109107971191, 1.3563659191131592, -0.3128545582294464, 1.2633230686187744, -2.395455837249756, 1.5824381113052368, 0.38374924659729004, -1.3001031875610352, -0.3622573912143707, -0.9468185901641846, -1.4262930154800415, -0.5112523436546326, -2.2865359783172607, -0.5568971633911133, -0.1657651662826538]	2026-06-20 11:19:40.545539+05	2026-06-20 11:19:40.545539+05
\.


--
-- TOC entry 5274 (class 0 OID 16427)
-- Dependencies: 228
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.students (id, name, gender, registration_number, class_level, program_name, hall_id, roll_number, email) FROM stdin;
1	inshaal mobeen	Female	0000001	12	FSC Pre-Engineering	1	\N	\N
2	arslan khan	Male	0000002	12	FSC Pre-Engineering	1	\N	\N
\.


--
-- TOC entry 5270 (class 0 OID 16402)
-- Dependencies: 224
-- Data for Name: support_technicians; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.support_technicians (id, name, contact, assigned_hall) FROM stdin;
\.


--
-- TOC entry 5268 (class 0 OID 16390)
-- Dependencies: 222
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, phone_number, department, password, last_login, is_admin, hall_id) FROM stdin;
1	admin	admin@ems.com	03001234567	Computer Science	$2a$12$of9ofWcvUhL0LESrNUPi/uWAuVzWgDO.GOMze9U2H2VF7xAjMtnxa	\N	t	\N
2	invigilator	invigilator@ems.com	03143173322	Computer Science	$2b$12$pXinp3LJ7aAUJomqqYFdLu3phC3HQJEQlrBgJLzmt8cpGD0mQIfFa	\N	f	1
\.


--
-- TOC entry 5284 (class 0 OID 16502)
-- Dependencies: 238
-- Data for Name: violations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.violations (id, "timestamp", evidence_path, type, status, confidence, camera_id, hall_id, student_id, mic_id, exam_id, severity, event_id, created_at) FROM stdin;
1	2026-06-20 11:24:28.157	\N	head_movement	dismissed	0.6830860701724568	\N	1	1	\N	1	low	7136f6f7-f0d1-443f-8c7a-d22be477db69	2026-06-20 11:25:24.23617+05
3	2026-06-20 11:24:52.706	\N	whisper_detected	dismissed	0.8	\N	1	1	\N	1	medium	6a9ec5e6-9b27-45e9-b16f-57fd11d727f4	2026-06-20 11:25:26.337545+05
2	2026-06-20 11:24:52.706	\N	whisper_detected	dismissed	0.8	\N	1	2	\N	1	medium	aa07ff04-0577-40b1-b3b0-dacfc4e58b11	2026-06-20 11:25:25.330556+05
4	2026-06-20 11:24:23.057	\N	head_movement	dismissed	0.40573800575104824	\N	1	1	\N	1	low	d3cb4064-a4ab-4412-b4b8-6c7f816ef6e1	2026-06-20 11:25:27.121278+05
\.


--
-- TOC entry 5329 (class 0 OID 0)
-- Dependencies: 252
-- Name: ai_alerts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ai_alerts_id_seq', 65, true);


--
-- TOC entry 5330 (class 0 OID 0)
-- Dependencies: 256
-- Name: alert_evidence_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.alert_evidence_id_seq', 63, true);


--
-- TOC entry 5331 (class 0 OID 0)
-- Dependencies: 241
-- Name: alerts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.alerts_id_seq', 1, false);


--
-- TOC entry 5332 (class 0 OID 0)
-- Dependencies: 235
-- Name: attendance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.attendance_id_seq', 2, true);


--
-- TOC entry 5333 (class 0 OID 0)
-- Dependencies: 243
-- Name: audio_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.audio_logs_id_seq', 1, false);


--
-- TOC entry 5334 (class 0 OID 0)
-- Dependencies: 229
-- Name: cameras_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cameras_id_seq', 1, true);


--
-- TOC entry 5335 (class 0 OID 0)
-- Dependencies: 225
-- Name: exam_halls_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.exam_halls_id_seq', 1, true);


--
-- TOC entry 5336 (class 0 OID 0)
-- Dependencies: 250
-- Name: exams_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.exams_id_seq', 2, true);


--
-- TOC entry 5337 (class 0 OID 0)
-- Dependencies: 247
-- Name: hardware_maintenance_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hardware_maintenance_logs_id_seq', 1, false);


--
-- TOC entry 5338 (class 0 OID 0)
-- Dependencies: 231
-- Name: microphones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.microphones_id_seq', 1, true);


--
-- TOC entry 5339 (class 0 OID 0)
-- Dependencies: 239
-- Name: reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reviews_id_seq', 1, false);


--
-- TOC entry 5340 (class 0 OID 0)
-- Dependencies: 233
-- Name: seat_allocations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.seat_allocations_id_seq', 6, true);


--
-- TOC entry 5341 (class 0 OID 0)
-- Dependencies: 245
-- Name: speakers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.speakers_id_seq', 1, true);


--
-- TOC entry 5342 (class 0 OID 0)
-- Dependencies: 254
-- Name: student_embeddings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_embeddings_id_seq', 2, true);


--
-- TOC entry 5343 (class 0 OID 0)
-- Dependencies: 227
-- Name: students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.students_id_seq', 2, true);


--
-- TOC entry 5344 (class 0 OID 0)
-- Dependencies: 223
-- Name: support_technicians_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.support_technicians_id_seq', 1, false);


--
-- TOC entry 5345 (class 0 OID 0)
-- Dependencies: 221
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- TOC entry 5346 (class 0 OID 0)
-- Dependencies: 237
-- Name: violations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.violations_id_seq', 4, true);


--
-- TOC entry 5079 (class 2606 OID 16723)
-- Name: ai_alerts ai_alerts_event_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_alerts
    ADD CONSTRAINT ai_alerts_event_id_key UNIQUE (event_id);


--
-- TOC entry 5081 (class 2606 OID 16721)
-- Name: ai_alerts ai_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_alerts
    ADD CONSTRAINT ai_alerts_pkey PRIMARY KEY (id);


--
-- TOC entry 5090 (class 2606 OID 42288)
-- Name: alert_evidence alert_evidence_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert_evidence
    ADD CONSTRAINT alert_evidence_pkey PRIMARY KEY (id);


--
-- TOC entry 5065 (class 2606 OID 16560)
-- Name: alerts_old alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts_old
    ADD CONSTRAINT alerts_pkey PRIMARY KEY (id);


--
-- TOC entry 5050 (class 2606 OID 16495)
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- TOC entry 5052 (class 2606 OID 50512)
-- Name: attendance attendance_student_exam_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_student_exam_unique UNIQUE (student_id, exam_id);


--
-- TOC entry 5067 (class 2606 OID 16575)
-- Name: audio_logs audio_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audio_logs
    ADD CONSTRAINT audio_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 5036 (class 2606 OID 16445)
-- Name: cameras cameras_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cameras
    ADD CONSTRAINT cameras_pkey PRIMARY KEY (id);


--
-- TOC entry 5028 (class 2606 OID 16420)
-- Name: exam_halls exam_halls_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_halls
    ADD CONSTRAINT exam_halls_pkey PRIMARY KEY (id);


--
-- TOC entry 5075 (class 2606 OID 16687)
-- Name: exams exams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_pkey PRIMARY KEY (id);


--
-- TOC entry 5071 (class 2606 OID 16610)
-- Name: hardware_maintenance_logs hardware_maintenance_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hardware_maintenance_logs
    ADD CONSTRAINT hardware_maintenance_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 5073 (class 2606 OID 16662)
-- Name: invigilator_halls invigilator_halls_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invigilator_halls
    ADD CONSTRAINT invigilator_halls_pkey PRIMARY KEY (invigilator_id, hall_id);


--
-- TOC entry 5038 (class 2606 OID 16460)
-- Name: microphones microphones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.microphones
    ADD CONSTRAINT microphones_pkey PRIMARY KEY (id);


--
-- TOC entry 5063 (class 2606 OID 16540)
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- TOC entry 5040 (class 2606 OID 16475)
-- Name: seat_allocations seat_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seat_allocations
    ADD CONSTRAINT seat_allocations_pkey PRIMARY KEY (id);


--
-- TOC entry 5042 (class 2606 OID 33946)
-- Name: seat_allocations seat_allocations_unique_seat_per_exam; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seat_allocations
    ADD CONSTRAINT seat_allocations_unique_seat_per_exam UNIQUE (hall_id, exam_id, row_number, column_number);


--
-- TOC entry 5044 (class 2606 OID 33948)
-- Name: seat_allocations seat_allocations_unique_student_per_exam; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seat_allocations
    ADD CONSTRAINT seat_allocations_unique_student_per_exam UNIQUE (exam_id, student_id);


--
-- TOC entry 5069 (class 2606 OID 16595)
-- Name: speakers speakers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.speakers
    ADD CONSTRAINT speakers_pkey PRIMARY KEY (id);


--
-- TOC entry 5086 (class 2606 OID 16750)
-- Name: student_embeddings student_embeddings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_embeddings
    ADD CONSTRAINT student_embeddings_pkey PRIMARY KEY (id);


--
-- TOC entry 5088 (class 2606 OID 16858)
-- Name: student_embeddings student_embeddings_student_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_embeddings
    ADD CONSTRAINT student_embeddings_student_id_key UNIQUE (student_id);


--
-- TOC entry 5032 (class 2606 OID 16435)
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- TOC entry 5034 (class 2606 OID 33693)
-- Name: students students_registration_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_registration_number_unique UNIQUE (registration_number);


--
-- TOC entry 5026 (class 2606 OID 16410)
-- Name: support_technicians support_technicians_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_technicians
    ADD CONSTRAINT support_technicians_pkey PRIMARY KEY (id);


--
-- TOC entry 5057 (class 2606 OID 25245)
-- Name: attendance unique_attendance; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT unique_attendance UNIQUE (student_id, exam_id, date);


--
-- TOC entry 5077 (class 2606 OID 33927)
-- Name: exams unique_exam_hall_time; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT unique_exam_hall_time UNIQUE (hall_id, start_time);


--
-- TOC entry 5046 (class 2606 OID 33501)
-- Name: seat_allocations unique_seat; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seat_allocations
    ADD CONSTRAINT unique_seat UNIQUE (hall_id, exam_id, row_number, column_number);


--
-- TOC entry 5048 (class 2606 OID 33499)
-- Name: seat_allocations unique_student_exam; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seat_allocations
    ADD CONSTRAINT unique_student_exam UNIQUE (student_id, exam_id);


--
-- TOC entry 5030 (class 2606 OID 16643)
-- Name: exam_halls uq_hall_number; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_halls
    ADD CONSTRAINT uq_hall_number UNIQUE (hall_number);


--
-- TOC entry 5024 (class 2606 OID 16400)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5061 (class 2606 OID 16510)
-- Name: violations violations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violations
    ADD CONSTRAINT violations_pkey PRIMARY KEY (id);


--
-- TOC entry 5053 (class 1259 OID 17042)
-- Name: attendance_unique_today; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX attendance_unique_today ON public.attendance USING btree (student_id, exam_id, date);


--
-- TOC entry 5082 (class 1259 OID 16724)
-- Name: idx_ai_alerts_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_alerts_created_at ON public.ai_alerts USING btree (created_at DESC);


--
-- TOC entry 5083 (class 1259 OID 16725)
-- Name: idx_ai_alerts_hall_id_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_alerts_hall_id_created_at ON public.ai_alerts USING btree (hall_id, created_at DESC);


--
-- TOC entry 5054 (class 1259 OID 16731)
-- Name: idx_attendance_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_created_at ON public.attendance USING btree (created_at DESC);


--
-- TOC entry 5055 (class 1259 OID 16733)
-- Name: idx_attendance_hall_id_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_attendance_hall_id_created_at ON public.attendance USING btree (hall_id, created_at DESC);


--
-- TOC entry 5084 (class 1259 OID 16755)
-- Name: idx_student_embeddings_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_embeddings_updated_at ON public.student_embeddings USING btree (updated_at DESC);


--
-- TOC entry 5058 (class 1259 OID 33993)
-- Name: idx_violations_hall_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_violations_hall_id ON public.violations USING btree (hall_id);


--
-- TOC entry 5059 (class 1259 OID 33992)
-- Name: idx_violations_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_violations_timestamp ON public.violations USING btree ("timestamp" DESC);


--
-- TOC entry 5107 (class 2606 OID 16561)
-- Name: alerts_old alerts_violation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alerts_old
    ADD CONSTRAINT alerts_violation_id_fkey FOREIGN KEY (violation_id) REFERENCES public.violations(id);


--
-- TOC entry 5100 (class 2606 OID 16496)
-- Name: attendance attendance_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- TOC entry 5108 (class 2606 OID 16581)
-- Name: audio_logs audio_logs_hall_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audio_logs
    ADD CONSTRAINT audio_logs_hall_id_fkey FOREIGN KEY (hall_id) REFERENCES public.exam_halls(id);


--
-- TOC entry 5109 (class 2606 OID 16576)
-- Name: audio_logs audio_logs_mic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audio_logs
    ADD CONSTRAINT audio_logs_mic_id_fkey FOREIGN KEY (mic_id) REFERENCES public.microphones(id);


--
-- TOC entry 5095 (class 2606 OID 16446)
-- Name: cameras cameras_hall_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cameras
    ADD CONSTRAINT cameras_hall_id_fkey FOREIGN KEY (hall_id) REFERENCES public.exam_halls(id);


--
-- TOC entry 5092 (class 2606 OID 16421)
-- Name: exam_halls exam_halls_technician_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_halls
    ADD CONSTRAINT exam_halls_technician_id_fkey FOREIGN KEY (technician_id) REFERENCES public.support_technicians(id);


--
-- TOC entry 5117 (class 2606 OID 16688)
-- Name: exams exams_hall_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_hall_id_fkey FOREIGN KEY (hall_id) REFERENCES public.exam_halls(id) ON DELETE SET NULL;


--
-- TOC entry 5118 (class 2606 OID 33836)
-- Name: ai_alerts fk_ai_alerts_student; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_alerts
    ADD CONSTRAINT fk_ai_alerts_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE SET NULL;


--
-- TOC entry 5097 (class 2606 OID 17043)
-- Name: seat_allocations fk_exam; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seat_allocations
    ADD CONSTRAINT fk_exam FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON DELETE CASCADE;


--
-- TOC entry 5093 (class 2606 OID 16637)
-- Name: students fk_hall; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT fk_hall FOREIGN KEY (hall_id) REFERENCES public.exam_halls(id) ON DELETE SET NULL;


--
-- TOC entry 5119 (class 2606 OID 16860)
-- Name: student_embeddings fk_student_embeddings_student; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_embeddings
    ADD CONSTRAINT fk_student_embeddings_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;


--
-- TOC entry 5111 (class 2606 OID 16621)
-- Name: hardware_maintenance_logs hardware_maintenance_logs_camera_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hardware_maintenance_logs
    ADD CONSTRAINT hardware_maintenance_logs_camera_id_fkey FOREIGN KEY (camera_id) REFERENCES public.cameras(id);


--
-- TOC entry 5112 (class 2606 OID 16626)
-- Name: hardware_maintenance_logs hardware_maintenance_logs_microphone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hardware_maintenance_logs
    ADD CONSTRAINT hardware_maintenance_logs_microphone_id_fkey FOREIGN KEY (microphone_id) REFERENCES public.microphones(id);


--
-- TOC entry 5113 (class 2606 OID 16611)
-- Name: hardware_maintenance_logs hardware_maintenance_logs_speaker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hardware_maintenance_logs
    ADD CONSTRAINT hardware_maintenance_logs_speaker_id_fkey FOREIGN KEY (speaker_id) REFERENCES public.speakers(id);


--
-- TOC entry 5114 (class 2606 OID 16616)
-- Name: hardware_maintenance_logs hardware_maintenance_logs_technician_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hardware_maintenance_logs
    ADD CONSTRAINT hardware_maintenance_logs_technician_id_fkey FOREIGN KEY (technician_id) REFERENCES public.support_technicians(id);


--
-- TOC entry 5115 (class 2606 OID 16668)
-- Name: invigilator_halls invigilator_halls_hall_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invigilator_halls
    ADD CONSTRAINT invigilator_halls_hall_id_fkey FOREIGN KEY (hall_id) REFERENCES public.exam_halls(id) ON DELETE CASCADE;


--
-- TOC entry 5116 (class 2606 OID 16663)
-- Name: invigilator_halls invigilator_halls_invigilator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invigilator_halls
    ADD CONSTRAINT invigilator_halls_invigilator_id_fkey FOREIGN KEY (invigilator_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5096 (class 2606 OID 16461)
-- Name: microphones microphones_hall_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.microphones
    ADD CONSTRAINT microphones_hall_id_fkey FOREIGN KEY (hall_id) REFERENCES public.exam_halls(id);


--
-- TOC entry 5105 (class 2606 OID 16546)
-- Name: reviews reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 5106 (class 2606 OID 16541)
-- Name: reviews reviews_violation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_violation_id_fkey FOREIGN KEY (violation_id) REFERENCES public.violations(id);


--
-- TOC entry 5098 (class 2606 OID 16476)
-- Name: seat_allocations seat_allocations_hall_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seat_allocations
    ADD CONSTRAINT seat_allocations_hall_id_fkey FOREIGN KEY (hall_id) REFERENCES public.exam_halls(id);


--
-- TOC entry 5099 (class 2606 OID 16481)
-- Name: seat_allocations seat_allocations_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seat_allocations
    ADD CONSTRAINT seat_allocations_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


--
-- TOC entry 5110 (class 2606 OID 16596)
-- Name: speakers speakers_hall_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.speakers
    ADD CONSTRAINT speakers_hall_id_fkey FOREIGN KEY (hall_id) REFERENCES public.exam_halls(id);


--
-- TOC entry 5094 (class 2606 OID 16632)
-- Name: students students_hall_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_hall_id_fkey FOREIGN KEY (hall_id) REFERENCES public.exam_halls(id);


--
-- TOC entry 5091 (class 2606 OID 42247)
-- Name: users users_hall_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_hall_id_fkey FOREIGN KEY (hall_id) REFERENCES public.exam_halls(id);


--
-- TOC entry 5101 (class 2606 OID 16511)
-- Name: violations violations_camera_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violations
    ADD CONSTRAINT violations_camera_id_fkey FOREIGN KEY (camera_id) REFERENCES public.cameras(id);


--
-- TOC entry 5102 (class 2606 OID 16516)
-- Name: violations violations_hall_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violations
    ADD CONSTRAINT violations_hall_id_fkey FOREIGN KEY (hall_id) REFERENCES public.exam_halls(id);


--
-- TOC entry 5103 (class 2606 OID 16526)
-- Name: violations violations_mic_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violations
    ADD CONSTRAINT violations_mic_id_fkey FOREIGN KEY (mic_id) REFERENCES public.microphones(id);


--
-- TOC entry 5104 (class 2606 OID 16521)
-- Name: violations violations_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violations
    ADD CONSTRAINT violations_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id);


-- Completed on 2026-06-22 17:55:20

--
-- PostgreSQL database dump complete
--

\unrestrict Zw2gxgzFTZuzyp13x5w5ofME6pOatGrEfLUl9O11WlYDDYuO8fWeHucFjnEyqmU

