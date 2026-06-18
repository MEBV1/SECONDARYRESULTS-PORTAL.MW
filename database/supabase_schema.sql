-- database/supabase_schema.sql
-- Purpose: Complete production-ready SQL Schema for School Results Management Portal
-- Includes: Tables, Triggers, Custom Functions, automatic JCE/MSCE calculations, ranking engines, and full Row Level Security (RLS)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. TABLES DESIGN
-- ==========================================

-- Schools Table
CREATE TABLE public.schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    postal_address TEXT,
    phone_number TEXT,
    email_address TEXT,
    head_teacher_name TEXT,
    head_teacher_signature_url TEXT,
    district TEXT NOT NULL,
    country TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles Table (Users & Roles)
-- Links directly to Supabase Auth Users
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'school_admin')),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Students Table
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    has_lin BOOLEAN NOT NULL DEFAULT FALSE,
    lin TEXT,
    student_code TEXT UNIQUE NOT NULL,
    form TEXT NOT NULL CHECK (form IN ('Form 1', 'Form 2', 'Form 3', 'Form 4')),
    section TEXT NOT NULL CHECK (section IN ('JCE', 'MSCE')),
    academic_year TEXT NOT NULL, -- e.g. "2026"
    gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female')),
    dob DATE NOT NULL,
    guardian_name TEXT NOT NULL,
    guardian_phone TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Results Table
-- Stores academic results per student, per academic year, per term
CREATE TABLE public.results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_year TEXT NOT NULL,
    term TEXT NOT NULL CHECK (term IN ('Term 1', 'Term 2', 'Term 3')),
    subjects_data JSONB NOT NULL, -- Structured: [{"subject": "English", "marks": 85, "grade": "1", "remarks": "Distinction"}, ...]
    total_marks NUMERIC, -- Calculated automatically for JCE
    average_grade TEXT, -- Calculated automatically for JCE
    total_points INTEGER, -- Calculated automatically for MSCE (Lower is better)
    position INTEGER, -- Calculated automatically based on ranking
    out_of INTEGER, -- Total student cohort count
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    modified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_student_year_term UNIQUE (student_id, academic_year, term)
);

-- Audit Logs Table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 2. AUTOMATIC STUDENT CODE GENERATION
-- ==========================================

-- Function to generate student code automatically
CREATE OR REPLACE FUNCTION public.generate_student_code()
RETURNS TRIGGER AS $$
DECLARE
    v_school_code TEXT;
    v_form_short TEXT;
    v_seq_num INTEGER;
    v_student_code TEXT;
BEGIN
    -- Resolve School Code
    SELECT code INTO v_school_code FROM public.schools WHERE id = NEW.school_id;
    IF v_school_code IS NULL THEN
        RAISE EXCEPTION 'Invalid School ID linked to student.';
    END IF;

    -- Resolve Short Form Code
    CASE NEW.form
        WHEN 'Form 1' THEN v_form_short := 'F1';
        WHEN 'Form 2' THEN v_form_short := 'F2';
        WHEN 'Form 3' THEN v_form_short := 'F3';
        WHEN 'Form 4' THEN v_form_short := 'F4';
    END CASE;

    -- Enforce Section Selection based on Form
    IF NEW.form IN ('Form 1', 'Form 2') THEN
        NEW.section := 'JCE';
    ELSE
        NEW.section := 'MSCE';
    END IF;

    -- Count existing students in that school for current academic year & form to define sequence
    SELECT COUNT(*) INTO v_seq_num
    FROM public.students
    WHERE school_id = NEW.school_id 
      AND academic_year = NEW.academic_year 
      AND form = NEW.form;

    v_seq_num := v_seq_num + 1;

    -- Form student code (e.g., SCH001-2026-F1-0001)
    v_student_code := v_school_code || '-' || NEW.academic_year || '-' || v_form_short || '-' || LPAD(v_seq_num::TEXT, 4, '0');

    -- Assign generated code
    NEW.student_code := v_student_code;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute before insert on students
CREATE TRIGGER trg_generate_student_code
BEFORE INSERT ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.generate_student_code();

-- ==========================================
-- 3. JCE & MSCE SUBJECT GRADING & MARK CALCULATIONS
-- ==========================================

-- Helper function to calculate JCE Grade and Remarks
CREATE OR REPLACE FUNCTION public.calculate_jce_grade_and_remarks(p_marks INTEGER, OUT r_grade TEXT, OUT r_remarks TEXT) AS $$
BEGIN
    IF p_marks >= 80 AND p_marks <= 100 THEN
        r_grade := 'A';
        r_remarks := 'Excellent';
    ELSIF p_marks >= 65 AND p_marks <= 79 THEN
        r_grade := 'B';
        r_remarks := 'Very Good';
    ELSIF p_marks >= 60 AND p_marks <= 64 THEN
        r_grade := 'C';
        r_remarks := 'Good';
    ELSIF p_marks >= 40 AND p_marks <= 59 THEN
        r_grade := 'D';
        r_remarks := 'Satisfactory';
    ELSIF p_marks >= 0 AND p_marks <= 39 THEN
        r_grade := 'F';
        r_remarks := 'Fail';
    ELSE
        r_grade := 'F';
        r_remarks := 'Invalid Marks';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Helper function to calculate MSCE Grade points and Remarks
CREATE OR REPLACE FUNCTION public.calculate_msce_points_and_remarks(p_marks INTEGER, OUT r_points INTEGER, OUT r_remarks TEXT) AS $$
BEGIN
    IF p_marks >= 80 AND p_marks <= 100 THEN
        r_points := 1;
        r_remarks := 'Distinction';
    ELSIF p_marks >= 75 AND p_marks <= 79 THEN
        r_points := 2;
        r_remarks := 'Distinction';
    ELSIF p_marks >= 70 AND p_marks <= 74 THEN
        r_points := 3;
        r_remarks := 'Strong Credit';
    ELSIF p_marks >= 65 AND p_marks <= 69 THEN
        r_points := 4;
        r_remarks := 'Credit';
    ELSIF p_marks >= 56 AND p_marks <= 64 THEN
        r_points := 5;
        r_remarks := 'Credit';
    ELSIF p_marks >= 50 AND p_marks <= 55 THEN
        r_points := 6;
        r_remarks := 'Credit';
    ELSIF p_marks >= 41 AND p_marks <= 49 THEN
        r_points := 7;
        r_remarks := 'Pass';
    ELSIF p_marks >= 35 AND p_marks <= 40 THEN
        r_points := 8;
        r_remarks := 'Weak Pass';
    ELSIF p_marks >= 0 AND p_marks <= 34 THEN
        r_points := 9;
        r_remarks := 'Fail';
    ELSE
        r_points := 9;
        r_remarks := 'Invalid Marks';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger function to pre-calculate grades and summary properties
CREATE OR REPLACE FUNCTION public.process_results_calculations()
RETURNS TRIGGER AS $$
DECLARE
    v_form TEXT;
    v_subject_rec RECORD;
    v_processed_subjects JSONB := '[]'::JSONB;
    v_total_marks NUMERIC := 0;
    v_subject_count INTEGER := 0;
    v_avg_marks NUMERIC := 0;
    v_avg_grade TEXT;
    v_avg_remarks TEXT;
    
    -- MSCE logic vars
    v_has_english BOOLEAN := FALSE;
    v_has_maths BOOLEAN := FALSE;
    v_english_points INTEGER := 9;
    v_maths_points INTEGER := 9;
    v_other_subject_points INTEGER[] := ARRAY[]::INTEGER[];
    v_points_sum INTEGER := 0;
    v_i INTEGER;
    v_array_length INTEGER;
BEGIN
    -- Query student's form to decide section
    SELECT form INTO v_form FROM public.students WHERE id = NEW.student_id;
    IF v_form IS NULL THEN
        RAISE EXCEPTION 'Student record not found.';
    END IF;

    -- 1. Loop through inputted subjects to calculate grades/points per subject
    FOR v_subject_rec IN 
        SELECT * FROM jsonb_to_recordset(NEW.subjects_data) AS x(subject TEXT, marks INTEGER)
    LOOP
        v_subject_count := v_subject_count + 1;
        
        -- JCE processing (Form 1 & 2)
        IF v_form IN ('Form 1', 'Form 2') THEN
            DECLARE
                v_grade TEXT;
                v_remarks TEXT;
            BEGIN
                SELECT * INTO v_grade, v_remarks FROM public.calculate_jce_grade_and_remarks(v_subject_rec.marks);
                v_total_marks := v_total_marks + v_subject_rec.marks;
                
                v_processed_subjects := v_processed_subjects || jsonb_build_object(
                    'subject', v_subject_rec.subject,
                    'marks', v_subject_rec.marks,
                    'grade', v_grade,
                    'remarks', v_remarks
                );
            END;
            
        -- MSCE processing (Form 3 & 4)
        ELSE
            DECLARE
                v_points INTEGER;
                v_remarks TEXT;
            BEGIN
                SELECT * INTO v_points, v_remarks FROM public.calculate_msce_points_and_remarks(v_subject_rec.marks);
                
                IF v_subject_rec.subject = 'English' THEN
                    v_has_english := TRUE;
                    v_english_points := v_points;
                ELSIF v_subject_rec.subject = 'Mathematics' THEN
                    v_has_maths := TRUE;
                    v_maths_points := v_points;
                ELSE
                    v_other_subject_points := array_append(v_other_subject_points, v_points);
                END IF;

                v_processed_subjects := v_processed_subjects || jsonb_build_object(
                    'subject', v_subject_rec.subject,
                    'marks', v_subject_rec.marks,
                    'grade', v_points::TEXT,
                    'remarks', v_remarks
                );
            END;
        END IF;
    END LOOP;

    -- Store formatted / validated subjects structure
    NEW.subjects_data := v_processed_subjects;

    -- 2. Finalize Section Summary Calculations
    IF v_form IN ('Form 1', 'Form 2') THEN
        -- JCE Calculations
        IF v_subject_count > 0 THEN
            v_avg_marks := round(v_total_marks / v_subject_count, 2);
            SELECT r_grade INTO v_avg_grade FROM public.calculate_jce_grade_and_remarks(v_avg_marks::INTEGER);
        ELSE
            v_avg_grade := 'F';
        END IF;

        NEW.total_marks := v_total_marks;
        NEW.average_grade := v_avg_grade;
        NEW.total_points := NULL; -- MSCE only
    ELSE
        -- MSCE Calculations
        -- Requirement: English and Mathematics are mandatory, plus the best 4 other subjects
        v_points_sum := v_english_points + v_maths_points;
        
        -- Sort the other subject points (Ascending: lower points rank higher and are best)
        IF array_length(v_other_subject_points, 1) > 0 THEN
            SELECT array_agg(val ORDER BY val ASC) INTO v_other_subject_points
            FROM unnest(v_other_subject_points) AS val;
            
            -- Take best 4 remaining subjects (or fewer if student took less)
            v_array_length := array_length(v_other_subject_points, 1);
            FOR v_i IN 1..LEAST(v_array_length, 4) LOOP
                v_points_sum := v_points_sum + v_other_subject_points[v_i];
            END LOOP;
            
            -- If student took fewer than 4 remaining subjects, penalize with maximum points (9) for the missing
            IF v_array_length < 4 THEN
                v_points_sum := v_points_sum + ((4 - v_array_length) * 9);
            END IF;
        ELSE
            -- No other subjects taken, default to worst points
            v_points_sum := v_points_sum + (4 * 9);
        END IF;

        NEW.total_marks := NULL; -- JCE only
        NEW.average_grade := NULL; -- JCE only
        NEW.total_points := v_points_sum;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute before insert/update on results
CREATE TRIGGER trg_process_results_calculations
BEFORE INSERT OR UPDATE ON public.results
FOR EACH ROW
EXECUTE FUNCTION public.process_results_calculations();

-- ==========================================
-- 4. AUTOMATIC RANKING (COHORT POSITION ENGINE)
-- ==========================================

-- Function to recalculate ranks inside a classroom cohort (School + Form + Year + Term)
CREATE OR REPLACE FUNCTION public.recalculate_cohort_positions()
RETURNS TRIGGER AS $$
DECLARE
    v_school_id UUID;
    v_academic_year TEXT;
    v_term TEXT;
    v_form TEXT;
    v_rec RECORD;
    v_rank INTEGER := 1;
    v_count INTEGER := 0;
BEGIN
    -- Prevent trigger recursion
    IF pg_trigger_depth() <> 1 THEN
        RETURN NULL;
    END IF;

    -- Resolve context from current record
    IF TG_OP = 'DELETE' THEN
        v_school_id := OLD.school_id;
        v_academic_year := OLD.academic_year;
        v_term := OLD.term;
        -- Fetch Student Form
        SELECT form INTO v_form FROM public.students WHERE id = OLD.student_id;
    ELSE
        v_school_id := NEW.school_id;
        v_academic_year := NEW.academic_year;
        v_term := NEW.term;
        SELECT form INTO v_form FROM public.students WHERE id = NEW.student_id;
    END IF;

    -- Get total count of results for this specific class cohort
    SELECT COUNT(*) INTO v_count
    FROM public.results r
    JOIN public.students s ON r.student_id = s.id
    WHERE r.school_id = v_school_id
      AND r.academic_year = v_academic_year
      AND r.term = v_term
      AND s.form = v_form;

    -- Reset ranks depending on standard JCE or MSCE criteria
    IF v_form IN ('Form 1', 'Form 2') THEN
        -- JCE Rank: Highest Total Marks gets 1st position (Rank DESC)
        FOR v_rec IN 
            SELECT r.id
            FROM public.results r
            JOIN public.students s ON r.student_id = s.id
            WHERE r.school_id = v_school_id
              AND r.academic_year = v_academic_year
              AND r.term = v_term
              AND s.form = v_form
            ORDER BY r.total_marks DESC, s.last_name ASC, s.first_name ASC
        LOOP
            UPDATE public.results 
            SET position = v_rank, out_of = v_count 
            WHERE id = v_rec.id;
            
            v_rank := v_rank + 1;
        END LOOP;
    ELSE
        -- MSCE Rank: Lowest Total Points gets 1st position (Rank ASC)
        FOR v_rec IN 
            SELECT r.id
            FROM public.results r
            JOIN public.students s ON r.student_id = s.id
            WHERE r.school_id = v_school_id
              AND r.academic_year = v_academic_year
              AND r.term = v_term
              AND s.form = v_form
            ORDER BY r.total_points ASC, s.last_name ASC, s.first_name ASC
        LOOP
            UPDATE public.results 
            SET position = v_rank, out_of = v_count 
            WHERE id = v_rec.id;
            
            v_rank := v_rank + 1;
        END LOOP;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute after modification of results to keep position ranking fresh
CREATE TRIGGER trg_recalculate_cohort_positions
AFTER INSERT OR UPDATE OR DELETE ON public.results
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_cohort_positions();

-- ==========================================
-- 5. AUDIT LOGGING SYSTEM
-- ==========================================

CREATE OR REPLACE FUNCTION public.audit_table_modifications()
RETURNS TRIGGER AS $$
DECLARE
    v_performed_by UUID;
    v_old_json JSONB := NULL;
    v_new_json JSONB := NULL;
BEGIN
    -- Attempt to read current user from session variable (Supabase sets auth.uid())
    BEGIN
        v_performed_by := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_performed_by := NULL;
    END;

    IF TG_OP = 'DELETE' THEN
        v_old_json := to_jsonb(OLD);
    ELSIF TG_OP = 'INSERT' THEN
        v_new_json := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        v_old_json := to_jsonb(OLD);
        v_new_json := to_jsonb(NEW);
    END IF;

    INSERT INTO public.audit_logs (action, table_name, record_id, performed_by, old_data, new_data)
    VALUES (
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        v_performed_by,
        v_old_json,
        v_new_json
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach Audit triggers to Schools, Students and Results
CREATE TRIGGER audit_schools
AFTER INSERT OR UPDATE OR DELETE ON public.schools
FOR EACH ROW EXECUTE FUNCTION public.audit_table_modifications();

CREATE TRIGGER audit_students
AFTER INSERT OR UPDATE OR DELETE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.audit_table_modifications();

CREATE TRIGGER audit_results
AFTER INSERT OR UPDATE OR DELETE ON public.results
FOR EACH ROW EXECUTE FUNCTION public.audit_table_modifications();

-- ==========================================
-- 6. AUTOMATIC AUTH USER TO PUBLIC PROFILE MAPPING
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
DECLARE
    v_role TEXT := 'school_admin'; -- Default role assigned to standard registrations
    v_school_id UUID := NULL;
    v_first_name TEXT := 'Staff';
    v_last_name TEXT := 'Member';
BEGIN
    -- Extract custom metadata if provided during Supabase Auth Signup
    IF NEW.raw_user_meta_data IS NOT NULL THEN
        IF NEW.raw_user_meta_data ? 'role' THEN
            v_role := NEW.raw_user_meta_data ->> 'role';
        END IF;
        IF NEW.raw_user_meta_data ? 'school_id' THEN
            v_school_id := (NEW.raw_user_meta_data ->> 'school_id')::UUID;
        END IF;
        IF NEW.raw_user_meta_data ? 'first_name' THEN
            v_first_name := NEW.raw_user_meta_data ->> 'first_name';
        END IF;
        IF NEW.raw_user_meta_data ? 'last_name' THEN
            v_last_name := NEW.raw_user_meta_data ->> 'last_name';
        END IF;
    END IF;

    -- Make sure the first signed-up account can default to super admin as fall-back
    IF NOT EXISTS (SELECT 1 FROM public.profiles) THEN
        v_role := 'super_admin';
    END IF;

    INSERT INTO public.profiles (id, school_id, role, first_name, last_name)
    VALUES (NEW.id, v_school_id, v_role, v_first_name, v_last_name);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_profile();

-- ==========================================
-- 7. SECURITY & ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on public tables
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper security functions to check user roles inside policies
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_school_id()
RETURNS UUID AS $$
    SELECT school_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- --- Policies for Schools ---
CREATE POLICY "Super admins can manage all schools" 
ON public.schools 
FOR ALL USING (public.get_user_role() = 'super_admin');

CREATE POLICY "School admins and public can read school details" 
ON public.schools 
FOR SELECT USING (TRUE);

-- --- Policies for Profiles ---
CREATE POLICY "Super admins can manage all profiles" 
ON public.profiles 
FOR ALL USING (public.get_user_role() = 'super_admin');

CREATE POLICY "Users can read own profile" 
ON public.profiles 
FOR SELECT USING (auth.uid() = id);

-- --- Policies for Students ---
CREATE POLICY "Super admins can do everything on students" 
ON public.students 
FOR ALL USING (public.get_user_role() = 'super_admin');

CREATE POLICY "School admins can read and write own school students" 
ON public.students 
FOR ALL USING (
    public.get_user_role() = 'school_admin' 
    AND school_id = public.get_user_school_id()
);

CREATE POLICY "Anonymous search for students" 
ON public.students 
FOR SELECT USING (TRUE);

-- --- Policies for Results ---
CREATE POLICY "Super admins can do everything on results" 
ON public.results 
FOR ALL USING (public.get_user_role() = 'super_admin');

CREATE POLICY "School admins can manage own school results" 
ON public.results 
FOR ALL USING (
    public.get_user_role() = 'school_admin' 
    AND school_id = public.get_user_school_id()
);

CREATE POLICY "Students and public can only read published results" 
ON public.results 
FOR SELECT USING (is_published = TRUE);

-- --- Policies for Audit Logs ---
CREATE POLICY "Super admins can view audit logs" 
ON public.audit_logs 
FOR SELECT USING (public.get_user_role() = 'super_admin');