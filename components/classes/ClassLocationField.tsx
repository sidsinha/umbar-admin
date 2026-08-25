'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import {
  createPlacesSessionToken,
  fetchLocationAutocomplete,
  fetchLocationPlaceDetails,
  type LocationAutocompleteItem,
  type LocationPlaceDetails,
} from '@/lib/marketplace-api-client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/utils'

type ClassLocationFieldProps = {
  countryIso: string
  locationText: string
  lat: number | null
  lng: number | null
  onLocationTextChange: (value: string) => void
  onResolved: (details: LocationPlaceDetails) => void
  onClearResolved: () => void
}

export default function ClassLocationField({
  countryIso,
  locationText,
  lat,
  lng,
  onLocationTextChange,
  onResolved,
  onClearResolved,
}: ClassLocationFieldProps) {
  const [suggestions, setSuggestions] = useState<LocationAutocompleteItem[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sessionTokenRef = useRef(createPlacesSessionToken())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hasResolvedCoords = lat != null && lng != null

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const helperText = useMemo(() => {
    if (!locationText.trim()) return 'Search and pick a suggestion to set coordinates.'
    if (!hasResolvedCoords) return 'Select a suggestion from the list.'
    return 'Location resolved.'
  }, [hasResolvedCoords, locationText])

  function handleInputChange(value: string) {
    onLocationTextChange(value)
    onClearResolved()
    setError(null)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length < 3) {
      setSuggestions([])
      setOpen(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      if (!countryIso) {
        setError('Country ISO is required for location search.')
        return
      }
      setLoading(true)
      try {
        const items = await fetchLocationAutocomplete({
          query: value,
          country: countryIso,
          sessionToken: sessionTokenRef.current,
        })
        setSuggestions(items)
        setOpen(items.length > 0)
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Location search failed.')
        setSuggestions([])
        setOpen(false)
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  async function handleSelect(item: LocationAutocompleteItem) {
    setOpen(false)
    setSuggestions([])
    setLoading(true)
    setError(null)
    onLocationTextChange(item.fullText || item.primaryText)

    try {
      const details = await fetchLocationPlaceDetails({
        placeId: item.placeId,
        sessionToken: sessionTokenRef.current,
      })
      onResolved(details)
      sessionTokenRef.current = createPlacesSessionToken()
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to resolve location.')
      onClearResolved()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="class-location">Location</Label>
      <div className="relative">
        <Input
          id="class-location"
          value={locationText}
          placeholder="Search address or area"
          onChange={(event) => handleInputChange(event.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true)
          }}
          autoComplete="off"
        />
        {open ? (
          <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-border bg-card shadow-md">
            {suggestions.map((item) => (
              <li key={item.placeId}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => void handleSelect(item)}
                >
                  <span className="block font-medium">{item.primaryText}</span>
                  {item.secondaryText ? (
                    <span className="block text-xs text-muted-foreground">{item.secondaryText}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <p
        className={cn(
          'text-xs',
          error ? 'text-destructive' : hasResolvedCoords ? 'text-emerald-700' : 'text-muted-foreground',
        )}
      >
        {error || (loading ? 'Searching…' : helperText)}
      </p>
    </div>
  )
}
