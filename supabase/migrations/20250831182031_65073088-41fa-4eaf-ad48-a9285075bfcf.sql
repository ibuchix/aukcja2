-- Phase 1: Enable RLS on auction_results table (policies already exist)
ALTER TABLE public.auction_results ENABLE ROW LEVEL SECURITY;

-- Phase 2: Create system_health table if it doesn't exist and set up security
CREATE TABLE IF NOT EXISTS public.system_health (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  service_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
  metrics JSONB DEFAULT '{}',
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on system_health
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;

-- Create admin-only RLS policies for system_health
CREATE POLICY "Admin full access to system_health"
ON public.system_health
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'::user_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'::user_role
  )
);

-- Service role bypass for system monitoring
CREATE POLICY "Service role system_health access"
ON public.system_health
FOR ALL
USING (true)
WITH CHECK (true);