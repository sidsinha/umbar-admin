'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2 } from 'lucide-react'

import { ClassAIAssistant } from '@/components/classes/ClassAIAssistant'
import ClassLocationField from '@/components/classes/ClassLocationField'
import ClassLogoField from '@/components/classes/ClassLogoField'
import ClassTagSelector from '@/components/classes/ClassTagSelector'
import PrefixedClassTitleInput from '@/components/classes/PrefixedClassTitleInput'
import InstructorTypeToggle from '@/components/InstructorTypeToggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { CLASS_LOGO_TOO_LARGE_MESSAGE, isClassLogoTooLarge } from '@/lib/class-logo'
import {
  buildStoredClassNameFromParts,
  buildSuffixFromSubject,
  CLASS_NAME_MAX_LENGTH,
  classNameCharCountLabel,
  classNameLengthError,
  classTitlePrefixForType,
  maxEditableTitleTailLength,
  normalizeAiTitleTails,
  primarySubjectName,
  splitClassTitle,
  splitSuffixAroundSubject,
} from '@/lib/class-title'
import { fetchAdminClass, updateAdminClass } from '@/lib/admin-ops-api-client'
import type { AdminClassDetail, AdminClassUpdateBody, ClassDefaultFee, ClassLocation } from '@/lib/admin-types'
import { generateAdminClassContent } from '@/lib/generate-class-content'
import { useClassAIGenerator } from '@/lib/hooks/use-class-ai-generator'
import { instructorTypeLabel, isIndividualClassType, type InstructorType } from '@/lib/instructor-type'
import {
  fetchCategories,
  fetchClassTags,
  fetchSupportedCountries,
  isV2CategoriesResponse,
  type MarketplaceCategoryV2Child,
  type MarketplaceCategoryV2Parent,
} from '@/lib/marketplace-api-client'

type ClassTypeOption = 'in-person' | 'remote' | 'both'
type ClassFormStatus = 'active' | 'disabled'

type ClassEditFormProps = {
  classId: string
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

export default function ClassEditForm({ classId }: ClassEditFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [formError, setFormError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)

  const [titleEditableTail, setTitleEditableTail] = useState('')
  const [titleSuffix, setTitleSuffix] = useState('')
  const [organizationName, setOrganizationName] = useState('')
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

  const ai = useClassAIGenerator(generateAdminClassContent)

  const detailQuery = useQuery({
    queryKey: ['admin-class-detail', classId],
    queryFn: () => fetchAdminClass(classId!),
    enabled: Boolean(classId),
  })

  const categoriesQuery = useQuery({
    queryKey: ['marketplace-categories', 'v2', 'all'],
    queryFn: fetchCategories,
    enabled: Boolean(classId),
  })

  const countriesQuery = useQuery({
    queryKey: ['marketplace-countries'],
    queryFn: () => fetchSupportedCountries({ marketplaceOnly: true }),
    enabled: Boolean(classId),
  })

  const classTagsQuery = useQuery({
    queryKey: ['marketplace-class-tags'],
    queryFn: fetchClassTags,
    enabled: Boolean(classId),
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

  const instructorAccountType = detailQuery.data?.instructorType ?? 'individual'
  const resolvedOfferingType: InstructorType = classInstructorType

  const lockedSubject = useMemo(() => {
    if (!isIndividualClassType(resolvedOfferingType) || !isV2) return null
    return primarySubjectName(v2Categories, subcategoryId)
  }, [resolvedOfferingType, isV2, v2Categories, subcategoryId])

  const parentOptions: MarketplaceCategoryV2Parent[] = isV2 ? v2Categories : []
  const selectedParent = v2Categories.find((item) => item.id === categoryId) ?? null
  const subcategoryOptions: MarketplaceCategoryV2Child[] = isV2 ? selectedParent?.children ?? [] : []

  const aiReady =
    Boolean(resolvedOfferingType) &&
    (isV2 ? Boolean(categoryId && subcategoryId) : Boolean(category.trim()))

  const fullClassName = useMemo(
    () =>
      buildStoredClassNameFromParts({
        instructorType: resolvedOfferingType,
        lockedSubjectName: lockedSubject,
        editableTail: titleEditableTail,
        academySuffix: titleSuffix,
      }),
    [resolvedOfferingType, lockedSubject, titleEditableTail, titleSuffix],
  )

  const titleLengthError = classNameLengthError(fullClassName)

  function getFullTitleForTail(tail: string): string {
    return buildStoredClassNameFromParts({
      instructorType: resolvedOfferingType,
      lockedSubjectName: lockedSubject,
      editableTail: isIndividualClassType(resolvedOfferingType) ? tail : '',
      academySuffix: isIndividualClassType(resolvedOfferingType) ? '' : tail,
    })
  }

  function applyTitleTail(tail: string) {
    if (isIndividualClassType(resolvedOfferingType)) {
      setTitleEditableTail(tail)
    } else {
      setTitleSuffix(tail)
    }
  }

  useEffect(() => {
    if (!detailQuery.data?.class) return
    const detail = detailQuery.data.class
    const next = detailToFormState(detail)

    const offering = next.instructorType
    const needsCategoryLookup =
      isIndividualClassType(offering) && Boolean(next.subcategoryId) && categoriesQuery.isLoading
    if (needsCategoryLookup) return

    const { suffix } = splitClassTitle(detail.name || '', offering)
    if (offering === 'academy') {
      setTitleSuffix(suffix)
      setTitleEditableTail('')
    } else {
      const subject =
        isV2 && next.subcategoryId ? primarySubjectName(v2Categories, next.subcategoryId) : null
      if (subject) {
        setTitleEditableTail(splitSuffixAroundSubject(suffix, subject).editableTail)
      } else {
        setTitleEditableTail(suffix)
      }
      setTitleSuffix('')
    }

    setOrganizationName(detailQuery.data.organizationName ?? '')
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
  }, [detailQuery.data, v2Categories, isV2, categoriesQuery.isLoading])

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
      router.push('/classes/')
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : 'Failed to save class.')
    },
  })

  function buildStoredClassName(): string {
    return fullClassName.trim()
  }

  function handleOfferingTypeChange(nextType: InstructorType) {
    if (nextType === classInstructorType) return

    if (nextType === 'academy') {
      const migratedSuffix = buildSuffixFromSubject(lockedSubject ?? '', titleEditableTail).trim()
      if (migratedSuffix) {
        setTitleSuffix(migratedSuffix)
      }
      setTitleEditableTail('')
    } else {
      const migratedTail = lockedSubject
        ? splitSuffixAroundSubject(titleSuffix, lockedSubject).editableTail
        : titleSuffix.trim()
      if (migratedTail) {
        setTitleEditableTail(migratedTail)
      }
      setTitleSuffix('')
    }

    setClassInstructorType(nextType)
  }

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

  async function handleGenerateWithAI() {
    const input = {
      categoryId: isV2 ? categoryId : undefined,
      subcategoryId: isV2 ? subcategoryId : undefined,
      category: isV2 ? undefined : category.trim() || undefined,
      classType,
      instructorType: resolvedOfferingType,
      freeformNotes: ai.freeformNotes.trim() || undefined,
    }

    await ai.generateContent(input, (result) => {
      const normalizedTitles = normalizeAiTitleTails(
        result.titles,
        resolvedOfferingType,
        lockedSubject,
      )
      ai.setTitles(normalizedTitles)
      setDescription(result.description)
      setWhatStudentsWillLearn(result.whatStudentsWillLearn.join('\n'))
      if (result.suggestedTags.length > 0) {
        setTags((current) => [...new Set([...current, ...result.suggestedTags])])
      }
      if (normalizedTitles.length > 0) {
        applyTitleTail(normalizedTitles[0])
        ai.setSelectedTitleIndex(0)
      }
    })
  }

  function handleSelectAiTitle(index: number, title: string) {
    ai.setSelectedTitleIndex(index)
    applyTitleTail(title)
  }

  function validateForm(): AdminClassUpdateBody | null {
    setFormError(null)

    const storedName = buildStoredClassName()
    const prefixOnly = storedName.trim() === classTitlePrefixForType(resolvedOfferingType).trim()
    if (!storedName.trim() || prefixOnly) {
      setFormError('Class name is required.')
      return null
    }
    if (titleLengthError) {
      setFormError(titleLengthError)
      return null
    }

    if (!isIndividualClassType(resolvedOfferingType) && !organizationName.trim()) {
      setFormError('Academy / coaching name is required for academy classes.')
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
      name: storedName.trim(),
      description: description.trim(),
      whatStudentsWillLearn: whatStudentsWillLearn.trim(),
      classType,
      location,
      videoLink: classType === 'remote' || classType === 'both' ? videoLink.trim() || null : null,
      hasTrialClass,
      tags,
      status: classStatus,
      instructorType: resolvedOfferingType,
      defaultFee,
      organizationName: isIndividualClassType(resolvedOfferingType)
        ? organizationName.trim() || null
        : organizationName.trim(),
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

  const instructorName = detailQuery.data?.instructorName?.trim() || ''

  const offeringDiffersFromAccount =
    instructorAccountType !== 'both' && instructorAccountType !== resolvedOfferingType

  const loading = detailQuery.isLoading || categoriesQuery.isLoading

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/classes/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to classes
      </Link>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Edit class</h2>
          {detailQuery.data?.class?.name ? (
            <p className="mt-1 text-sm text-muted-foreground">{detailQuery.data.class.name}</p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={saveMutation.isPending}
            onClick={() => router.push('/classes/')}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading || detailQuery.isError || saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : detailQuery.error ? (
        <p className="text-destructive">
          {detailQuery.error instanceof Error ? detailQuery.error.message : 'Failed to load class.'}
        </p>
      ) : (
        <div className="space-y-8 pb-8">
          {instructorName ? (
            <p className="text-sm text-muted-foreground">
              Instructor: <span className="font-medium text-foreground">{instructorName}</span>
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

          {formError ? (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          ) : null}

          <section className="space-y-4">
            <h4 className="font-medium text-foreground">Offering & delivery</h4>
            <div className="space-y-2">
              <Label>Offering type</Label>
              <InstructorTypeToggle value={classInstructorType} onChange={handleOfferingTypeChange} />
              {offeringDiffersFromAccount ? (
                <p className="text-xs text-muted-foreground">
                  This instructor&apos;s account is {instructorTypeLabel(instructorAccountType)}. The
                  offering type above applies to this class only.
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="class-type">Delivery mode</Label>
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
            {categoriesQuery.isError ? (
              <p className="text-sm text-destructive">Failed to load categories.</p>
            ) : isV2 ? (
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

          <section>
            <ClassAIAssistant
              freeformNotes={ai.freeformNotes}
              onFreeformNotesChange={ai.setFreeformNotes}
              isGenerating={ai.isGenerating}
              hasGeneratedOnce={ai.hasGeneratedOnce}
              error={ai.error}
              titles={ai.titles}
              selectedTitleIndex={ai.selectedTitleIndex}
              onSelectTitle={handleSelectAiTitle}
              disabled={!aiReady}
              generateDisabled={!aiReady}
              onGenerate={() => void handleGenerateWithAI()}
              getFullTitleForTail={getFullTitleForTail}
              titleMaxLength={CLASS_NAME_MAX_LENGTH}
            />
            {!aiReady ? (
              <p className="text-xs text-muted-foreground">
                Select a category and offering type to enable AI generation.
              </p>
            ) : null}
          </section>

          <section className="space-y-4">
            <h4 className="font-medium text-foreground">Basic</h4>
            <div className="space-y-2">
              <Label htmlFor="class-name">Name</Label>
              <PrefixedClassTitleInput
                id="class-name"
                instructorType={resolvedOfferingType}
                lockedSubjectName={lockedSubject}
                editableTail={titleEditableTail}
                onEditableTailChange={setTitleEditableTail}
                academySuffix={titleSuffix}
                onAcademySuffixChange={setTitleSuffix}
                maxLength={maxEditableTitleTailLength(resolvedOfferingType, lockedSubject)}
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <p
                  className={
                    titleLengthError ? 'font-medium text-destructive' : 'text-muted-foreground'
                  }
                >
                  {titleLengthError ?? `Saved title limit: ${CLASS_NAME_MAX_LENGTH} characters.`}
                </p>
                <p
                  className={
                    titleLengthError ? 'font-medium text-destructive' : 'text-muted-foreground'
                  }
                >
                  {classNameCharCountLabel(fullClassName)}
                </p>
              </div>
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

          {!isIndividualClassType(resolvedOfferingType) ? (
            <section className="space-y-2">
              <h4 className="font-medium text-foreground">Academy / Coaching name</h4>
              <Input
                id="organization-name"
                value={organizationName}
                maxLength={80}
                placeholder="e.g. Sunrise Music Academy"
                onChange={(event) => setOrganizationName(event.target.value.slice(0, 80))}
              />
              <p className="text-xs text-muted-foreground">
                Saved to the instructor profile and shown on academy class listings.
              </p>
            </section>
          ) : null}

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
    </div>
  )
}
