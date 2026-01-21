import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Trash2, ArrowLeft, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const { authUser } = useAuth();
  const navigate = useNavigate();
  const { cartItems, subtotal, removeFromCart, clearCart, isLoading } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error('Seu carrinho está vazio');
      return;
    }

    if (!authUser?.id) {
      toast.error('Você precisa estar logado');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simular processamento de pagamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Criar matrículas para cada curso no carrinho
      const enrollments = cartItems.map(item => ({
        user_id: authUser.id,
        course_id: item.course_id,
        status: 'ATIVO',
      }));

      const { error: enrollmentError } = await supabase
        .from('enrollments')
        .insert(enrollments);

      if (enrollmentError) {
        console.error('Error creating enrollments:', enrollmentError);
        throw new Error('Erro ao processar matrícula');
      }

      // Limpar carrinho após matrículas criadas
      await clearCart.mutateAsync();
      
      toast.success('Compra realizada com sucesso! Você já pode acessar seus cursos.');
      navigate('/student');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Erro ao processar compra. Tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!authUser) {
    navigate('/login');
    return null;
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container max-w-4xl py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-4xl py-8 md:py-12">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <h1 className="text-3xl font-display font-bold mb-8">Checkout</h1>

        {cartItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Carrinho vazio</h2>
              <p className="text-muted-foreground mb-6">
                Adicione cursos ao carrinho para continuar
              </p>
              <Button onClick={() => navigate('/courses')}>
                Explorar Cursos
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Itens no Carrinho ({cartItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItems.map((item, index) => (
                    <div key={item.id}>
                      <div className="flex gap-4">
                        <div className="w-24 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {item.course?.thumbnail_url ? (
                            <img
                              src={item.course.thumbnail_url}
                              alt={item.course.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium line-clamp-1">{item.course?.title}</h3>
                          {item.course?.subtitle && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {item.course.subtitle}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold text-primary">
                            {formatPrice(Number(item.course?.price) || 0)}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive mt-1"
                            onClick={() => removeFromCart.mutate(item.course_id)}
                            disabled={removeFromCart.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remover
                          </Button>
                        </div>
                      </div>
                      {index < cartItems.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Desconto</span>
                    <span className="text-green-600">-{formatPrice(0)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(subtotal)}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleCheckout}
                    disabled={isProcessing || cartItems.length === 0}
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Finalizar Compra
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
