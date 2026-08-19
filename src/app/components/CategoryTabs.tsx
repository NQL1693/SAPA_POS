type Category = {
  name: string;
  emoji: string;
};

type CategoryTabsProps = {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
};

export default function CategoryTabs({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryTabsProps) {
  return (
    <div className="-mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-2 sm:mb-5">
      {categories.map((category) => {
        const active = activeCategory === category.name;

        return (
          <button
            key={category.name}
            type="button"
            onClick={() => onCategoryChange(category.name)}
            className={`flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2.5 text-sm sm:px-4 font-semibold transition ${
              active
                ? "bg-[#e88eab] text-white shadow-md shadow-[#e8a5ba]/30"
                : "bg-white text-[#805965] hover:bg-[#fff0f4]"
            }`}
          >
            <span>{category.emoji}</span>
            <span>{category.name}</span>
          </button>
        );
      })}
    </div>
  );
}