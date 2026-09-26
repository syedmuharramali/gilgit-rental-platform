import { Heart, LoaderCircle } from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
  const navigate = useNavigate()
  const location = useLocation()
  // Every card shares this one list. With the app-wide refetch-on-mount, each
  // card mounting re-downloaded it and set every heart spinning; the add and
  // remove mutations already refresh it when it actually changes.
  const listQuery = useGetFavoritesQuery(undefined, { skip: !isAuthenticated || showLabel, refetchOnMountOrArgChange: false })
  const statusQuery = useCheckFavoriteQuery(propertyId, { skip: !isAuthenticated || !propertyId || !showLabel })
  const [addFavorite, { isLoading: isAdding }] = useAddFavoriteMutation()
  const [removeFavorite, { isLoading: isRemoving }] = useRemoveFavoriteMutation()

  const isSaved = showLabel
    ? Boolean(statusQuery.data?.isSaved)
    : Boolean(listQuery.data?.favorites?.some((favorite) => String(favorite.property?._id) === String(propertyId)))
  const isLoading = isAdding || isRemoving || (showLabel ? statusQuery.isFetching : listQuery.isFetching)

  const handleClick = async (event) => {
    event.preventDefault()
    event.stopPropagation()

    if (!isAuthenticated) {
      navigate('/login', { state: { from: `${location.pathname}${location.search}` } })
      return
    }

    try {
      if (isSaved) {
        await removeFavorite(propertyId).unwrap()
        toast.success(t('favorite.removed'))
      } else {
        await addFavorite(propertyId).unwrap()
        toast.success(t('favorite.saved'))
      }
    } catch (error) {
      toast.error(error?.data?.message || t('favorite.error'))
    }
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      whileTap={{ scale: 0.92 }}
      disabled={isLoading}
      aria-label={isSaved ? t('favorite.removeAria') : t('favorite.saveAria')}
      className={`inline-flex items-center justify-center gap-2 rounded-full transition ${className}`}
    >
      {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />}
      {showLabel && <span>{isSaved ? t('favorite.savedLabel') : t('favorite.saveLabel')}</span>}
    </motion.button>
  )
}

export default FavoriteButton
