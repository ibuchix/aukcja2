-- Enhanced DDoS Protection System Tables

-- Distributed rate limiting table
CREATE TABLE IF NOT EXISTS public.rate_limit_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 0,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    window_end TIMESTAMPTZ NOT NULL,
    ip_address INET,
    user_agent TEXT,
    geographical_region TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Request pattern analysis table
CREATE TABLE IF NOT EXISTS public.request_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET NOT NULL,
    user_agent TEXT,
    request_fingerprint TEXT NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 1,
    time_window INTERVAL NOT NULL DEFAULT '1 minute'::interval,
    first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    suspicion_score INTEGER NOT NULL DEFAULT 0,
    blocked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DDoS events logging table
CREATE TABLE IF NOT EXISTS public.ddos_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL CHECK (event_type IN ('pattern_detected', 'rate_limit_exceeded', 'geographic_anomaly', 'burst_detected', 'emergency_triggered')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    source_ip INET,
    target_endpoint TEXT,
    request_count INTEGER,
    time_window INTERVAL,
    details JSONB,
    mitigation_applied TEXT,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- System health monitoring table
CREATE TABLE IF NOT EXISTS public.system_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    threshold_value NUMERIC,
    status TEXT NOT NULL CHECK (status IN ('healthy', 'warning', 'critical')),
    details JSONB,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Emergency mode control table
CREATE TABLE IF NOT EXISTS public.emergency_mode (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mode_type TEXT NOT NULL CHECK (mode_type IN ('full_lockdown', 'selective_blocking', 'enhanced_filtering', 'maintenance')),
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    activated_by UUID REFERENCES profiles(id),
    activation_reason TEXT,
    config JSONB,
    activated_at TIMESTAMPTZ,
    deactivated_at TIMESTAMPTZ,
    auto_deactivate_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Rate limit configuration table
CREATE TABLE IF NOT EXISTS public.rate_limit_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    endpoint_pattern TEXT NOT NULL,
    user_type TEXT NOT NULL DEFAULT 'anonymous',
    requests_per_minute INTEGER NOT NULL DEFAULT 30,
    requests_per_hour INTEGER NOT NULL DEFAULT 1000,
    requests_per_day INTEGER NOT NULL DEFAULT 10000,
    burst_limit INTEGER NOT NULL DEFAULT 5,
    window_size INTERVAL NOT NULL DEFAULT '1 minute'::interval,
    geographic_restrictions JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_limit_entries_identifier ON public.rate_limit_entries(identifier, endpoint, window_end);
CREATE INDEX IF NOT EXISTS idx_rate_limit_entries_window ON public.rate_limit_entries(window_start, window_end);
CREATE INDEX IF NOT EXISTS idx_rate_limit_entries_ip ON public.rate_limit_entries(ip_address, window_end);

CREATE INDEX IF NOT EXISTS idx_request_patterns_ip ON public.request_patterns(ip_address, last_seen);
CREATE INDEX IF NOT EXISTS idx_request_patterns_fingerprint ON public.request_patterns(request_fingerprint);
CREATE INDEX IF NOT EXISTS idx_request_patterns_suspicion ON public.request_patterns(suspicion_score DESC, last_seen DESC);

CREATE INDEX IF NOT EXISTS idx_ddos_events_created_at ON public.ddos_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ddos_events_source_ip ON public.ddos_events(source_ip, created_at);
CREATE INDEX IF NOT EXISTS idx_ddos_events_severity ON public.ddos_events(severity, resolved);

CREATE INDEX IF NOT EXISTS idx_system_health_recorded_at ON public.system_health(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_health_metric ON public.system_health(metric_name, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_emergency_mode_active ON public.emergency_mode(is_active, mode_type);

-- Enhanced rate limiting function with distributed storage
CREATE OR REPLACE FUNCTION public.check_distributed_rate_limit(
    p_identifier TEXT,
    p_endpoint TEXT,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_requests_per_minute INTEGER DEFAULT 30,
    p_burst_limit INTEGER DEFAULT 5
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_window_start TIMESTAMPTZ;
    v_current_window_end TIMESTAMPTZ;
    v_current_count INTEGER;
    v_burst_count INTEGER;
    v_entry_id UUID;
    v_geographical_region TEXT;
    v_is_allowed BOOLEAN := TRUE;
    v_retry_after INTEGER := 0;
BEGIN
    -- Calculate current time window
    v_current_window_start := DATE_TRUNC('minute', NOW());
    v_current_window_end := v_current_window_start + INTERVAL '1 minute';
    
    -- Simple geographical detection (placeholder for more sophisticated detection)
    v_geographical_region := 'unknown';
    
    -- Check current rate limit entry
    SELECT id, request_count INTO v_entry_id, v_current_count
    FROM public.rate_limit_entries
    WHERE identifier = p_identifier 
        AND endpoint = p_endpoint
        AND window_start = v_current_window_start
        AND window_end = v_current_window_end;
    
    -- Create or update rate limit entry
    IF v_entry_id IS NULL THEN
        INSERT INTO public.rate_limit_entries (
            identifier, endpoint, request_count, window_start, window_end,
            ip_address, user_agent, geographical_region
        ) VALUES (
            p_identifier, p_endpoint, 1, v_current_window_start, v_current_window_end,
            p_ip_address, p_user_agent, v_geographical_region
        ) RETURNING id INTO v_entry_id;
        v_current_count := 1;
    ELSE
        UPDATE public.rate_limit_entries 
        SET request_count = request_count + 1,
            updated_at = NOW()
        WHERE id = v_entry_id;
        v_current_count := v_current_count + 1;
    END IF;
    
    -- Check burst protection (requests within 10 seconds)
    SELECT COALESCE(SUM(request_count), 0) INTO v_burst_count
    FROM public.rate_limit_entries
    WHERE identifier = p_identifier 
        AND endpoint = p_endpoint
        AND ip_address = p_ip_address
        AND window_start >= NOW() - INTERVAL '10 seconds';
    
    -- Determine if request should be allowed
    IF v_current_count > p_requests_per_minute THEN
        v_is_allowed := FALSE;
        v_retry_after := EXTRACT(EPOCH FROM (v_current_window_end - NOW()))::INTEGER;
        
        -- Log rate limit exceeded event
        INSERT INTO public.ddos_events (
            event_type, severity, source_ip, target_endpoint,
            request_count, time_window, details
        ) VALUES (
            'rate_limit_exceeded', 'medium', p_ip_address, p_endpoint,
            v_current_count, INTERVAL '1 minute',
            jsonb_build_object('identifier', p_identifier, 'limit', p_requests_per_minute)
        );
    ELSIF v_burst_count > p_burst_limit THEN
        v_is_allowed := FALSE;
        v_retry_after := 10;
        
        -- Log burst detected event
        INSERT INTO public.ddos_events (
            event_type, severity, source_ip, target_endpoint,
            request_count, time_window, details
        ) VALUES (
            'burst_detected', 'high', p_ip_address, p_endpoint,
            v_burst_count, INTERVAL '10 seconds',
            jsonb_build_object('identifier', p_identifier, 'burst_limit', p_burst_limit)
        );
    END IF;
    
    -- Cleanup old entries (older than 1 hour)
    DELETE FROM public.rate_limit_entries
    WHERE window_end < NOW() - INTERVAL '1 hour';
    
    RETURN jsonb_build_object(
        'allowed', v_is_allowed,
        'current_count', v_current_count,
        'burst_count', v_burst_count,
        'retry_after', v_retry_after,
        'window_start', v_current_window_start,
        'window_end', v_current_window_end
    );
END;
$$;

-- Request pattern analysis function
CREATE OR REPLACE FUNCTION public.analyze_request_pattern(
    p_ip_address INET,
    p_user_agent TEXT,
    p_request_path TEXT,
    p_request_method TEXT DEFAULT 'GET'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_fingerprint TEXT;
    v_pattern_id UUID;
    v_suspicion_score INTEGER := 0;
    v_should_block BOOLEAN := FALSE;
    v_request_count INTEGER;
    v_time_since_first INTERVAL;
BEGIN
    -- Generate request fingerprint
    v_fingerprint := MD5(p_request_path || ':' || p_request_method || ':' || COALESCE(p_user_agent, ''));
    
    -- Check existing pattern
    SELECT id, request_count, (NOW() - first_seen) INTO v_pattern_id, v_request_count, v_time_since_first
    FROM public.request_patterns
    WHERE ip_address = p_ip_address AND request_fingerprint = v_fingerprint
        AND last_seen > NOW() - INTERVAL '1 hour';
    
    IF v_pattern_id IS NULL THEN
        -- Create new pattern
        INSERT INTO public.request_patterns (
            ip_address, user_agent, request_fingerprint, request_count,
            first_seen, last_seen
        ) VALUES (
            p_ip_address, p_user_agent, v_fingerprint, 1,
            NOW(), NOW()
        ) RETURNING id INTO v_pattern_id;
        v_request_count := 1;
        v_time_since_first := INTERVAL '0';
    ELSE
        -- Update existing pattern
        UPDATE public.request_patterns 
        SET request_count = request_count + 1,
            last_seen = NOW(),
            updated_at = NOW()
        WHERE id = v_pattern_id;
        v_request_count := v_request_count + 1;
    END IF;
    
    -- Calculate suspicion score
    v_suspicion_score := 0;
    
    -- High frequency requests
    IF v_request_count > 100 AND v_time_since_first < INTERVAL '5 minutes' THEN
        v_suspicion_score := v_suspicion_score + 50;
    ELSIF v_request_count > 50 AND v_time_since_first < INTERVAL '2 minutes' THEN
        v_suspicion_score := v_suspicion_score + 30;
    END IF;
    
    -- Suspicious user agent patterns
    IF p_user_agent ~* '(bot|crawler|spider|scraper|curl|wget|python|script)' THEN
        v_suspicion_score := v_suspicion_score + 20;
    END IF;
    
    -- Identical request patterns
    IF v_request_count > 20 AND v_time_since_first < INTERVAL '1 minute' THEN
        v_suspicion_score := v_suspicion_score + 40;
    END IF;
    
    -- Update suspicion score
    UPDATE public.request_patterns 
    SET suspicion_score = v_suspicion_score,
        blocked = CASE WHEN v_suspicion_score >= 70 THEN TRUE ELSE blocked END
    WHERE id = v_pattern_id;
    
    -- Check if should block
    v_should_block := v_suspicion_score >= 70;
    
    -- Log suspicious patterns
    IF v_suspicion_score >= 50 THEN
        INSERT INTO public.ddos_events (
            event_type, severity, source_ip, target_endpoint,
            details
        ) VALUES (
            'pattern_detected',
            CASE WHEN v_suspicion_score >= 70 THEN 'high' ELSE 'medium' END,
            p_ip_address, p_request_path,
            jsonb_build_object(
                'suspicion_score', v_suspicion_score,
                'request_count', v_request_count,
                'time_span', EXTRACT(EPOCH FROM v_time_since_first),
                'user_agent', p_user_agent,
                'fingerprint', v_fingerprint
            )
        );
    END IF;
    
    RETURN jsonb_build_object(
        'suspicion_score', v_suspicion_score,
        'should_block', v_should_block,
        'request_count', v_request_count,
        'pattern_id', v_pattern_id
    );
END;
$$;

-- System health monitoring function
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
    
    -- Cleanup old metrics (keep last 24 hours)
    DELETE FROM public.system_health
    WHERE recorded_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Emergency mode activation function
CREATE OR REPLACE FUNCTION public.activate_emergency_mode(
    p_mode_type TEXT,
    p_activated_by UUID,
    p_reason TEXT,
    p_config JSONB DEFAULT NULL,
    p_auto_deactivate_minutes INTEGER DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_emergency_id UUID;
    v_auto_deactivate_at TIMESTAMPTZ;
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_activated_by AND role = 'admin') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only admins can activate emergency mode');
    END IF;
    
    -- Calculate auto-deactivation time
    IF p_auto_deactivate_minutes IS NOT NULL THEN
        v_auto_deactivate_at := NOW() + (p_auto_deactivate_minutes || ' minutes')::INTERVAL;
    END IF;
    
    -- Deactivate any existing emergency modes
    UPDATE public.emergency_mode 
    SET is_active = FALSE, deactivated_at = NOW()
    WHERE is_active = TRUE;
    
    -- Create new emergency mode entry
    INSERT INTO public.emergency_mode (
        mode_type, is_active, activated_by, activation_reason,
        config, activated_at, auto_deactivate_at
    ) VALUES (
        p_mode_type, TRUE, p_activated_by, p_reason,
        p_config, NOW(), v_auto_deactivate_at
    ) RETURNING id INTO v_emergency_id;
    
    -- Log emergency activation
    INSERT INTO public.ddos_events (
        event_type, severity, details
    ) VALUES (
        'emergency_triggered', 'critical',
        jsonb_build_object(
            'mode_type', p_mode_type,
            'activated_by', p_activated_by,
            'reason', p_reason,
            'emergency_id', v_emergency_id
        )
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'emergency_id', v_emergency_id,
        'mode_type', p_mode_type,
        'activated_at', NOW(),
        'auto_deactivate_at', v_auto_deactivate_at
    );
END;
$$;

-- Insert default rate limit configurations
INSERT INTO public.rate_limit_configs (endpoint_pattern, user_type, requests_per_minute, requests_per_hour, requests_per_day) VALUES
('/api/auth/*', 'anonymous', 5, 50, 200),
('/api/bids/*', 'authenticated', 60, 500, 2000),
('/api/cars/*', 'anonymous', 30, 1000, 5000),
('/api/upload/*', 'authenticated', 10, 100, 500),
('/*', 'anonymous', 30, 1000, 10000)
ON CONFLICT DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE public.rate_limit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ddos_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_mode ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_configs ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin access
CREATE POLICY "Admins can view all rate limit entries" ON public.rate_limit_entries FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Admins can view all request patterns" ON public.request_patterns FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Admins can view all DDoS events" ON public.ddos_events FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Admins can view all system health" ON public.system_health FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Admins can manage emergency mode" ON public.emergency_mode FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

CREATE POLICY "Admins can manage rate limit configs" ON public.rate_limit_configs FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);