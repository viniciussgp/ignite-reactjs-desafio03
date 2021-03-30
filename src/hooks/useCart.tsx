import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')
  
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const itemOnCart = cart.filter((product) => product.id === productId)[0];

      const {data} = await api.get(`stock/${productId}`);
      const stock: Stock = data;
      
      if(itemOnCart && stock.amount <= itemOnCart.amount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
     
      let newCart;

      if(itemOnCart){
        newCart = cart.map(product => {
          return {
            ...product,
            amount: product.id === productId
              ? product.amount + 1 : product.amount,
          }
        });

      }else{
        const data = await api.get(`products/${productId}`);
        const product: Product = data.data;
        
        newCart = [
          ...cart,
          {
            ...product,
            amount: 1,
          }
        ];
      }

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      
      const itemOnCart = cart.filter((product) => product.id === productId)[0];
      
      if(itemOnCart){
        const newCart = cart.filter((product) => product.id !== productId);

        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }else{
        throw Error('');
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if(amount <= 0)
      return;
      
      const {data} = await api.get(`stock/${productId}`);
      const onStock: Stock = data;

      if(onStock.amount >= amount){

        const newCart = cart.map(product => {
          return {
            ...product,
            amount: product.id === productId
              ? amount : product.amount,
          }
        });

        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      }else
        toast.error('Quantidade solicitada fora de estoque');

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
