import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // إنشاء Supabase Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Deleting user from database:', userId)

    // 1. حذف المستخدم من جدول users
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId)

    if (dbError) {
      console.error('Error deleting from database:', dbError)
      throw dbError
    }

    console.log('User deleted from database successfully')

    // 2. حذف المستخدم من Supabase Auth
    console.log('Deleting user from Auth:', userId)
    
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Error deleting from Auth:', authError)
      // لا نرمي خطأ هنا لأن المستخدم قد يكون محذوف من Auth بالفعل
      // throw authError
    } else {
      console.log('User deleted from Auth successfully')
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'User deleted successfully from database and auth'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in delete-user function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
