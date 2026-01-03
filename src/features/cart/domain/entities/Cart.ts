// Domain Entity: Cart
// Pure domain model for shopping cart

export interface CartItem {
  id: string;
  courseId: string;
  userId: string;
  createdAt: string;
  course: {
    id: string;
    title: string;
    subtitle: string | null;
    thumbnailUrl: string | null;
    price: number;
    instructorId: string;
  };
}

export interface CartSummary {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
}
