import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FavoriteButtonProps {
  riverId: string
  isFavorite: boolean
  onToggle: (id: string) => void
  size?: 'sm' | 'md'
  className?: string
}

export function FavoriteButton({
  riverId,
  isFavorite,
  onToggle,
  size = 'md',
  className,
}: FavoriteButtonProps) {
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (animating) {
      const timer = setTimeout(() => setAnimating(false), 200)
      return () => clearTimeout(timer)
    }
  }, [animating])

  const sizeClass = size === 'sm' ? 'size-6' : 'size-7'

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setAnimating(true)
    onToggle(riverId)
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={cn('touch-target', sizeClass, className)}
      onClick={handleClick}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      aria-pressed={isFavorite}
    >
      <Heart
        className={cn(
          'h-4 w-4 transition-all duration-150 ease-out',
          isFavorite ? 'text-accent-water fill-current scale-110' : 'text-slate-400',
          isFavorite ? 'hover:text-cyan-300' : 'hover:text-slate-300',
          animating && 'animate-fav-pop'
        )}
      />
    </Button>
  )
}
