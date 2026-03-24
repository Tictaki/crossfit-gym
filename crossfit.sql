--
-- PostgreSQL database dump
--

\restrict Byd1TJSHIfebi4Ni2jaZScNqdFoOTwyGQBdnZnuHppAUBctf1XQHpaScCfj3JCb

-- Dumped from database version 18.3 (Debian 18.3-1.pgdg13+1)
-- Dumped by pg_dump version 18.1

-- Started on 2026-03-24 20:58:13

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
-- TOC entry 4 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- TOC entry 3631 (class 0 OID 0)
-- Dependencies: 4
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- TOC entry 881 (class 1247 OID 16438)
-- Name: AuditAction; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AuditAction" AS ENUM (
    'CREATED',
    'ISSUED',
    'CANCELLED',
    'REFUNDED'
);


ALTER TYPE public."AuditAction" OWNER TO postgres;

--
-- TOC entry 884 (class 1247 OID 16448)
-- Name: ExpenseCategory; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ExpenseCategory" AS ENUM (
    'SALARIES',
    'RENT',
    'ELECTRICITY',
    'WATER',
    'EQUIPMENT',
    'MARKETING',
    'MAINTENANCE',
    'TAXES',
    'OTHER'
);


ALTER TYPE public."ExpenseCategory" OWNER TO postgres;

--
-- TOC entry 869 (class 1247 OID 16396)
-- Name: Gender; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Gender" AS ENUM (
    'MALE',
    'FEMALE'
);


ALTER TYPE public."Gender" OWNER TO postgres;

--
-- TOC entry 878 (class 1247 OID 16430)
-- Name: InvoiceStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."InvoiceStatus" AS ENUM (
    'ISSUED',
    'CANCELLED',
    'REFUNDED'
);


ALTER TYPE public."InvoiceStatus" OWNER TO postgres;

--
-- TOC entry 872 (class 1247 OID 16402)
-- Name: MemberStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MemberStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED'
);


ALTER TYPE public."MemberStatus" OWNER TO postgres;

--
-- TOC entry 875 (class 1247 OID 16410)
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'CASH',
    'MPESA',
    'EMOLA',
    'TRANSFER',
    'MKESH',
    'POS',
    'CONTAMOVEL',
    'BIM',
    'BCI'
);


ALTER TYPE public."PaymentMethod" OWNER TO postgres;

--
-- TOC entry 866 (class 1247 OID 16390)
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'RECEPTIONIST'
);


ALTER TYPE public."Role" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 227 (class 1259 OID 16588)
-- Name: Checkin; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Checkin" (
    id text NOT NULL,
    "memberId" text NOT NULL,
    "checkinDatetime" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Checkin" OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 16572)
-- Name: Expense; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Expense" (
    id text NOT NULL,
    description text NOT NULL,
    amount numeric(10,2) NOT NULL,
    category text NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "dueDate" timestamp(3) without time zone,
    "invoiceNumber" text,
    "processedBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Expense" OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 16669)
-- Name: FixedCost; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."FixedCost" (
    id text NOT NULL,
    description text NOT NULL,
    amount numeric(10,2) NOT NULL,
    category text NOT NULL,
    "invoiceNumber" text,
    "dueDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."FixedCost" OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16541)
-- Name: Invoice; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Invoice" (
    id text NOT NULL,
    "invoiceNumber" integer NOT NULL,
    "paymentId" text NOT NULL,
    status public."InvoiceStatus" DEFAULT 'ISSUED'::public."InvoiceStatus" NOT NULL,
    "issuedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "issuedBy" text NOT NULL,
    "cancelledAt" timestamp(3) without time zone,
    "cancelReason" text,
    "pdfStoragePath" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Invoice" OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16483)
-- Name: Member; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Member" (
    id text NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    whatsapp text,
    "birthDate" timestamp(3) without time zone NOT NULL,
    gender public."Gender" NOT NULL,
    photo text,
    "planId" text,
    "startDate" timestamp(3) without time zone,
    "expirationDate" timestamp(3) without time zone,
    status public."MemberStatus" DEFAULT 'INACTIVE'::public."MemberStatus" NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    email text,
    "enrollmentDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Member" OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 16643)
-- Name: Notification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Notification" (
    id text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'INFO'::text NOT NULL,
    entity text,
    "entityId" text,
    "performedBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Notification" OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 16657)
-- Name: NotificationRecipient; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."NotificationRecipient" (
    id text NOT NULL,
    "notificationId" text NOT NULL,
    "userId" text NOT NULL,
    read boolean DEFAULT false NOT NULL
);


ALTER TABLE public."NotificationRecipient" OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16519)
-- Name: Payment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    "receiptNumber" integer NOT NULL,
    "memberId" text NOT NULL,
    "planId" text NOT NULL,
    amount numeric(10,2) NOT NULL,
    "paymentMethod" public."PaymentMethod" NOT NULL,
    "paymentDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "processedBy" text NOT NULL,
    refunded boolean DEFAULT false NOT NULL,
    "refundedAt" timestamp(3) without time zone,
    "refundReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Payment" OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16559)
-- Name: PaymentAudit; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PaymentAudit" (
    id text NOT NULL,
    "paymentId" text NOT NULL,
    action public."AuditAction" NOT NULL,
    details text,
    "performedBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PaymentAudit" OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16518)
-- Name: Payment_receiptNumber_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Payment_receiptNumber_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Payment_receiptNumber_seq" OWNER TO postgres;

--
-- TOC entry 3632 (class 0 OID 0)
-- Dependencies: 222
-- Name: Payment_receiptNumber_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Payment_receiptNumber_seq" OWNED BY public."Payment"."receiptNumber";


--
-- TOC entry 221 (class 1259 OID 16502)
-- Name: Plan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Plan" (
    id text NOT NULL,
    name text NOT NULL,
    price numeric(10,2) NOT NULL,
    "durationDays" integer NOT NULL,
    description text,
    status boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Plan" OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16608)
-- Name: Product; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    category text,
    "commercialName" text,
    "packageSize" text,
    sku text,
    photo text,
    status boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Product" OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 16625)
-- Name: Sale; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Sale" (
    id text NOT NULL,
    "productId" text NOT NULL,
    quantity integer NOT NULL,
    "totalAmount" numeric(10,2) NOT NULL,
    "paymentMethod" text NOT NULL,
    "processedBy" text NOT NULL,
    "saleDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Sale" OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16599)
-- Name: Setting; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Setting" (
    key text NOT NULL,
    value text NOT NULL
);


ALTER TABLE public."Setting" OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16467)
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role public."Role" DEFAULT 'RECEPTIONIST'::public."Role" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    photo text
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- TOC entry 3369 (class 2604 OID 16522)
-- Name: Payment receiptNumber; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment" ALTER COLUMN "receiptNumber" SET DEFAULT nextval('public."Payment_receiptNumber_seq"'::regclass);


--
-- TOC entry 3619 (class 0 OID 16588)
-- Dependencies: 227
-- Data for Name: Checkin; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Checkin" (id, "memberId", "checkinDatetime") FROM stdin;
\.


--
-- TOC entry 3618 (class 0 OID 16572)
-- Dependencies: 226
-- Data for Name: Expense; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Expense" (id, description, amount, category, date, "dueDate", "invoiceNumber", "processedBy", "createdAt") FROM stdin;
\.


--
-- TOC entry 3625 (class 0 OID 16669)
-- Dependencies: 233
-- Data for Name: FixedCost; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."FixedCost" (id, description, amount, category, "invoiceNumber", "dueDate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 3616 (class 0 OID 16541)
-- Dependencies: 224
-- Data for Name: Invoice; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Invoice" (id, "invoiceNumber", "paymentId", status, "issuedAt", "issuedBy", "cancelledAt", "cancelReason", "pdfStoragePath", "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 3612 (class 0 OID 16483)
-- Dependencies: 220
-- Data for Name: Member; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Member" (id, name, phone, whatsapp, "birthDate", gender, photo, "planId", "startDate", "expirationDate", status, notes, "createdAt", "updatedAt", email, "enrollmentDate") FROM stdin;
\.


--
-- TOC entry 3623 (class 0 OID 16643)
-- Dependencies: 231
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Notification" (id, message, type, entity, "entityId", "performedBy", "createdAt") FROM stdin;
\.


--
-- TOC entry 3624 (class 0 OID 16657)
-- Dependencies: 232
-- Data for Name: NotificationRecipient; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."NotificationRecipient" (id, "notificationId", "userId", read) FROM stdin;
\.


--
-- TOC entry 3615 (class 0 OID 16519)
-- Dependencies: 223
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Payment" (id, "receiptNumber", "memberId", "planId", amount, "paymentMethod", "paymentDate", "processedBy", refunded, "refundedAt", "refundReason", "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 3617 (class 0 OID 16559)
-- Dependencies: 225
-- Data for Name: PaymentAudit; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PaymentAudit" (id, "paymentId", action, details, "performedBy", "createdAt") FROM stdin;
\.


--
-- TOC entry 3613 (class 0 OID 16502)
-- Dependencies: 221
-- Data for Name: Plan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Plan" (id, name, price, "durationDays", description, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 3621 (class 0 OID 16608)
-- Dependencies: 229
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Product" (id, name, description, price, stock, category, "commercialName", "packageSize", sku, photo, status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 3622 (class 0 OID 16625)
-- Dependencies: 230
-- Data for Name: Sale; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Sale" (id, "productId", quantity, "totalAmount", "paymentMethod", "processedBy", "saleDate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- TOC entry 3620 (class 0 OID 16599)
-- Dependencies: 228
-- Data for Name: Setting; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Setting" (key, value) FROM stdin;
\.


--
-- TOC entry 3611 (class 0 OID 16467)
-- Dependencies: 219
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, name, email, password, role, "createdAt", "updatedAt", photo) FROM stdin;
\.


--
-- TOC entry 3633 (class 0 OID 0)
-- Dependencies: 222
-- Name: Payment_receiptNumber_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Payment_receiptNumber_seq"', 1, false);


--
-- TOC entry 3425 (class 2606 OID 16598)
-- Name: Checkin Checkin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Checkin"
    ADD CONSTRAINT "Checkin_pkey" PRIMARY KEY (id);


--
-- TOC entry 3421 (class 2606 OID 16587)
-- Name: Expense Expense_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Expense"
    ADD CONSTRAINT "Expense_pkey" PRIMARY KEY (id);


--
-- TOC entry 3448 (class 2606 OID 16682)
-- Name: FixedCost FixedCost_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FixedCost"
    ADD CONSTRAINT "FixedCost_pkey" PRIMARY KEY (id);


--
-- TOC entry 3411 (class 2606 OID 16558)
-- Name: Invoice Invoice_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_pkey" PRIMARY KEY (id);


--
-- TOC entry 3396 (class 2606 OID 16501)
-- Name: Member Member_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Member"
    ADD CONSTRAINT "Member_pkey" PRIMARY KEY (id);


--
-- TOC entry 3443 (class 2606 OID 16668)
-- Name: NotificationRecipient NotificationRecipient_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."NotificationRecipient"
    ADD CONSTRAINT "NotificationRecipient_pkey" PRIMARY KEY (id);


--
-- TOC entry 3440 (class 2606 OID 16656)
-- Name: Notification Notification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);


--
-- TOC entry 3417 (class 2606 OID 16571)
-- Name: PaymentAudit PaymentAudit_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PaymentAudit"
    ADD CONSTRAINT "PaymentAudit_pkey" PRIMARY KEY (id);


--
-- TOC entry 3403 (class 2606 OID 16540)
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- TOC entry 3399 (class 2606 OID 16517)
-- Name: Plan Plan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Plan"
    ADD CONSTRAINT "Plan_pkey" PRIMARY KEY (id);


--
-- TOC entry 3430 (class 2606 OID 16624)
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- TOC entry 3433 (class 2606 OID 16642)
-- Name: Sale Sale_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Sale"
    ADD CONSTRAINT "Sale_pkey" PRIMARY KEY (id);


--
-- TOC entry 3427 (class 2606 OID 16607)
-- Name: Setting Setting_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Setting"
    ADD CONSTRAINT "Setting_pkey" PRIMARY KEY (key);


--
-- TOC entry 3391 (class 2606 OID 16482)
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- TOC entry 3422 (class 1259 OID 16704)
-- Name: Checkin_checkinDatetime_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Checkin_checkinDatetime_idx" ON public."Checkin" USING btree ("checkinDatetime");


--
-- TOC entry 3423 (class 1259 OID 16703)
-- Name: Checkin_memberId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Checkin_memberId_idx" ON public."Checkin" USING btree ("memberId");


--
-- TOC entry 3418 (class 1259 OID 16702)
-- Name: Expense_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Expense_category_idx" ON public."Expense" USING btree (category);


--
-- TOC entry 3419 (class 1259 OID 16701)
-- Name: Expense_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Expense_date_idx" ON public."Expense" USING btree (date);


--
-- TOC entry 3446 (class 1259 OID 16715)
-- Name: FixedCost_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FixedCost_category_idx" ON public."FixedCost" USING btree (category);


--
-- TOC entry 3406 (class 1259 OID 16694)
-- Name: Invoice_invoiceNumber_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Invoice_invoiceNumber_idx" ON public."Invoice" USING btree ("invoiceNumber");


--
-- TOC entry 3407 (class 1259 OID 16692)
-- Name: Invoice_invoiceNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON public."Invoice" USING btree ("invoiceNumber");


--
-- TOC entry 3408 (class 1259 OID 16697)
-- Name: Invoice_issuedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Invoice_issuedAt_idx" ON public."Invoice" USING btree ("issuedAt");


--
-- TOC entry 3409 (class 1259 OID 16693)
-- Name: Invoice_paymentId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Invoice_paymentId_key" ON public."Invoice" USING btree ("paymentId");


--
-- TOC entry 3412 (class 1259 OID 16695)
-- Name: Invoice_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Invoice_status_idx" ON public."Invoice" USING btree (status);


--
-- TOC entry 3392 (class 1259 OID 16687)
-- Name: Member_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Member_email_idx" ON public."Member" USING btree (email);


--
-- TOC entry 3393 (class 1259 OID 16686)
-- Name: Member_expirationDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Member_expirationDate_idx" ON public."Member" USING btree ("expirationDate");


--
-- TOC entry 3394 (class 1259 OID 16684)
-- Name: Member_phone_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Member_phone_key" ON public."Member" USING btree (phone);


--
-- TOC entry 3397 (class 1259 OID 16685)
-- Name: Member_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Member_status_idx" ON public."Member" USING btree (status);


--
-- TOC entry 3441 (class 1259 OID 16714)
-- Name: NotificationRecipient_notificationId_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "NotificationRecipient_notificationId_userId_key" ON public."NotificationRecipient" USING btree ("notificationId", "userId");


--
-- TOC entry 3444 (class 1259 OID 16713)
-- Name: NotificationRecipient_read_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "NotificationRecipient_read_idx" ON public."NotificationRecipient" USING btree (read);


--
-- TOC entry 3445 (class 1259 OID 16712)
-- Name: NotificationRecipient_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "NotificationRecipient_userId_idx" ON public."NotificationRecipient" USING btree ("userId");


--
-- TOC entry 3437 (class 1259 OID 16710)
-- Name: Notification_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Notification_createdAt_idx" ON public."Notification" USING btree ("createdAt");


--
-- TOC entry 3438 (class 1259 OID 16711)
-- Name: Notification_performedBy_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Notification_performedBy_idx" ON public."Notification" USING btree ("performedBy");


--
-- TOC entry 3413 (class 1259 OID 16699)
-- Name: PaymentAudit_action_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PaymentAudit_action_idx" ON public."PaymentAudit" USING btree (action);


--
-- TOC entry 3414 (class 1259 OID 16700)
-- Name: PaymentAudit_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PaymentAudit_createdAt_idx" ON public."PaymentAudit" USING btree ("createdAt");


--
-- TOC entry 3415 (class 1259 OID 16698)
-- Name: PaymentAudit_paymentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PaymentAudit_paymentId_idx" ON public."PaymentAudit" USING btree ("paymentId");


--
-- TOC entry 3400 (class 1259 OID 16689)
-- Name: Payment_memberId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Payment_memberId_idx" ON public."Payment" USING btree ("memberId");


--
-- TOC entry 3401 (class 1259 OID 16690)
-- Name: Payment_paymentDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Payment_paymentDate_idx" ON public."Payment" USING btree ("paymentDate");


--
-- TOC entry 3404 (class 1259 OID 16691)
-- Name: Payment_receiptNumber_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Payment_receiptNumber_idx" ON public."Payment" USING btree ("receiptNumber");


--
-- TOC entry 3405 (class 1259 OID 16688)
-- Name: Payment_receiptNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Payment_receiptNumber_key" ON public."Payment" USING btree ("receiptNumber");


--
-- TOC entry 3428 (class 1259 OID 16706)
-- Name: Product_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Product_category_idx" ON public."Product" USING btree (category);


--
-- TOC entry 3431 (class 1259 OID 16705)
-- Name: Product_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Product_status_idx" ON public."Product" USING btree (status);


--
-- TOC entry 3434 (class 1259 OID 16709)
-- Name: Sale_processedBy_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Sale_processedBy_idx" ON public."Sale" USING btree ("processedBy");


--
-- TOC entry 3435 (class 1259 OID 16707)
-- Name: Sale_productId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Sale_productId_idx" ON public."Sale" USING btree ("productId");


--
-- TOC entry 3436 (class 1259 OID 16708)
-- Name: Sale_saleDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Sale_saleDate_idx" ON public."Sale" USING btree ("saleDate");


--
-- TOC entry 3389 (class 1259 OID 16683)
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- TOC entry 3458 (class 2606 OID 16761)
-- Name: Checkin Checkin_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Checkin"
    ADD CONSTRAINT "Checkin_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3457 (class 2606 OID 16756)
-- Name: Expense Expense_processedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Expense"
    ADD CONSTRAINT "Expense_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3453 (class 2606 OID 16736)
-- Name: Invoice Invoice_issuedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_issuedBy_fkey" FOREIGN KEY ("issuedBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3454 (class 2606 OID 16741)
-- Name: Invoice Invoice_paymentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES public."Payment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3449 (class 2606 OID 16716)
-- Name: Member Member_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Member"
    ADD CONSTRAINT "Member_planId_fkey" FOREIGN KEY ("planId") REFERENCES public."Plan"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- TOC entry 3462 (class 2606 OID 16781)
-- Name: NotificationRecipient NotificationRecipient_notificationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."NotificationRecipient"
    ADD CONSTRAINT "NotificationRecipient_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES public."Notification"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3463 (class 2606 OID 16786)
-- Name: NotificationRecipient NotificationRecipient_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."NotificationRecipient"
    ADD CONSTRAINT "NotificationRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3461 (class 2606 OID 16776)
-- Name: Notification Notification_performedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Notification"
    ADD CONSTRAINT "Notification_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3455 (class 2606 OID 16746)
-- Name: PaymentAudit PaymentAudit_paymentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PaymentAudit"
    ADD CONSTRAINT "PaymentAudit_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES public."Payment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 3456 (class 2606 OID 16751)
-- Name: PaymentAudit PaymentAudit_performedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PaymentAudit"
    ADD CONSTRAINT "PaymentAudit_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3450 (class 2606 OID 16721)
-- Name: Payment Payment_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public."Member"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3451 (class 2606 OID 16726)
-- Name: Payment Payment_planId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_planId_fkey" FOREIGN KEY ("planId") REFERENCES public."Plan"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3452 (class 2606 OID 16731)
-- Name: Payment Payment_processedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3459 (class 2606 OID 16766)
-- Name: Sale Sale_processedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Sale"
    ADD CONSTRAINT "Sale_processedBy_fkey" FOREIGN KEY ("processedBy") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- TOC entry 3460 (class 2606 OID 16771)
-- Name: Sale Sale_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Sale"
    ADD CONSTRAINT "Sale_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


-- Completed on 2026-03-24 20:59:21

--
-- PostgreSQL database dump complete
--

\unrestrict Byd1TJSHIfebi4Ni2jaZScNqdFoOTwyGQBdnZnuHppAUBctf1XQHpaScCfj3JCb

