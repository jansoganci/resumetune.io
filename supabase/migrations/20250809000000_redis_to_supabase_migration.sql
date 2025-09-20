-- ================================================================
-- REDIS TO SUPABASE MIGRATION - STEP 1: DATABASE SCHEMA SETUP
-- ================================================================
-- Bu migration dosyası Redis yerine Supabase kullanmak için
-- gerekli tüm tabloları ve fonksiyonları oluşturur.

-- ================================================================
-- 1. DAILY USAGE TABLE
-- ================================================================
-- Kullanıcıların günlük AI çağrı sayısını takip eder
-- Redis'teki "quota:daily:{userId}:{date}" anahtarının yerine geçer

CREATE TABLE IF NOT EXISTS public.daily_usage (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    usage_date DATE NOT NULL,
    ai_calls_count INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Primary key
    CONSTRAINT daily_usage_pkey PRIMARY KEY (id),
    
    -- Foreign key to users table
    CONSTRAINT daily_usage_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Unique constraint (bir kullanıcı için günde bir kayıt)
    CONSTRAINT daily_usage_user_date_unique 
        UNIQUE (user_id, usage_date),
    
    -- Check constraints
    CONSTRAINT daily_usage_ai_calls_positive 
        CHECK (ai_calls_count >= 0)
) TABLESPACE pg_default;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_id 
    ON public.daily_usage USING btree (user_id);
    
CREATE INDEX IF NOT EXISTS idx_daily_usage_date 
    ON public.daily_usage USING btree (usage_date DESC);
    
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_date 
    ON public.daily_usage USING btree (user_id, usage_date);

-- ================================================================
-- 2. RATE LIMITS TABLE  
-- ================================================================
-- IP ve endpoint bazlı rate limiting için
-- Redis'teki "rate_limit:ip:{ip}" ve "rate_limit:endpoint:{endpoint}" yerine

CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL,  -- IP address, userId, endpoint, etc.
    limit_type VARCHAR(50) NOT NULL,   -- 'ip', 'user', 'endpoint', 'global'
    endpoint VARCHAR(255),             -- API endpoint (isteğe bağlı)
    current_count INTEGER NOT NULL DEFAULT 0,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    window_duration_minutes INTEGER NOT NULL DEFAULT 60, -- Varsayılan 1 saat
    max_requests INTEGER NOT NULL DEFAULT 100,
    
    -- Primary key
    CONSTRAINT rate_limits_pkey PRIMARY KEY (id),
    
    -- Unique constraint
    CONSTRAINT rate_limits_identifier_type_endpoint_unique 
        UNIQUE (identifier, limit_type, endpoint, window_start),
    
    -- Check constraints
    CONSTRAINT rate_limits_count_positive 
        CHECK (current_count >= 0),
    CONSTRAINT rate_limits_max_positive 
        CHECK (max_requests > 0),
    CONSTRAINT rate_limits_duration_positive 
        CHECK (window_duration_minutes > 0)
) TABLESPACE pg_default;

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier 
    ON public.rate_limits USING btree (identifier);
    
CREATE INDEX IF NOT EXISTS idx_rate_limits_type 
    ON public.rate_limits USING btree (limit_type);
    
CREATE INDEX IF NOT EXISTS idx_rate_limits_window 
    ON public.rate_limits USING btree (window_start DESC);
    
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup 
    ON public.rate_limits USING btree (identifier, limit_type, endpoint);

-- ================================================================
-- 3. WEBHOOK CACHE TABLE
-- ================================================================
-- Stripe webhook idempotency için
-- Redis'teki webhook cache'in yerine geçer

CREATE TABLE IF NOT EXISTS public.webhook_cache (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    idempotency_key VARCHAR(255) NOT NULL,
    webhook_event_id VARCHAR(255) NOT NULL,
    webhook_type VARCHAR(100) NOT NULL, -- 'stripe', 'other'
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    response_status INTEGER,            -- HTTP status code
    response_data JSONB,               -- İsteğe bağlı response data
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Primary key
    CONSTRAINT webhook_cache_pkey PRIMARY KEY (id),
    
    -- Unique constraint (aynı idempotency key sadece bir kez)
    CONSTRAINT webhook_cache_idempotency_unique 
        UNIQUE (idempotency_key),
    
    -- Check constraints
    CONSTRAINT webhook_cache_status_valid 
        CHECK (response_status >= 100 AND response_status <= 599)
) TABLESPACE pg_default;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhook_cache_key 
    ON public.webhook_cache USING btree (idempotency_key);
    
CREATE INDEX IF NOT EXISTS idx_webhook_cache_event_id 
    ON public.webhook_cache USING btree (webhook_event_id);
    
CREATE INDEX IF NOT EXISTS idx_webhook_cache_expires 
    ON public.webhook_cache USING btree (expires_at);

-- Auto-cleanup old webhook cache entries
CREATE INDEX IF NOT EXISTS idx_webhook_cache_cleanup 
    ON public.webhook_cache USING btree (expires_at) 
    WHERE expires_at < NOW();

-- ================================================================
-- 4. RPC FUNCTIONS
-- ================================================================

-- ----------------------------------------------------------------
-- 4.1 INCREMENT DAILY USAGE
-- ----------------------------------------------------------------
-- Redis'teki INCR komutu yerine
-- Günlük kullanımı artırır, yoksa oluşturur

CREATE OR REPLACE FUNCTION public.increment_daily_usage(
    p_user_id UUID,
    p_usage_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_count INTEGER;
BEGIN
    -- Upsert: varsa artır, yoksa oluştur
    INSERT INTO public.daily_usage (user_id, usage_date, ai_calls_count)
    VALUES (p_user_id, p_usage_date, 1)
    ON CONFLICT (user_id, usage_date)
    DO UPDATE SET 
        ai_calls_count = daily_usage.ai_calls_count + 1,
        last_updated = NOW()
    RETURNING ai_calls_count INTO new_count;
    
    RETURN new_count;
END;
$$;

-- ----------------------------------------------------------------
-- 4.2 GET DAILY USAGE
-- ----------------------------------------------------------------
-- Kullanıcının bugünkü kullanımını getirir

CREATE OR REPLACE FUNCTION public.get_daily_usage(
    p_user_id UUID,
    p_usage_date DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    usage_count INTEGER;
BEGIN
    SELECT ai_calls_count 
    INTO usage_count
    FROM public.daily_usage
    WHERE user_id = p_user_id 
      AND usage_date = p_usage_date;
    
    -- Kayıt yoksa 0 döndür
    RETURN COALESCE(usage_count, 0);
END;
$$;

-- ----------------------------------------------------------------
-- 4.3 CHECK AND INCREMENT RATE LIMIT
-- ----------------------------------------------------------------
-- Redis'teki rate limiting logic'ini Supabase'e taşır

CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
    p_identifier VARCHAR(255),
    p_limit_type VARCHAR(50),
    p_endpoint VARCHAR(255) DEFAULT NULL,
    p_max_requests INTEGER DEFAULT 100,
    p_window_minutes INTEGER DEFAULT 60
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_window_start TIMESTAMP WITH TIME ZONE;
    current_count INTEGER;
    is_allowed BOOLEAN;
    result JSONB;
BEGIN
    -- Current window başlangıcını hesapla
    current_window_start := date_trunc('hour', NOW()) + 
        (EXTRACT(minute FROM NOW())::INTEGER / p_window_minutes) * 
        (p_window_minutes || ' minutes')::INTERVAL;
    
    -- Upsert: mevcut window'da kayıt var mı kontrol et
    INSERT INTO public.rate_limits (
        identifier, 
        limit_type, 
        endpoint, 
        current_count, 
        window_start, 
        window_duration_minutes, 
        max_requests
    )
    VALUES (
        p_identifier, 
        p_limit_type, 
        p_endpoint, 
        1, 
        current_window_start, 
        p_window_minutes, 
        p_max_requests
    )
    ON CONFLICT (identifier, limit_type, endpoint, window_start)
    DO UPDATE SET 
        current_count = rate_limits.current_count + 1
    RETURNING current_count INTO current_count;
    
    -- Limit kontrolü
    is_allowed := current_count <= p_max_requests;
    
    -- Result JSON
    result := jsonb_build_object(
        'allowed', is_allowed,
        'current_count', current_count,
        'max_requests', p_max_requests,
        'window_start', current_window_start,
        'window_end', current_window_start + (p_window_minutes || ' minutes')::INTERVAL
    );
    
    RETURN result;
END;
$$;

-- ----------------------------------------------------------------
-- 4.4 UPSERT WEBHOOK CACHE
-- ----------------------------------------------------------------
-- Webhook idempotency için cache kontrol ve kayıt

CREATE OR REPLACE FUNCTION public.upsert_webhook_cache(
    p_idempotency_key VARCHAR(255),
    p_webhook_event_id VARCHAR(255),
    p_webhook_type VARCHAR(100),
    p_response_status INTEGER DEFAULT NULL,
    p_response_data JSONB DEFAULT NULL,
    p_expires_hours INTEGER DEFAULT 24
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    existing_record RECORD;
    result JSONB;
BEGIN
    -- Mevcut kaydı kontrol et
    SELECT * INTO existing_record
    FROM public.webhook_cache
    WHERE idempotency_key = p_idempotency_key
      AND expires_at > NOW();
    
    -- Eğer mevcut kayıt varsa, duplicate olarak döndür
    IF existing_record.id IS NOT NULL THEN
        result := jsonb_build_object(
            'is_duplicate', true,
            'processed_at', existing_record.processed_at,
            'response_status', existing_record.response_status
        );
        RETURN result;
    END IF;
    
    -- Yeni kayıt oluştur
    INSERT INTO public.webhook_cache (
        idempotency_key,
        webhook_event_id,
        webhook_type,
        response_status,
        response_data,
        expires_at
    )
    VALUES (
        p_idempotency_key,
        p_webhook_event_id,
        p_webhook_type,
        p_response_status,
        p_response_data,
        NOW() + (p_expires_hours || ' hours')::INTERVAL
    );
    
    result := jsonb_build_object(
        'is_duplicate', false,
        'processed_at', NOW()
    );
    
    RETURN result;
END;
$$;

-- ----------------------------------------------------------------
-- 4.5 CLEANUP OLD RECORDS
-- ----------------------------------------------------------------
-- Eski kayıtları temizlemek için

CREATE OR REPLACE FUNCTION public.cleanup_old_records()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Eski webhook cache kayıtlarını sil
    DELETE FROM public.webhook_cache 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Eski rate limit kayıtlarını sil (7 gün öncesi)
    DELETE FROM public.rate_limits 
    WHERE window_start < NOW() - INTERVAL '7 days';
    
    -- Eski daily usage kayıtlarını sil (90 gün öncesi)
    DELETE FROM public.daily_usage 
    WHERE usage_date < CURRENT_DATE - INTERVAL '90 days';
    
    RETURN deleted_count;
END;
$$;

-- ================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ================================================================

-- daily_usage table için RLS
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily usage" 
    ON public.daily_usage FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily usage" 
    ON public.daily_usage FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily usage" 
    ON public.daily_usage FOR UPDATE 
    USING (auth.uid() = user_id);

-- rate_limits ve webhook_cache için service role erişimi
-- (Bu tablolar genellikle backend tarafından kullanılır)

-- ================================================================
-- 6. GRANTS
-- ================================================================

-- Service role'e gerekli izinleri ver
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON public.daily_usage TO service_role;
GRANT ALL ON public.rate_limits TO service_role;
GRANT ALL ON public.webhook_cache TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Anon role'e sadece read-only bazı izinler
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.daily_usage TO anon;

-- ================================================================
-- 7. TRIGGERS (İsteğe bağlı)
-- ================================================================

-- Auto-cleanup trigger (her gün çalışır)
CREATE OR REPLACE FUNCTION trigger_cleanup_old_records()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Background'da cleanup çalıştır
    PERFORM pg_notify('cleanup_channel', 'run_cleanup');
    RETURN NULL;
END;
$$;

-- Trigger'ı webhook_cache'e ekle (yeni kayıt geldiğinde cleanup tetikle)
CREATE TRIGGER auto_cleanup_trigger
    AFTER INSERT ON public.webhook_cache
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_cleanup_old_records();

-- ================================================================
-- 8. SAMPLE DATA (TESTING İÇİN)
-- ================================================================

-- Test kullanıcısı için sample data
-- INSERT INTO public.daily_usage (user_id, usage_date, ai_calls_count)
-- VALUES ('88fa0c51-1467-4fcb-8474-9d945eb7892e', CURRENT_DATE, 2);

-- ================================================================
-- MIGRATION COMPLETE!
-- ================================================================
-- Bu migration'dan sonra Redis yerine Supabase kullanılabilir:
-- 
-- 1. daily_usage tablosu → Redis "quota:daily:{userId}:{date}" yerine
-- 2. rate_limits tablosu → Redis rate limiting yerine  
-- 3. webhook_cache tablosu → Redis webhook cache yerine
-- 4. RPC fonksiyonları → Redis komutları yerine
--
-- Sonraki adım: Backend kodlarını bu yeni yapıya göre güncelle
-- ================================================================
