import { ArrowDown, ArrowUp, ImagePlus, Trash2, UploadCloud } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import {
  useDeletePropertyImageMutation,
  useGetMyPropertiesQuery,
  useGetPropertyQuery,
  useReorderPropertyImagesMutation,
  useSetCoverImageMutation,
  useUploadPropertyImagesMutation,
} from '../../features/properties/propertiesApi'
import { EmptyState, LoadingState, PageHeader, Panel, PrimaryButton, SecondaryButton, Select } from '../../components/workspace/WorkspaceUI'

const errorMessage = (error) => error?.data?.message || error?.error || 'Something went wrong'

export default function PropertyMediaPage() {
  const { data: myData, isLoading: loadingProperties } = useGetMyPropertiesQuery()
  const properties = myData?.properties || []
  const [selectedId, setSelectedId] = useState('')
  const propertyId = selectedId || properties[0]?._id
  const { data: property, isLoading } = useGetPropertyQuery(propertyId, { skip: !propertyId })
  const [uploadImages, uploadState] = useUploadPropertyImagesMutation()
  const [reorderImages, reorderState] = useReorderPropertyImagesMutation()
  const [setCover, coverState] = useSetCoverImageMutation()
  const [deleteImage, deleteState] = useDeletePropertyImageMutation()
  const [files, setFiles] = useState([])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/jpeg': [], 'image/png': [] },
    maxFiles: 8,
    maxSize: 5 * 1024 * 1024,
    onDrop: setFiles,
  })

  const images = useMemo(() => [...(property?.images || [])].sort((a, b) => a.order - b.order), [property?.images])

  const upload = async () => {
    if (!files.length || !propertyId) return
    try {
      await uploadImages({ id: propertyId, files }).unwrap()
      setFiles([])
      toast.success('Property images uploaded')
    } catch (error) { toast.error(errorMessage(error)) }
  }

  const move = async (index, direction) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= images.length) return
    const next = [...images]
    const [moved] = next.splice(index, 1)
    next.splice(nextIndex, 0, moved)
    try {
      await reorderImages({ id: propertyId, imageIds: next.map((image) => image.id) }).unwrap()
      toast.success('Image order updated')
    } catch (error) { toast.error(errorMessage(error)) }
  }

  if (loadingProperties) return <LoadingState />

  return (
    <>
      <PageHeader eyebrow="Property media" title="Photos & cover image" text="Upload, reorder, choose the cover and remove images before submitting a listing for review." action={properties.length ? <Select value={propertyId || ''} onChange={(event) => setSelectedId(event.target.value)}>{properties.map((item) => <option key={item._id} value={item._id}>{item.title}</option>)}</Select> : null} />
      {!propertyId ? <EmptyState title="Create a property first" text="Media management becomes available after a draft listing exists." /> : isLoading ? <LoadingState /> : (
        <div className="space-y-6">
          <Panel>
            <div {...getRootProps()} className={`cursor-pointer rounded-[26px] border-2 border-dashed p-8 text-center transition ${isDragActive ? 'border-cyan-300/45 bg-cyan-300/8' : 'border-white/12 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.04]'}`}>
              <input {...getInputProps()} />
              <UploadCloud className="mx-auto h-8 w-8 text-cyan-300" />
              <p className="mt-3 font-black text-white">Drop JPG or PNG property photos here</p>
              <p className="mt-1 text-xs text-white/35">Up to 8 files per upload, 5 MB each. A property may contain up to 10 images.</p>
            </div>
            {files.length > 0 && <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-cyan-300/12 bg-cyan-300/[0.055] p-4"><p className="text-sm font-bold text-cyan-100">{files.length} image(s) selected</p><PrimaryButton disabled={uploadState.isLoading} onClick={upload}><ImagePlus className="h-4 w-4" /> Upload</PrimaryButton></div>}
          </Panel>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {images.length ? images.map((image, index) => (
              <Panel key={image.id} className="p-3">
                <div className="relative overflow-hidden rounded-[22px]"><img src={image.url} alt={image.alt || property.title} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />{image.isCover && <span className="absolute left-3 top-3 rounded-full border border-cyan-100/20 bg-cyan-300 px-3 py-1 text-[10px] font-black text-[#07101e] shadow-lg">Cover image</span>}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <SecondaryButton disabled={index === 0 || reorderState.isLoading} onClick={() => move(index, -1)}><ArrowUp className="h-4 w-4" /> Earlier</SecondaryButton>
                  <SecondaryButton disabled={index === images.length - 1 || reorderState.isLoading} onClick={() => move(index, 1)}><ArrowDown className="h-4 w-4" /> Later</SecondaryButton>
                  {!image.isCover && <SecondaryButton disabled={coverState.isLoading} onClick={async () => { try { await setCover({ id: propertyId, imageId: image.id }).unwrap(); toast.success('Cover image updated') } catch (error) { toast.error(errorMessage(error)) } }}>Set cover</SecondaryButton>}
                  <button type="button" disabled={deleteState.isLoading} aria-label="Delete property image" onClick={async () => { try { await deleteImage({ id: propertyId, imageId: image.id }).unwrap(); toast.success('Image deleted') } catch (error) { toast.error(errorMessage(error)) } }} className="grid h-11 w-11 place-items-center rounded-2xl border border-rose-300/15 bg-rose-400/10 text-rose-300 transition hover:bg-rose-400/15 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
                </div>
              </Panel>
            )) : <div className="sm:col-span-2 xl:col-span-3"><EmptyState title="No property images yet" text="Upload at least three images and choose exactly one cover before submitting for review." /></div>}
          </div>
        </div>
      )}
    </>
  )
}
