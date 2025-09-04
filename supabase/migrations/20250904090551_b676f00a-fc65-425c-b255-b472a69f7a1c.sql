-- Enhanced DDoS Protection System Tables - Fixed Version

-- First, let's fix any existing system_health table issues
DROP TABLE IF EXISTS public.system_health CASCADE;

-- Recreate system health table with correct column names
CREATE TABLE IF NOT EXISTS public.system_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    threshold_value NUMERIC,
    status TEXT NOT NULL CHECK (status IN ('healthy', 'warning', 'critical')),
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System health monitoring function - Fixed
CREATE OR REPLACE FUNCTION public.record_system_health_metric(
    p_metric_name TEXT,
    p_metric_value NUMERIC,
    p_threshold_value NUMERIC DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_status TEXT;
BEGIN
    -- Determine status based on threshold
    IF p_threshold_value IS NOT NULL THEN
        IF p_metric_value <= p_threshold_value THEN
            v_status := 'healthy';
        ELSIF p_metric_value <= p_threshold_value * 1.2 THEN
            v_status := 'warning';
        ELSE
            v_status := 'critical';
        END IF;
    ELSE
        v_status := 'healthy';
    END IF;
    
    -- Insert health metric
    INSERT INTO public.system_health (
        metric_name, metric_value, threshold_value, status
    ) VALUES (
        p_metric_name, p_metric_value, p_threshold_value, v_status
    );
    
    -- Cleanup old metrics (keep last 24 hours) - Fixed column reference
    DELETE FROM public.system_health
    WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Create corrected indexes
CREATE INDEX IF NOT EXISTS idx_system_health_created_at ON public.system_health(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_health_metric ON public.system_health(metric_name, created_at DESC);

-- Enable RLS
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;

-- RLS policy for system health
CREATE POLICY "Admins can view all system health" ON public.system_health FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);