/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Trash2, ArrowLeft, CreditCard, Lock } from 'lucide-react';
import { toast } from 'sonner';

// Schema de validação do formulário
const checkoutSchema = z.object({
  fullName: z.string().min(3, 'Nome completo é obrigatório'),
  document: z.string().min(11, 'CPF inválido').max(14, 'CPF inválido'), // Aceita com ou sem formatação
  phone: z.string().min(10, 'Telefone inválido'),
  cardNumber: z.string().min(16, 'Número do cartão inválido'),
  cardHolder: z.string().min(3, 'Nome no cartão é obrigatório'),
  cardMonth: z.string().length(2, 'Mês inválido (MM)'),
  cardYear: z.string().length(2, 'Ano inválido (AA)'),
  cardCvv: z.string().min(3, 'CVV inválido').max(4),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const { authUser } = useAuth();
  const navigate = useNavigate();
  const { cartItems, subtotal, removeFromCart, clearCart, isLoading } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);

  // Configuração do formulário
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: authUser?.user_metadata?.full_name || '',
      document: '',
      phone: '',
      cardNumber: '',
      cardHolder: '',
      cardMonth: '',
      cardYear: '',
      cardCvv: '',
    }
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  // Função para gerar o Token do Cartão (Roda no navegador)
  const generateCardToken = async (data: CheckoutFormValues) => {
    const publicKey = import.meta.env.VITE_PAGARME_PUBLIC_KEY;
    
    if (!publicKey) {
      throw new Error('Chave pública do Pagar.me não configurada (.env)');
    }

    const response = await fetch(`https://api.pagar.me/core/v5/tokens?appId=${publicKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'card',
        card: {
          number: data.cardNumber.replace(/\s/g, ''),
          holder_name: data.cardHolder,
          exp_month: data.cardMonth,
          exp_year: data.cardYear,
          cvv: data.cardCvv
        }
      })
    });

    const result = await response.json();
    if (!response.ok) throw new Error('Dados do cartão inválidos. Verifique e tente novamente.');
    
    return result.id; // Ex: "token_xxxxxx"
  };

  const onSubmit = async (data: CheckoutFormValues) => {
    if (cartItems.length === 0) {
      toast.error('Seu carrinho está vazio');
      return;
    }

    setIsProcessing(true);
    
    try {
      // 1. Gerar Token Seguro
      const cardToken = await generateCardToken(data);
      console.log('Token gerado:', cardToken);

      // 2. Enviar para Backend (Edge Function)
      const { data: responseData, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          cartItems,
          cardToken,
          customerData: {
            name: data.fullName,
            document: data.document,
            phone: data.phone.replace(/\D/g, '')
          },
          installments: 1
        }
      });

      if (error) throw new Error(error.message);
      if (responseData.error) throw new Error(responseData.error);

      // Sucesso!
      toast.success('Pagamento aprovado! Redirecionando...');
      
      // Limpar estado local do carrinho
      await clearCart.mutateAsync();
      
      navigate('/student'); // Redireciona para área do aluno

    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Erro ao processar pagamento.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) return <div className="p-8">Carregando...</div>;

  return (
    <DashboardLayout>
      <div className="container max-w-6xl py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>

        <h1 className="text-3xl font-bold mb-8">Checkout Seguro</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Coluna da Esquerda: Formulário */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" /> Dados de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form id="checkout-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  
                  {/* Dados Pessoais */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome Completo</Label>
                      <Input {...form.register('fullName')} placeholder="Nome igual ao documento" />
                      {form.formState.errors.fullName && <p className="text-red-500 text-sm">{form.formState.errors.fullName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label>CPF</Label>
                      <Input {...form.register('document')} placeholder="000.000.000-00" />
                      {form.formState.errors.document && <p className="text-red-500 text-sm">{form.formState.errors.document.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                      <Label>Celular (DDD + Número)</Label>
                      <Input {...form.register('phone')} placeholder="11999999999" />
                      {form.formState.errors.phone && <p className="text-red-500 text-sm">{form.formState.errors.phone.message}</p>}
                  </div>

                  <Separator className="my-4" />

                  {/* Dados do Cartão */}
                  <div className="space-y-2">
                    <Label>Número do Cartão</Label>
                    <div className="relative">
                        <Input {...form.register('cardNumber')} placeholder="0000 0000 0000 0000" />
                        <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>
                    {form.formState.errors.cardNumber && <p className="text-red-500 text-sm">{form.formState.errors.cardNumber.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Nome Impresso no Cartão</Label>
                    <Input {...form.register('cardHolder')} placeholder="COMO NO CARTAO" />
                    {form.formState.errors.cardHolder && <p className="text-red-500 text-sm">{form.formState.errors.cardHolder.message}</p>}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Mês</Label>
                      <Input {...form.register('cardMonth')} placeholder="MM" maxLength={2} />
                    </div>
                    <div className="space-y-2">
                      <Label>Ano</Label>
                      <Input {...form.register('cardYear')} placeholder="AA" maxLength={2} />
                    </div>
                    <div className="space-y-2">
                      <Label>CVV</Label>
                      <Input {...form.register('cardCvv')} placeholder="123" maxLength={4} type="password" />
                    </div>
                  </div>
                  {(form.formState.errors.cardMonth || form.formState.errors.cardYear || form.formState.errors.cardCvv) && 
                    <p className="text-red-500 text-sm">Verifique a data e o CVV</p>
                  }

                </form>
              </CardContent>
            </Card>
          </div>

          {/* Coluna da Direita: Resumo */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                        <span className="truncate w-2/3">{item.course?.title}</span>
                        <span>{formatPrice(Number(item.course?.price))}</span>
                    </div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(subtotal)}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  size="lg" 
                  type="submit" 
                  form="checkout-form"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processando...' : `Pagar ${formatPrice(subtotal)}`}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}