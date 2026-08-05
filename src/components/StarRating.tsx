export default function StarRating({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (rating: number) => void;
}) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onChange(star);
          }}
          aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          className={
            value != null && star <= value
              ? "text-sm text-yellow-500"
              : "text-sm text-black/20 hover:text-black/40 dark:text-white/20 dark:hover:text-white/40"
          }
        >
          ★
        </button>
      ))}
    </div>
  );
}
