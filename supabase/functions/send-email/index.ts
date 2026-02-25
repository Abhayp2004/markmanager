import React from 'npm:react@18.3.1'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { WelcomeEmail } from './_templates/welcome.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not configured')
    }

    const resend = new Resend(resendApiKey)
    const { type, email } = await req.json()

    if (!email) {
      throw new Error('Email is required')
    }

    let subject = ''
    let html = ''

    switch (type) {
      case 'welcome': {
        subject = 'Welcome to MarkManager! 🎉'
        html = await renderAsync(
          React.createElement(WelcomeEmail, { email })
        )
        break
      }
      default:
        throw new Error(`Unknown email type: ${type}`)
    }

    const { error } = await resend.emails.send({
      from: 'MarkManager <onboarding@resend.dev>',
      to: [email],
      subject,
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      throw new Error(error.message)
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (error) {
    console.error('Error in send-email:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
