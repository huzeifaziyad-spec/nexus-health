
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'doctor', 'patient');

-- Create user_roles table (roles MUST be separate from profiles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'patient',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  address TEXT,
  specialization TEXT, -- for doctors
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  appointment_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create medical_records table
CREATE TABLE public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  diagnosis TEXT,
  treatment TEXT,
  notes TEXT,
  record_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

-- Create prescriptions table
CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  medication TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT,
  duration TEXT,
  notes TEXT,
  prescribed_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- Security definer helper functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_profile_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Trigger to auto-create profile and role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'patient'));
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS Policies for user_roles
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Doctors can view patient profiles" ON public.profiles FOR SELECT USING (
  public.has_role(auth.uid(), 'doctor') AND id IN (
    SELECT patient_id FROM public.appointments WHERE doctor_id = public.get_profile_id(auth.uid())
  )
);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage profiles" ON public.profiles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for appointments
CREATE POLICY "Patients can view own appointments" ON public.appointments FOR SELECT USING (patient_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Doctors can view own appointments" ON public.appointments FOR SELECT USING (doctor_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Admins can manage appointments" ON public.appointments FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Doctors can create appointments" ON public.appointments FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'doctor') OR public.has_role(auth.uid(), 'patient'));
CREATE POLICY "Doctors can update own appointments" ON public.appointments FOR UPDATE USING (doctor_id = public.get_profile_id(auth.uid()));

-- RLS Policies for medical_records
CREATE POLICY "Patients can view own records" ON public.medical_records FOR SELECT USING (patient_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Doctors can view patient records" ON public.medical_records FOR SELECT USING (
  public.has_role(auth.uid(), 'doctor') AND patient_id IN (
    SELECT patient_id FROM public.appointments WHERE doctor_id = public.get_profile_id(auth.uid())
  )
);
CREATE POLICY "Doctors can create records" ON public.medical_records FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Doctors can update records" ON public.medical_records FOR UPDATE USING (doctor_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Admins can manage records" ON public.medical_records FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for prescriptions
CREATE POLICY "Patients can view own prescriptions" ON public.prescriptions FOR SELECT USING (patient_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Doctors can view own prescriptions" ON public.prescriptions FOR SELECT USING (doctor_id = public.get_profile_id(auth.uid()));
CREATE POLICY "Doctors can create prescriptions" ON public.prescriptions FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'doctor'));
CREATE POLICY "Admins can manage prescriptions" ON public.prescriptions FOR ALL USING (public.has_role(auth.uid(), 'admin'));
