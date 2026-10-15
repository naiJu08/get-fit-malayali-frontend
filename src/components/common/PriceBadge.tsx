interface PriceBadgeProps {
  actualPrice?: string | number | null
  discountedPrice?: string | number | null
  fees?: string | number | null
  price?: string | number | null
  amount?: string | number | null
  variant?: 'default' | 'selected' | 'table'
  size?: 'sm' | 'md'
}

function formatPrice(value: any): string {
  const num = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(num)) return String(value ?? '')
  return num.toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

export default function PriceBadge({
  actualPrice,
  discountedPrice,
  fees,
  price,
  amount,
  variant = 'default',
  size = 'sm',
}: PriceBadgeProps) {
  const displayPrice = discountedPrice || fees || price || amount
  if (!displayPrice) {
    return (
      <span
        className={`inline-flex items-center rounded-lg font-semibold transition-colors ${
          size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'
        } ${
          variant === 'selected'
            ? 'bg-primaryGreen text-white'
            : 'bg-gray-100 text-gray-400'
        }`}
      >
        --
      </span>
    )
  }

  const hasDiscount =
    actualPrice && displayPrice && Number(actualPrice) !== Number(displayPrice)

  if (variant === 'table') {
    return (
      <span className="inline-flex items-center gap-2">
        {hasDiscount && (
          <span className="text-xs text-gray-400 line-through">
            ₹{formatPrice(actualPrice)}
          </span>
        )}
        <span
          className={`text-xs font-semibold ${hasDiscount ? 'text-green-600' : 'text-gray-800'}`}
        >
          ₹{formatPrice(displayPrice)}
        </span>
      </span>
    )
  }

  const sizeClasses =
    size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'

  if (hasDiscount) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-lg font-semibold transition-colors ${sizeClasses} ${
          variant === 'selected'
            ? 'bg-primaryGreen text-white'
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}
      >
        <span
          className={`line-through ${size === 'md' ? 'text-xs' : 'text-[10px]'} ${
            variant === 'selected' ? 'text-white/60' : 'text-gray-400'
          }`}
        >
          ₹{formatPrice(actualPrice)}
        </span>
        <span>₹{formatPrice(displayPrice)}</span>
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center rounded-lg font-semibold transition-colors ${sizeClasses} ${
        variant === 'selected'
          ? 'bg-primaryGreen text-white'
          : 'bg-successColor/10 text-successColor'
      }`}
    >
      ₹{formatPrice(displayPrice)}
    </span>
  )
}
