

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."user_role" AS ENUM (
    'patient',
    'practitioner'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."appointments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "practitioner_id" "uuid" NOT NULL,
    "scheduled_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" NOT NULL,
    "notes" "text",
    CONSTRAINT "appointments_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'cancelled'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."appointments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."login_codes" (
    "email" "text" NOT NULL,
    "code_hash" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."login_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patients" (
    "user_id" "uuid" NOT NULL,
    "birth_date" "date" NOT NULL,
    "weight_kg" numeric(5,2),
    "allergies" "text"[],
    "medical_history" "text",
    "gender" "text",
    "social_security_number" "text",
    "health_insurance" "text",
    "coverage_mutuelle" "text",
    "street_address" "text",
    "postal_code" "text",
    "city" "text",
    "country" "text",
    CONSTRAINT "patients_gender_check" CHECK (("gender" = ANY (ARRAY['M'::"text", 'F'::"text", 'Other'::"text"])))
);


ALTER TABLE "public"."patients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."practitioner_availabilities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "practitioner_id" "uuid",
    "weekday" smallint,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    CONSTRAINT "chk_time" CHECK (("end_time" > "start_time")),
    CONSTRAINT "practitioner_availabilities_weekday_check" CHECK ((("weekday" >= 0) AND ("weekday" <= 6)))
);


ALTER TABLE "public"."practitioner_availabilities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."practitioners" (
    "user_id" "uuid" NOT NULL,
    "title" "text",
    "street_address" "text",
    "postal_code" "text",
    "city" "text",
    "floor" "text",
    "building_code" "text",
    "public_transport_access" "text",
    "payment_card" boolean DEFAULT false,
    "payment_bank_transfer" boolean DEFAULT false,
    "payment_cheque" boolean DEFAULT false,
    "payment_cash" boolean DEFAULT false,
    "accepts_mutuelle" boolean DEFAULT false,
    "conventioned" boolean DEFAULT false,
    "standard_price_cents" integer,
    "secu_coverage_percent" smallint,
    "verification_documents" "text"[] DEFAULT '{}'::"text"[],
    "is_verified" boolean DEFAULT false NOT NULL,
    CONSTRAINT "practitioners_secu_coverage_percent_check" CHECK ((("secu_coverage_percent" >= 0) AND ("secu_coverage_percent" <= 100)))
);


ALTER TABLE "public"."practitioners" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."proofs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "practitioner_id" "uuid" NOT NULL,
    "url" "text" NOT NULL,
    "filename" "text",
    "uploaded_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."proofs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "role" "public"."user_role" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."login_codes"
    ADD CONSTRAINT "login_codes_pkey" PRIMARY KEY ("email");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_social_security_number_key" UNIQUE ("social_security_number");



ALTER TABLE ONLY "public"."practitioner_availabilities"
    ADD CONSTRAINT "practitioner_availabilities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."practitioners"
    ADD CONSTRAINT "practitioners_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."proofs"
    ADD CONSTRAINT "proofs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "appointments_patient_id_idx" ON "public"."appointments" USING "btree" ("patient_id");



CREATE INDEX "appointments_practitioner_id_idx" ON "public"."appointments" USING "btree" ("practitioner_id");



CREATE INDEX "appointments_scheduled_at_idx" ON "public"."appointments" USING "btree" ("scheduled_at");



CREATE INDEX "proofs_practitioner_id_idx" ON "public"."proofs" USING "btree" ("practitioner_id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "public"."practitioners"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."practitioner_availabilities"
    ADD CONSTRAINT "practitioner_availabilities_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "public"."practitioners"("user_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."practitioners"
    ADD CONSTRAINT "practitioners_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proofs"
    ADD CONSTRAINT "proofs_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "public"."practitioners"("user_id") ON DELETE CASCADE;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";








































































































































































GRANT ALL ON TABLE "public"."appointments" TO "anon";
GRANT ALL ON TABLE "public"."appointments" TO "authenticated";
GRANT ALL ON TABLE "public"."appointments" TO "service_role";



GRANT ALL ON TABLE "public"."login_codes" TO "anon";
GRANT ALL ON TABLE "public"."login_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."login_codes" TO "service_role";



GRANT ALL ON TABLE "public"."patients" TO "anon";
GRANT ALL ON TABLE "public"."patients" TO "authenticated";
GRANT ALL ON TABLE "public"."patients" TO "service_role";



GRANT ALL ON TABLE "public"."practitioner_availabilities" TO "anon";
GRANT ALL ON TABLE "public"."practitioner_availabilities" TO "authenticated";
GRANT ALL ON TABLE "public"."practitioner_availabilities" TO "service_role";



GRANT ALL ON TABLE "public"."practitioners" TO "anon";
GRANT ALL ON TABLE "public"."practitioners" TO "authenticated";
GRANT ALL ON TABLE "public"."practitioners" TO "service_role";



GRANT ALL ON TABLE "public"."proofs" TO "anon";
GRANT ALL ON TABLE "public"."proofs" TO "authenticated";
GRANT ALL ON TABLE "public"."proofs" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
