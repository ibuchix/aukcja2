
-- Create dealer_documents table for storing dealer document metadata
CREATE TABLE IF NOT EXISTS public.dealer_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  dealer_id uuid NOT NULL REFERENCES public.dealers(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  document_type text NOT NULL,
  uploaded_at timestamp with time zone DEFAULT now() NOT NULL,
  verified boolean DEFAULT false,
  verification_notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create storage bucket for dealer documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dealer-documents', 'dealer-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for dealer documents table
ALTER TABLE public.dealer_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Dealers can view their own documents
CREATE POLICY "Dealers can view own documents" ON public.dealer_documents
  FOR SELECT 
  USING (dealer_id IN (
    SELECT id FROM public.dealers WHERE user_id = auth.uid()
  ));

-- Policy: Dealers can insert their own documents
CREATE POLICY "Dealers can insert own documents" ON public.dealer_documents
  FOR INSERT 
  WITH CHECK (dealer_id IN (
    SELECT id FROM public.dealers WHERE user_id = auth.uid()
  ));

-- Policy: Admins can view all documents
CREATE POLICY "Admins can view all documents" ON public.dealer_documents
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create storage policies for dealer-documents bucket
-- Policy: Dealers can upload to their own folder
CREATE POLICY "Dealers can upload documents" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'dealer-documents' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Dealers can view their own documents
CREATE POLICY "Dealers can view own documents" ON storage.objects
  FOR SELECT 
  USING (
    bucket_id = 'dealer-documents' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Admins can view all dealer documents
CREATE POLICY "Admins can view all dealer documents" ON storage.objects
  FOR SELECT 
  USING (
    bucket_id = 'dealer-documents' AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_dealer_documents_dealer_id ON public.dealer_documents(dealer_id);
CREATE INDEX IF NOT EXISTS idx_dealer_documents_document_type ON public.dealer_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_dealer_documents_uploaded_at ON public.dealer_documents(uploaded_at);
