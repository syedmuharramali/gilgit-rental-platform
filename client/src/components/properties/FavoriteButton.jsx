import { Heart, LoaderCircle } from 'lucide-react'
import { motion } from 'motion/react'
import { useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  useAddFavoriteMutation,
  useCheckFavoriteQuery,
  useGetFavoritesQuery,
  useRemoveFavoriteMutation,
} from '../../features/favorites/favoritesApi'

function FavoriteButton({ propertyId, className = '', showLabel = false }) {
  const token = useSelector((state) => state.auth.token)
  const navigate = useNavigate()
  const location = useLocation()
  const listQuery = useGetFavoritesQuery(undefined, { skip: !token || showLabel })
  const statusQuery = useCheckFavoriteQuery(propertyId, { skip: !token || !propertyId || !showLabel })
  const [addFavorite, { isLoading: isAdding }] = useAddFavoriteMutation()
  const [removeFavorite, { isLoading: isRemoving }] = useRemoveFavoriteMutation()

  const isSaved = showLabel
    ? Boolean(statusQuery.data?.isSaved)
    : Boolean(listQuery.data?.favorites?.some((favorite) => String(favorite.property?._id) === String(propertyId)))
  const isLoading = isAdding || isRemoving || (showLabel ? statusQuery.isFetching : listQuery.isFetching)

  const handleClick = async (event) => {
    event.preventDefault()
    event.stopPropagation()

    if (!token) {
      navigate('/login', { state: { from: `${location.pathname}${location.search}` } })
      return
    }

    try {
      if (isSaved) {
        await removeFavorite(propertyId).unwrap()
        toast.success('Removed from saved homes')
      } else {
        await addFavorite(propertyId).unwrap()
        toast.success('Saved to your favorites')
      }
    } catch (error) {
      toast.error(error?.data?.message || 'Unable to update favorites')
    }
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileTap={{ scale: 0.92 }}
      disabled={isLoading}
      aria-label={isSaved ? 'Remove from favorites' : 'Save to favorites'}
      className={`inline-flex items-center justify-center gap-2 rounded-full transition ${className}`}
    >
      {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />}
      {showLabel && <span>{isSaved ? 'Saved' : 'Save home'}</span>}
    </motion.button>
  )
}

export default FavoriteButton
