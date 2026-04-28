import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cufqpiaewagbqeiiooom.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1ZnFwaWFld2FnYnFlaWlvb29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczOTg4NjYsImV4cCI6MjA5Mjk3NDg2Nn0.P6gPIa93MxVKp_4Z07QclpGfzZ_Srqiexa9x-0Bk74k'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
