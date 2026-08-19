export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  cost: number;
  emoji: string;
};

type ProductCardProps = {
  product: Product;
  onAdd: (product: Product) => void;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

export default function ProductCard({
  product,
  onAdd,
}: ProductCardProps) {
  return (
    <button
      type="button"
      onClick={() => onAdd(product)}
      className="group min-w-0 rounded-2xl border border-[#f4dce4] bg-white p-2.5 sm:rounded-3xl sm:p-3 text-left shadow-sm transition hover:-translate-y-1 hover:border-[#edacc0] hover:shadow-lg active:scale-[0.98]"
    >
      <div className="mb-2.5 flex aspect-square items-center justify-center rounded-2xl bg-[#fff0f4] text-4xl sm:mb-3 sm:text-5xl transition group-hover:scale-[1.02]">
        {product.emoji}
      </div>

      <p className="line-clamp-2 min-h-[40px] text-sm font-semibold leading-5 text-[#633c49] sm:text-base">
        {product.name}
      </p>

      <div className="mt-1 flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-[#d96f94]">
          {formatPrice(product.price)}
        </span>

        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f8c8d8] text-[#a94f70]">
          +
        </span>
      </div>
    </button>
  );
}