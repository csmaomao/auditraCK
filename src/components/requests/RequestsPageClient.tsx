'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import RequestTable from './RequestTable'
import RequestForm from './RequestForm'
import RequestViewModal from './RequestViewModal'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import SearchInput from '@/components/common/SearchInput'
import FilterTabs from '@/components/common/FilterTabs'
import EmptyState from '@/components/common/EmptyState'
import { deleteRequestAction } from '@/app/actions/requests'
import { createClient } from '@/lib/supabase/client'
import { REQUEST_STATUSES } from '@/utils/constants'
import type { RequestRow, RequestWithAssets } from '@/services/requestService'
import type { AttachmentRow } from '@/services/documentService'

interface RequestsPageClientProps {
  initialRequests: RequestRow[]
  initialCount: number
}

const STATUS_FILTERS = ['All', ...REQUEST_STATUSES]

export default function RequestsPageClient({
  initialRequests,
  initialCount,
}: RequestsPageClientProps) {
  const router = useRouter()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [editingRequest, setEditingRequest] = useState<RequestWithAssets | null>(null)
  const [editAttachments, setEditAttachments] = useState<AttachmentRow[]>([])
  const [loadingEdit, setLoadingEdit] = useState(false)
  const [viewingRequest, setViewingRequest] = useState<RequestWithAssets | null>(null)
  const [viewAttachments, setViewAttachments] = useState<AttachmentRow[]>([])
  const [loadingView, setLoadingView] = useState(false)
  const [deletingRequest, setDeletingRequest] = useState<RequestRow | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const filtered = initialRequests.filter((req) => {
    const matchesStatus = statusFilter === 'All' || req.status === statusFilter
    const term = search.toLowerCase()
    const matchesSearch =
      !term ||
      req.organization_name.toLowerCase().includes(term) ||
      req.event_name.toLowerCase().includes(term)
    return matchesStatus && matchesSearch
  })

  async function handleViewClick(req: RequestRow) {
    setLoadingView(true)
    const supabase = createClient()
    const [requestResult, assetsResult, attachmentsResult] = await Promise.all([
      supabase.from('requests').select('id, organization_name, event_name, purpose, date_submitted, event_date, event_end_date, start_time, end_time, venue, contact_person, adamson_email, secretary_signed, auditor_signed, president_approved, status, remarks, created_at, updated_at').eq('id', req.id).single(),
      supabase.from('request_assets').select('id, request_id, asset_id, asset_tag_number, asset_description, quantity_requested, quantity_returned, remarks').eq('request_id', req.id),
      supabase.from('documents').select('id, request_id, file_name, file_type, document_type, storage_path, uploaded_at').eq('request_id', req.id).order('uploaded_at', { ascending: false }),
    ])
    if (requestResult.data) {
      setViewingRequest({ ...requestResult.data, request_assets: assetsResult.data ?? [] } as RequestWithAssets)
      setViewAttachments((attachmentsResult.data ?? []) as AttachmentRow[])
    }
    setLoadingView(false)
  }

  async function handleEditClick(req: RequestRow) {
    setLoadingEdit(true)
    const supabase = createClient()
    const [requestResult, assetsResult, attachmentsResult] = await Promise.all([
      supabase.from('requests').select('id, organization_name, event_name, purpose, date_submitted, event_date, event_end_date, start_time, end_time, venue, contact_person, adamson_email, secretary_signed, auditor_signed, president_approved, status, remarks, created_at, updated_at').eq('id', req.id).single(),
      supabase.from('request_assets').select('id, request_id, asset_id, asset_tag_number, asset_description, quantity_requested, quantity_returned, remarks').eq('request_id', req.id),
      supabase.from('documents').select('id, request_id, file_name, file_type, document_type, storage_path, uploaded_at').eq('request_id', req.id).order('uploaded_at', { ascending: false }),
    ])
    if (requestResult.data) {
      setEditingRequest({ ...requestResult.data, request_assets: assetsResult.data ?? [] } as RequestWithAssets)
      setEditAttachments((attachmentsResult.data ?? []) as AttachmentRow[])
    }
    setLoadingEdit(false)
    setShowForm(true)
  }

  function handleFormSuccess() {
    setShowForm(false)
    setEditingRequest(null)
    setEditAttachments([])
    router.refresh()
  }

  function handleFormCancel() {
    setShowForm(false)
    setEditingRequest(null)
    setEditAttachments([])
  }

  async function handleDeleteConfirm() {
    if (!deletingRequest) return
    setDeleteLoading(true)
    const result = await deleteRequestAction(deletingRequest.id)
    setDeleteLoading(false)
    setDeletingRequest(null)
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error ?? 'Failed to delete request')
    }
  }

  return (
    <div className="space-y-6">

      {/* Page heading */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-gray-900 dark:text-white text-xl font-semibold">Requests</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {initialCount} total request{initialCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setEditingRequest(null); setShowForm(true) }}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">Log Request</span>
          <span className="sm:hidden">Log</span>
        </button>
      </div>

      {/* Search + filter toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="w-full sm:w-72">
          <SearchInput placeholder="Search by organization or event…" onChange={setSearch} />
        </div>
        <FilterTabs options={STATUS_FILTERS} active={statusFilter} onChange={setStatusFilter} />
      </div>

      {/* Requests table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
        {filtered.length === 0 ? (
          <EmptyState
            message={
              search || statusFilter !== 'All'
                ? 'No requests match your search or filter.'
                : 'No requests logged yet. Click "Log Request" to add the first one.'
            }
          />
        ) : (
          <RequestTable
            requests={filtered}
            onView={handleViewClick}
            onEdit={handleEditClick}
            onDelete={(req) => setDeletingRequest(req)}
          />
        )}
      </div>

      {/* Loading overlay */}
      {(loadingEdit || loadingView) && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="text-white text-sm">Loading request…</div>
        </div>
      )}

      {/* View modal */}
      {viewingRequest && (
        <RequestViewModal
          request={viewingRequest}
          attachments={viewAttachments}
          onClose={() => { setViewingRequest(null); setViewAttachments([]) }}
        />
      )}

      {/* Log Request / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 bg-black/60 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl my-4 sm:my-8">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-gray-900 dark:text-white text-base font-semibold">
                {editingRequest ? 'Edit Request' : 'Log New Request'}
              </h2>
              <button
                type="button"
                onClick={handleFormCancel}
                className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-4 sm:px-6 py-5">
              <RequestForm
                existing={editingRequest ?? undefined}
                existingAttachments={editAttachments}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={!!deletingRequest}
        title="Delete request?"
        message={`This will permanently delete "${deletingRequest?.event_name}" and all its associated assets and attachments. This cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingRequest(null)}
      />

    </div>
  )
}
