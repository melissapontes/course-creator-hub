/* eslint-disable @typescript-eslint/no-explicit-any */
// Import apenas o Client do Supabase (use a versão fixa para evitar erros)
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// MUDANÇA PRINCIPAL: Usamos Deno.serve nativo (sem importação de 'serve')
Deno.serve(async (req) => {
  // 1. Tratamento de CORS (Pre-flight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Criar cliente Supabase
    // O auth header é repassado automaticamente para identificar o usuário que chamou
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 3. Verificar Usuário
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      throw new Error('Usuário não autenticado')
    }

    // 4. Receber dados do Body
    const { cartItems, cardToken, installments, customerData } = await req.json()
    
    if (!cartItems || cartItems.length === 0) {
      throw new Error('Carrinho vazio')
    }

    // 5. Calcular valor total (Recalcula no back-end para segurança)
    let amountInCents = 0
    const items = cartItems.map((item: any) => {
      // Garante que é número e converte para centavos
      const price = Math.round(Number(item.course.price) * 100)
      amountInCents += price
      return {
        amount: price,
        description: item.course.title.substring(0, 250), // Limite de caracteres do Pagar.me
        quantity: 1,
        code: String(item.course.id)
      }
    })

    // 6. Configurar Split (Se tiver recebedor configurado)
    const recipientId = Deno.env.get('PAGARME_RECIPIENT_ID')
    const splitRules = recipientId ? [
      {
        recipient_id: recipientId,
        percentage: 100, // 100% do valor vai para este recebedor
        liable: true,    // Assume risco de chargeback
        charge_processing_fee: true // Paga as taxas
      }
    ] : []

    // 7. Montar Payload do Pedido Pagar.me V5
    const payload = {
      items,
      customer: {
        name: customerData.name,
        email: user.email,
        type: 'individual',
        document: customerData.document.replace(/\D/g, ''), // Remove pontos/traços do CPF
        phones: {
          mobile_phone: {
            country_code: '55',
            area_code: customerData.phone.replace(/\D/g, '').substring(0, 2),
            number: customerData.phone.replace(/\D/g, '').substring(2)
          }
        }
      },
      payments: [
        {
          payment_method: 'credit_card',
          credit_card: {
            recurrence: false,
            installments: installments || 1,
            statement_descriptor: 'CURSOS HUB',
            card_token: cardToken, // Usa o token seguro gerado no front
            card: undefined // Garante que não envia dados abertos
          },
          split: splitRules // Aplica a regra de divisão
        }
      ]
    }

    console.log('Enviando pedido para Pagar.me...')

    // 8. Enviar Request para API Pagar.me
    const response = await fetch('https://api.pagar.me/core/v5/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // A chave secreta (sk_test_...) vai aqui, codificada em Base64
        'Authorization': 'Basic ' + btoa(Deno.env.get('PAGARME_SECRET_KEY') + ':')
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Erro Pagar.me:', JSON.stringify(data))
      // Tenta pegar a mensagem de erro mais específica do Pagar.me
      const errorMessage = data.message || (data.errors ? JSON.stringify(data.errors) : 'Erro no processamento')
      throw new Error(errorMessage)
    }

    // 9. Se Sucesso (Pago), libera o acesso (Enrollments)
    if (data.status === 'paid') {
        // Usamos Service Role aqui para garantir permissão de escrita na tabela de matrículas
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const enrollments = cartItems.map((item: any) => ({
            user_id: user.id,
            course_id: item.course.id,
            status: 'ATIVO',
            created_at: new Date().toISOString()
        }))

        // Insere matrículas
        const { error: enrollError } = await supabaseAdmin.from('enrollments').insert(enrollments)
        if (enrollError) console.error('Erro ao criar matrículas:', enrollError)
        
        // Limpa o carrinho
        await supabaseAdmin.from('cart').delete().eq('user_id', user.id)
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    console.error('Erro geral:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})