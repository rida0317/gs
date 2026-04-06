-- FINAL SUPABASE SCHEMA - FIXED CLASSES TABLE
-- Includes room_id, teacher_id, max_students, subjects, and schedule for classes

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. CLEANUP
DROP TABLE IF EXISTS public.monthly_payments CASCADE;
DROP TABLE IF EXISTS public.payment_records CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.custom_levels CASCADE;
DROP TABLE IF EXISTS public.custom_subjects CASCADE;
DROP TABLE IF EXISTS public.stock_loans CASCADE;
DROP TABLE IF EXISTS public.stock_items CASCADE;
DROP TABLE IF EXISTS public.replacements CASCADE;
DROP TABLE IF EXISTS public.absences CASCADE;
DROP TABLE IF EXISTS public.grades CASCADE;
DROP TABLE IF EXISTS public.timetables CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.classes CASCADE;
DROP TABLE IF EXISTS public.salles CASCADE;
DROP TABLE IF EXISTS public.teachers CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.schools CASCADE;

-- 2. SCHOOLS
CREATE TABLE public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    academic_year TEXT DEFAULT '2023-2024',
    address TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. USERS (Authentication & Password Management)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'teacher', 'student', 'parent')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. SUBJECTS
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(school_id, name)
);

-- 4. TEACHERS
CREATE TABLE public.teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    max_hours_per_week INTEGER DEFAULT 24,
    subjects TEXT[], 
    levels TEXT[],
    is_vacataire BOOLEAN DEFAULT false,
    availability JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(school_id, full_name)
);

-- 5. CLASSES
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    level TEXT,
    room_id UUID,
    teacher_id UUID,
    max_students INTEGER DEFAULT 40,
    subjects JSONB DEFAULT '[]'::jsonb,
    schedule JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(school_id, name)
);

-- 6. STUDENTS
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    code_massar TEXT,
    parent_phone TEXT,
    academic_year TEXT DEFAULT '2023-2024',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(school_id, full_name, academic_year)
);

-- 7. SALLES
CREATE TABLE public.salles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    capacity INTEGER DEFAULT 30,
    type TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(school_id, name)
);

-- 8. TIMETABLES
CREATE TABLE public.timetables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
    academic_year TEXT DEFAULT '2023-2024',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(school_id, class_id, academic_year)
);

-- 9. GRADES
CREATE TABLE public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    exam_type TEXT NOT NULL,
    grade NUMERIC NOT NULL,
    academic_year TEXT DEFAULT '2023-2024',
    coefficient INTEGER DEFAULT 1,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    comment TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 10. ABSENCES
CREATE TABLE public.absences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    period TEXT,
    reason TEXT,
    is_justified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 11. PAYMENTS
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    paid_amount NUMERIC DEFAULT 0,
    remaining_amount NUMERIC NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('inscription', 'mensualite', 'transport', 'cantine', 'autre')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('paid', 'partial', 'pending', 'overdue', 'cancelled')),
    due_date DATE NOT NULL,
    payment_date DATE,
    academic_year TEXT DEFAULT '2023-2024',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 12. PAYMENT RECORDS (Transactions)
CREATE TABLE public.payment_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'check', 'bank_transfer', 'online')),
    receipt_number TEXT UNIQUE NOT NULL,
    notes TEXT,
    recorded_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 13. MONTHLY PAYMENTS (Scolarité)
CREATE TABLE public.monthly_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    academic_year TEXT DEFAULT '2023-2024',
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    base_amount NUMERIC NOT NULL,
    transport_amount NUMERIC DEFAULT 0,
    discount NUMERIC DEFAULT 0,
    paid_amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'partial', 'exempt')),
    payment_date TIMESTAMP WITH TIME ZONE,
    payment_method TEXT CHECK (payment_method IN ('especes', 'cheque', 'virement')),
    receipt_number TEXT,
    notes TEXT,
    paid_by UUID,
    paid_by_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(student_id, academic_year, month)
);

-- 14. REPLACEMENTS
CREATE TABLE public.replacements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
    replacement_teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    subject TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 12. STOCK ITEMS
CREATE TABLE public.stock_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    type TEXT,
    quantity INTEGER DEFAULT 0,
    min_quantity INTEGER DEFAULT 5,
    unit TEXT,
    price NUMERIC,
    location TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 13. STOCK LOANS
CREATE TABLE public.stock_loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.stock_items(id) ON DELETE CASCADE,
    student_id UUID,
    student_name TEXT,
    quantity INTEGER DEFAULT 1,
    loan_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expected_return_date DATE,
    actual_return_date TIMESTAMP WITH TIME ZONE,
    return_status TEXT DEFAULT 'pending',
    condition TEXT,
    notes TEXT
);

-- 14. CUSTOM SUBJECTS & LEVELS
CREATE TABLE public.custom_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.custom_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    order_index INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 15. INSERT THE DEFAULT SCHOOL
INSERT INTO public.schools (id, name, academic_year)
VALUES ('00000000-0000-0000-0000-000000000001', 'Ecole de Test', '2023-2024')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 16. INSERT DEFAULT ADMIN USER (password: admin123)
INSERT INTO public.users (id, school_id, email, password_hash, full_name, role)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000001',
    'admin@school.com',
    crypt('admin123', gen_salt('bf')),
    'Admin User',
    'admin'
)
ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name;

-- 17. ENABLE RLS & POLICIES
DO $$ 
DECLARE 
    t TEXT;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Public Access" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Public Access" ON public.%I FOR ALL USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;
