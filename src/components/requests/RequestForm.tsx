'use client'

import { useState } from 'react'
import AssetSelector from './AssetSelector'
import RequestAttachments from './RequestAttachments'
import { createRequestAction, updateRequestAction } from '@/app/actions/requests'
import { REQUEST_STATUSES } from '@/utils/constants'
import { deriveStatusFromPaperwork } from '@/utils/statusHelpers'
import type { RequestFormData } from '@/types/request'
import type { RequestWithAssets } from '@/services/requestService'
import type { AttachmentRow } from '@/services/documentService'

interface RequestFormProps {
  existing?: RequestWithAssets
  existingAttachments?: AttachmentRow[]
  onSuccess: () => void
  onCancel: () => void
}

const EMPTY_FORM: RequestFormData = {
  organization_name: '',
  event_name: '',
  purpose: '',
  date_submitted: '',
  event_date: '',
  event_end_date: '',
  start_time: '',
  end_time: '',
  venue: '',
  contact_person: '',
  adamson_email: '',
  secretary_signed: false,
  auditor_signed: false,
  president_approved: false,
  status: 'Pending',
  remarks: '',
  assets: [],
}

function toFormData(req: RequestWithAssets): RequestFormData {
  return {
    organization_name: req.organization_name,
    event_name: req.event_name,
    purpose: req.purpose ?? '',
    date_submitted: req.date_submitted ?? '',
    event_date: req.event_date,
    event_end_date: req.event_end_date ?? '',
    start_time: req.start_time ?? '',
    end_time: req.end_time ?? '',
    venue: req.venue,
    contact_person: req.contact_person ?? '',
    adamson_email: req.adamson_email ?? '',
    secretary_signed: req.secretary_signed,
    auditor_signed: req.auditor_signed,
    president_approved: req.president_approved,
    status: req.status,
    remarks: req.remarks ?? '',
    assets: req.request_assets.map((ra) => ({
      asset_id: ra.asset_id,
      asset_tag_number: ra.asset_tag_number ?? undefined,
      asset_description: ra.asset_description ?? undefined,
      quantity_requested: ra.quantity_requested,
    })),
  }
}

export default function RequestForm({ existing, existingAttachments = [], onSuccess, onCancel }: RequestFormProps) {
  const isEdit = !!existing
  const [form, setForm] = useState<RequestFormData>(existing ? toFormData(existing) : EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof RequestFormData, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  // Multi-day toggle — default off (single day), auto-on when editing a multi-day request
  const [multiDay, setMultiDay] = useState(!!(existing?.event_end_date))

  function set<K extends keyof RequestFormData>(key: K, value: RequestFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate(): boolean {
    const newErrors: typeof errors = {}
    if (!form.organization_name.trim()) newErrors.organization_name = 'Required'
    if (!form.event_name.trim()) newErrors.event_name = 'Required'
    if (!form.event_date) newErrors.event_date = 'Required'
    if (multiDay && !form.event_end_date) newErrors.event_date = 'End date is required for multi-day borrowing'
    if (multiDay && form.event_end_date && form.event_date && form.event_end_date < form.event_date) {
      newErrors.event_date = 'End date must be on or after the start date'
    }
    if (!form.venue.trim()) newErrors.venue = 'Required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setServerError(null)
    const submitData = multiDay ? form : { ...form, event_end_date: '' }
    const result = isEdit
      ? await updateRequestAction(existing!.id, submitData)
      : await createRequestAction(submitData)
    if (!result.success) {
      setServerError(result.error ?? 'Something went wrong')
      setSubmitting(false)
      return
    }
    onSuccess()
  }

  const inputClass = `
    w-full px-3 py-2 rounded-lg text-sm
    bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700
    text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
    focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent
    disabled:opacity-50
  `
  const labelClass = 'block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1'
  const errorClass = 'text-red-500 dark:text-red-400 text-xs mt-1'
  const sectionHeading = 'text-gray-900 dark:text-white text-sm font-semibold mb-4 pb-2 border-b border-gray-200 dark:border-gray-800'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Section 1: Request Details */}
      <section>
        <h3 className={sectionHeading}>Request Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Organization Name *</label>
            <input type="text" value={form.organization_name} onChange={(e) => set('organization_name', e.target.value)} placeholder="e.g. Computer Science Society" className={inputClass} disabled={submitting} />
            {errors.organization_name && <p className={errorClass}>{errors.organization_name}</p>}
          </div>
          <div>
            <label className={labelClass}>Event Name *</label>
            <input type="text" value={form.event_name} onChange={(e) => set('event_name', e.target.value)} placeholder="e.g. JS Workshop 2025" className={inputClass} disabled={submitting} />
            {errors.event_name && <p className={errorClass}>{errors.event_name}</p>}
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Purpose</label>
            <input type="text" value={form.purpose ?? ''} onChange={(e) => set('purpose', e.target.value)} placeholder="Brief description of the event purpose" className={inputClass} disabled={submitting} />
          </div>
          <div>
            <label className={labelClass}>Date Submitted</label>
            <input type="date" value={form.date_submitted ?? ''} onChange={(e) => set('date_submitted', e.target.value)} className={inputClass} disabled={submitting} />
          </div>
          <div>
            <label className={labelClass}>Event Date *</label>
            <input type="date" value={form.event_date} onChange={(e) => {
              set('event_date', e.target.value)
              // Clear end date if it's now before the new start date
              if (form.event_end_date && e.target.value > form.event_end_date) {
                set('event_end_date', '')
              }
            }} className={inputClass} disabled={submitting} />
            {errors.event_date && <p className={errorClass}>{errors.event_date}</p>}
          </div>

          {/* Multi-day toggle + end date */}
          <div className="md:col-span-2">
            <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
              <div
                onClick={() => {
                  const next = !multiDay
                  setMultiDay(next)
                  if (!next) set('event_end_date', '')
                }}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 cursor-pointer ${multiDay ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${multiDay ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Multi-day borrowing</span>
            </label>
            {multiDay && (
              <div className="mt-2">
                <label className={labelClass}>Event End Date *</label>
                <input
                  type="date"
                  value={form.event_end_date ?? ''}
                  min={form.event_date || undefined}
                  onChange={(e) => set('event_end_date', e.target.value)}
                  className={inputClass}
                  disabled={submitting}
                />
                {form.event_end_date && form.event_date && form.event_end_date < form.event_date && (
                  <p className={errorClass}>End date must be on or after the start date</p>
                )}
              </div>
            )}
          </div>
          <div>
            <label className={labelClass}>Start Time</label>
            <input type="time" value={form.start_time ?? ''} onChange={(e) => set('start_time', e.target.value)} className={inputClass} disabled={submitting} />
          </div>
          <div>
            <label className={labelClass}>End Time</label>
            <input type="time" value={form.end_time ?? ''} onChange={(e) => set('end_time', e.target.value)} className={inputClass} disabled={submitting} />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Venue / Location *</label>
            <input type="text" value={form.venue} onChange={(e) => set('venue', e.target.value)} placeholder="e.g. AVR 3rd Floor, Main Building" className={inputClass} disabled={submitting} />
            {errors.venue && <p className={errorClass}>{errors.venue}</p>}
          </div>
          <div>
            <label className={labelClass}>Contact Person</label>
            <input type="text" value={form.contact_person ?? ''} onChange={(e) => set('contact_person', e.target.value)} placeholder="Name of RSO contact" className={inputClass} disabled={submitting} />
          </div>
          <div>
            <label className={labelClass}>Adamson Email</label>
            <input type="email" value={form.adamson_email ?? ''} onChange={(e) => set('adamson_email', e.target.value)} placeholder="e.g. orgname@adamson.edu.ph" className={inputClass} disabled={submitting} />
          </div>
        </div>
      </section>

      {/* Section 2: Assets Requested */}
      <section>
        <h3 className={sectionHeading}>Assets Requested</h3>
        <AssetSelector value={form.assets} onChange={(assets) => set('assets', assets)} eventDate={form.event_date || undefined} eventEndDate={form.event_end_date || undefined} excludeRequestId={existing?.id} />
      </section>

      {/* Section 3: Paperwork Status */}
      <section>
        <h3 className={sectionHeading}>Paperwork Status</h3>
        <p className="text-gray-500 text-xs mb-3">
          Check each box after the physical form has been signed in real life. All three are optional.
        </p>
        <div className="space-y-3">
          {([
            { key: 'secretary_signed', label: 'Secretary Signed' },
            { key: 'auditor_signed', label: 'Auditor Signed' },
            { key: 'president_approved', label: 'President Approved' },
          ] as const).map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => {
                  const checked = e.target.checked
                  setForm((prev) => {
                    const next = { ...prev, [key]: checked }
                    const derived = deriveStatusFromPaperwork(next.secretary_signed, next.auditor_signed, next.president_approved, prev.status)
                    return { ...next, status: derived }
                  })
                  setErrors((prev) => ({ ...prev, [key]: undefined }))
                }}
                disabled={submitting}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-blue-600 focus:ring-blue-600 focus:ring-offset-white dark:focus:ring-offset-gray-900"
              />
              <span className="text-gray-700 dark:text-gray-300 text-sm">{label}</span>
            </label>
          ))}
        </div>
        <div className={`mt-3 px-3 py-2 rounded-lg text-xs ${
          form.secretary_signed && form.auditor_signed && form.president_approved
            ? 'bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400'
            : 'bg-gray-100 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-gray-500'
        }`}>
          {form.secretary_signed && form.auditor_signed && form.president_approved
            ? '✓ All required signatures are complete. This request will be marked as Approved.'
            : 'Request remains Pending until all required signatures are complete.'}
        </div>
      </section>

      {/* Section 4: Final Status */}
      <section>
        <h3 className={sectionHeading}>Final Status</h3>
        <p className="text-gray-500 text-xs mb-3">Status is set automatically based on paperwork. You can also override it manually.</p>
        <div>
          <label className={labelClass}>Status</label>
          <select value={form.status} onChange={(e) => set('status', e.target.value as typeof form.status)} disabled={submitting} className={inputClass}>
            {REQUEST_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </section>

      {/* Section 5: Remarks */}
      <section>
        <h3 className={sectionHeading}>Remarks</h3>
        <textarea value={form.remarks ?? ''} onChange={(e) => set('remarks', e.target.value)} rows={3} placeholder="Optional notes or remarks…" disabled={submitting} className={`${inputClass} resize-none`} />
      </section>

      {/* Section 6: Attachments (edit mode only) */}
      {isEdit && existing && (
        <section>
          <h3 className={sectionHeading}>Scanned Paperwork / Attachments</h3>
          <RequestAttachments requestId={existing.id} initialAttachments={existingAttachments} />
        </section>
      )}

      {serverError && (
        <div className="px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 text-sm">
          {serverError}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} disabled={submitting} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors disabled:opacity-50">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
          {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Log Request'}
        </button>
      </div>

    </form>
  )
}
