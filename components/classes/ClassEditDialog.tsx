'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

import ClassLocationField from '@/components/classes/ClassLocationField'
import ClassLogoField from '@/components/classes/ClassLogoField'
import ClassTagSelector from '@/components/classes/ClassTagSelector'
import FormDialog from '@/components/FormDialog'
import InstructorTypeToggle from '@/components/InstructorTypeToggle'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { CLASS_LOGO_TOO_LARGE_MESSAGE, isClassLogoTooLarge } from '@/lib/class-logo'
import { fetchAdminClass, updateAdminClass } from '@/lib/admin-ops-api-client'
import type { AdminClassDetail, AdminClassUpdateBody, ClassDefaultFee, ClassLocation } from '@/lib/admin-types'
import { instructorTypeLabel, type InstructorType } from '@/lib/instructor-type'
import {
  fetchCategories,
  fetchClassTags,
  fetchSupportedCountries,
  isV2CategoriesResponse,
  type MarketplaceCategoryV2Child,
  type MarketplaceCategoryV2Parent,
} from '@/lib/marketplace-api-client'

const CLASS_NAME_MAX_LENGTH = 64

type ClassTypeOption = 'in-person' | 'remote' | 'both'
type ClassFormStatus = 'active' | 'disabled'

type ClassEditDialogProps = {
  classId: string | null
  onClose: () => void
}

function normalizeClassType(value: string | undefined): ClassTypeOption {
  if (value === 'remote' || value === 'both' || value === 'in-person') return value
  return 'in-person'
}

function normalizeLocationAreaLabel(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function detailToFormState(detail: AdminClassDetail) {
  const location = detail.location
  return {
    name: (detail.name || '').slice(0, CLASS_NAME_MAX_LENGTH),
    description: detail.description || '',
    whatStudentsWillLearn: detail.whatStudentsWillLearn || '',
    classType: normalizeClassType(detail.classType),
    videoLink: detail.videoLink || '',
    classLogo: detail.classLogo || null,
    hasTrialClass: detail.hasTrialClass === true,
    classStatus: detail.status === 'disabled' ? ('disabled' as ClassFormStatus) : ('active' as ClassFormStatus),
    category: typeof detail.category === 'string' ? detail.category.trim() : '',
    categoryId: detail.categoryId || '',
    subcategoryId: detail.subcategoryId || '',
    instructorType:
      detail.instructorType === 'academy' ? ('academy' as InstructorType) : ('individual' as InstructorType),
    tags: Array.isArray(detail.tags)
      ? detail.tags.filter((tag) => typeof tag === 'string' && !tag.startsWith('subjects:'))
      : [],
    locationText:
      location?.locationText ||
      location?.formattedAddress ||
      location?.areaLabel ||
      '',
    city: location?.city || '',
    state: location?.state || '',
    country: location?.country || '',
    placeId: location?.placeId || '',
    formattedAddress: location?.formattedAddress || '',
    locality: location?.locality || '',
    lat: typeof location?.lat === 'number' ? location.lat : null,
    lng: typeof location?.lng === 'number' ? location.lng : null,
    defaultFeeAmountText: detail.defaultFee ? String(detail.defaultFee.amount) : '',
    defaultFeeBasis: detail.defaultFee?.basis || 'per_class',
    defaultFeeCurrency: detail.defaultFee?.currency || 'INR',
    logoChanged: false,
  }
}

export default function ClassEditDialog({ classId, onClose }: ClassEditDialogProps) {
  const queryClient = useQueryClient()
  const open = Boolean(classId)

  const [formError, setFormError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [whatStudentsWillLearn, setWhatStudentsWillLearn] = useState('')
  const [classType, setClassType] = useState<ClassTypeOption>('in-person')
  const [videoLink, setVideoLink] = useState('')
  const [classLogo, setClassLogo] = useState<string | null>(null)
  const [logoChanged, setLogoChanged] = useState(false)
  const [hasTrialClass, setHasTrialClass] = useState(false)
  const [classStatus, setClassStatus] = useState<ClassFormStatus>('active')
  const [category, setCategory] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [classInstructorType, setClassInstructorType] = useState<InstructorType>('individual')
  const [tags, setTags] = useState<string[]>([])
  const [locationText, setLocationText] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [country, setCountry] = useState('')
  const [placeId, setPlaceId] = useState('')
  const [formattedAddress, setFormattedAddress] = useState('')
  const [locality, setLocality] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [defaultFeeAmountText, setDefaultFeeAmountText] = useState('')
  const [defaultFeeBasis, setDefaultFeeBasis] = useState<'per_class' | 'per_month'>('per_class')
  const [defaultFeeCurrency, setDefaultFeeCurrency] = useState('INR')

  const detailQuery = useQuery({
    queryKey: ['admin-class-detail', classId],
    queryFn: () => fetchAdminClass(classId!),
    enabled: open,
  })

  const categoriesQuery = useQuery({
    queryKey: ['marketplace-categories', 'v2', 'all'],
    queryFn: fetchCategories,
    enabled: open,
  })

  const countriesQuery = useQuery({
    queryKey: ['marketplace-countries'],
    queryFn: () => fetchSupportedCountries({ marketplaceOnly: true }),
    enabled: open,
  })

  const classTagsQuery = useQuery({
    queryKey: ['marketplace-class-tags'],
    queryFn: fetchClassTags,
    enabled: open,
  })

  const isV2 = categoriesQuery.data ? isV2CategoriesResponse(categoriesQuery.data) : false
  const v2Categories = (isV2 ? categoriesQuery.data?.categories : []) as MarketplaceCategoryV2Parent[]
  const v1CategoryNames = useMemo(() => {
    if (!categoriesQuery.data || isV2) return []
    return categoriesQuery.data.categories
      .map((item) => ('name' in item ? item.name : ''))
      .filter(Boolean)
  }, [categoriesQuery.data, isV2])

  const countryIso = useMemo(() => {
    const countries = countriesQuery.data ?? []
    const match = countries.find((item) => item.name === country)
    if (match?.placesIso2) return match.placesIso2
    const first = countries[0]
    return first?.placesIso2 || 'IN'
  }, [countriesQuery.data, country])

  useEffect(() => {
    if (!detailQuery.data?.class) return
    const next = detailToFormState(detailQuery.data.class)
    setName(next.name)
    setDescription(next.description)
    setWhatStudentsWillLearn(next.whatStudentsWillLearn)
    setClassType(next.classType)
    setVideoLink(next.videoLink)
    setClassLogo(next.classLogo)
    setLogoChanged(false)
    setHasTrialClass(next.hasTrialClass)
    setClassStatus(next.classStatus)
    setCategory(next.category)
    setCategoryId(next.categoryId)
    setSubcategoryId(next.subcategoryId)
    setClassInstructorType(next.instructorType)
    setTags(next.tags)
    setLocationText(next.locationText)
    setCity(next.city)
    setState(next.state)
    setCountry(next.country)
    setPlaceId(next.placeId)
    setFormattedAddress(next.formattedAddress)
    setLocality(next.locality)
    setLat(next.lat)
    setLng(next.lng)
    setDefaultFeeAmountText(next.defaultFeeAmountText)
    setDefaultFeeBasis(next.defaultFeeBasis as 'per_class' | 'per_month')
    setDefaultFeeCurrency(next.defaultFeeCurrency)
    setFormError(null)
    setFieldError(null)
  }, [detailQuery.data])

  useEffect(() => {
    if (country || !countriesQuery.data?.length) return
    setCountry(countriesQuery.data[0].name)
  }, [country, countriesQuery.data])

  const saveMutation = useMutation({
    mutationFn: (body: AdminClassUpdateBody) => updateAdminClass(classId!, body),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-classes'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-class-detail', classId] }),
      ])
      onClose()
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : 'Failed to save class.')
    },
  })

  function clearResolvedLocation() {
    setPlaceId('')
    setFormattedAddress('')
    setLocality('')
    setLat(null)
    setLng(null)
  }

  function handleResolvedLocation(resolved: {
    placeId: string
    locationText: string
    formattedAddress?: string
    locality?: string
    city?: string
    state?: string
    country?: string
    lat: number
    lng: number
  }) {
    setPlaceId(resolved.placeId || '')
    setLocationText(resolved.locationText || '')
    setFormattedAddress(resolved.formattedAddress || '')
    setLocality(resolved.locality || '')
    setCity(resolved.city || '')
    setState(resolved.state || '')
    if (resolved.country) setCountry(resolved.country)
    setLat(resolved.lat)
    setLng(resolved.lng)
  }

  function validateForm(): AdminClassUpdateBody | null {
    setFormError(null)

    if (!name.trim()) {
      setFormError('Class name is required.')
      return null
    }
    if (name.trim().length > CLASS_NAME_MAX_LENGTH) {
      setFormError(`Class name must be ${CLASS_NAME_MAX_LENGTH} characters or less.`)
      return null
    }

    if (isV2) {
      if (!categoryId || !subcategoryId) {
        setFormError('Category and subcategory are required.')
        return null
      }
    } else if (!category.trim()) {
      setFormError('Category is required.')
      return null
    }

    if (
      (classType === 'in-person' || classType === 'both') &&
      locationText.trim() &&
      (lat == null || lng == null)
    ) {
      setFormError('Please select a valid location suggestion from search results.')
      return null
    }

    if (videoLink.trim() && !/^https?:\/\//i.test(videoLink.trim())) {
      setFormError('Video link must start with http:// or https://')
      return null
    }

    if (classLogo && isClassLogoTooLarge(classLogo)) {
      setFormError(CLASS_LOGO_TOO_LARGE_MESSAGE)
      return null
    }

    let defaultFee: ClassDefaultFee | null = null
    const amountTrimmed = defaultFeeAmountText.trim()
    if (amountTrimmed) {
      const parsed = parseFloat(amountTrimmed.replace(/,/g, ''))
      if (!Number.isFinite(parsed) || parsed <= 0) {
        setFormError('Enter a valid positive fee amount, or leave it blank.')
        return null
      }
      defaultFee = {
        basis: defaultFeeBasis,
        amount: parsed,
        currency: defaultFeeCurrency,
      }
    }

    const normalizedAreaLabel = normalizeLocationAreaLabel(locality || city)
    const location: ClassLocation | null =
      (classType === 'in-person' || classType === 'both') && locationText.trim()
        ? {
            city: city.trim() || null,
            state: state.trim() || null,
            country: country.trim() || null,
            areaLabel: normalizedAreaLabel || null,
            placeId: placeId || null,
            locationText: locationText.trim() || null,
            formattedAddress: formattedAddress.trim() || null,
            locality: locality.trim() || null,
            lat,
            lng,
          }
        : null

    const body: AdminClassUpdateBody = {
      name: name.trim(),
      description: description.trim(),
      whatStudentsWillLearn: whatStudentsWillLearn.trim(),
      classType,
      location,
      videoLink: classType === 'remote' || classType === 'both' ? videoLink.trim() || null : null,
      hasTrialClass,
      tags,
      status: classStatus,
      instructorType: resolvedInstructorType,
      defaultFee,
    }

    if (isV2) {
      body.categoryId = categoryId
      body.subcategoryId = subcategoryId
    } else {
      body.category = category.trim()
    }

    if (logoChanged) {
      body.classLogo = classLogo
    }

    return body
  }

  function handleSave() {
    const body = validateForm()
    if (!body) return
    saveMutation.mutate(body)
  }

  const instructorLabel = detailQuery.data
    ? [detailQuery.data.instructorName, detailQuery.data.instructorEmail].filter(Boolean).join(' · ')
    : ''

  const instructorAccountType = detailQuery.data?.instructorType ?? 'individual'
  const needsClassInstructorTypeChoice = instructorAccountType === 'both'
  const resolvedInstructorType: InstructorType = needsClassInstructorTypeChoice
    ? classInstructorType
    : instructorAccountType === 'academy'
      ? 'academy'
      : 'individual'

  const parentOptions: MarketplaceCategoryV2Parent[] = isV2 ? v2Categories : []

  const selectedParent = v2Categories.find((item) => item.id === categoryId) ?? null

  const subcategoryOptions: MarketplaceCategoryV2Child[] = isV2 ? selectedParent?.children ?? [] : []

  const loading = detailQuery.isLoading || categoriesQuery.isLoading

  return (
    <FormDialog
      open={open}
      title={detailQuery.data?.class?.name ? `Edit class: ${detailQuery.data.class.name}` : 'Edit class'}
      saving={saveMutation.isPending}
      saveDisabled={loading || detailQuery.isError}
      onSave={handleSave}
      onCancel={onClose}
      className="max-w-3xl"
    >
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : detailQuery.error ? (
        <p className="text-destructive">
          {detailQuery.error instanceof Error ? detailQuery.error.message : 'Failed to load class.'}
        </p>
      ) : (
        <div className="space-y-8">
          {instructorLabel ? (
            <p className="text-sm text-muted-foreground">
              Instructor: {instructorLabel}
              {isV2 ? (
                <>
                  {' '}
                  ·{' '}
                  <span className="font-medium text-foreground">
                    {instructorAccountType === 'both'
                      ? 'Both (Individual & Academy)'
                      : instructorTypeLabel(instructorAccountType)}
                  </span>
                </>
              ) : null}
            </p>
          ) : null}

          {needsClassInstructorTypeChoice ? (
            <div className="space-y-2">
              <Label>This class is</Label>
              <InstructorTypeToggle value={classInstructorType} onChange={setClassInstructorType} />
              <p className="text-xs text-muted-foreground">
                This instructor's account is "Both" — choose whether this specific class is individual or
                academy. This determines which subcategories are relevant below.
              </p>
            </div>
          ) : null}

          {formError ? (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          ) : null}

          <section className="space-y-4">
            <h4 className="font-medium text-foreground">Basic</h4>
            <div className="space-y-2">
              <Label htmlFor="class-name">Name</Label>
              <Input
                id="class-name"
                value={name}
                maxLength={CLASS_NAME_MAX_LENGTH}
                onChange={(event) => setName(event.target.value.slice(0, CLASS_NAME_MAX_LENGTH))}
              />
            </div>
            <ClassLogoField
              value={classLogo}
              onChange={(value) => {
                setClassLogo(value)
                setLogoChanged(true)
              }}
              onError={setFieldError}
            />
            {fieldError ? <p className="text-sm text-destructive">{fieldError}</p> : null}
            <div className="space-y-2">
              <Label htmlFor="class-description">Description</Label>
              <Textarea
                id="class-description"
                value={description}
                rows={4}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-learn">What students will learn</Label>
              <Textarea
                id="class-learn"
                value={whatStudentsWillLearn}
                rows={3}
                onChange={(event) => setWhatStudentsWillLearn(event.target.value)}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="font-medium text-foreground">Type & location</h4>
            <div className="space-y-2">
              <Label htmlFor="class-type">Class type</Label>
              <select
                id="class-type"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={classType}
                onChange={(event) => setClassType(event.target.value as ClassTypeOption)}
              >
                <option value="in-person">In person</option>
                <option value="remote">Remote</option>
                <option value="both">Both</option>
              </select>
            </div>
            {classType === 'remote' || classType === 'both' ? (
              <div className="space-y-2">
                <Label htmlFor="video-link">Video link</Label>
                <Input
                  id="video-link"
                  value={videoLink}
                  placeholder="https://"
                  onChange={(event) => setVideoLink(event.target.value)}
                />
              </div>
            ) : null}
            {classType === 'in-person' || classType === 'both' ? (
              <ClassLocationField
                countryIso={countryIso}
                locationText={locationText}
                lat={lat}
                lng={lng}
                onLocationTextChange={setLocationText}
                onResolved={handleResolvedLocation}
                onClearResolved={clearResolvedLocation}
              />
            ) : null}
          </section>

          <section className="space-y-4">
            <h4 className="font-medium text-foreground">Settings</h4>
            <div className="flex items-center justify-between gap-4 rounded-md border border-border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Offer trial class</p>
                <p className="text-xs text-muted-foreground">Students can request a trial session.</p>
              </div>
              <Switch checked={hasTrialClass} onCheckedChange={setHasTrialClass} />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-md border border-border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Visible on marketplace</p>
                <p className="text-xs text-muted-foreground">Disabled classes are hidden from discovery.</p>
              </div>
              <Switch
                checked={classStatus === 'active'}
                onCheckedChange={(enabled) => setClassStatus(enabled ? 'active' : 'disabled')}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="font-medium text-foreground">Category</h4>
            {categoriesQuery.isError ? (
              <p className="text-sm text-destructive">Failed to load categories.</p>
            ) : isV2 ? (
              <div className="space-y-3">
                <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category-parent">Category</Label>
                  <select
                    id="category-parent"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={categoryId}
                    onChange={(event) => {
                      setCategoryId(event.target.value)
                      setSubcategoryId('')
                    }}
                  >
                    <option value="">Select category</option>
                    {parentOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category-child">Subcategory</Label>
                  <select
                    id="category-child"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={subcategoryId}
                    onChange={(event) => setSubcategoryId(event.target.value)}
                    disabled={!categoryId}
                  >
                    <option value="">Select subcategory</option>
                    {subcategoryOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option value="">Select category</option>
                  {v1CategoryNames.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h4 className="font-medium text-foreground">Fees</h4>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="fee-amount">Amount</Label>
                <Input
                  id="fee-amount"
                  inputMode="decimal"
                  value={defaultFeeAmountText}
                  placeholder="Optional"
                  onChange={(event) => setDefaultFeeAmountText(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee-basis">Basis</Label>
                <select
                  id="fee-basis"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={defaultFeeBasis}
                  onChange={(event) =>
                    setDefaultFeeBasis(event.target.value as 'per_class' | 'per_month')
                  }
                >
                  <option value="per_class">Per class</option>
                  <option value="per_month">Per month</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fee-currency">Currency</Label>
                <select
                  id="fee-currency"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={defaultFeeCurrency}
                  onChange={(event) => setDefaultFeeCurrency(event.target.value)}
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="font-medium text-foreground">Tags</h4>
            <ClassTagSelector
              selectedTags={tags}
              onTagsChange={setTags}
              tagGroups={classTagsQuery.data || []}
              categoryId={categoryId || undefined}
            />
          </section>
        </div>
      )}
    </FormDialog>
  )
}
