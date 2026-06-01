import {
  type ContentPost,
  uploadContentCover,
  useAdminContentPosts,
  useCreateContentPost,
  useCurrentUser,
  useDeleteContentPost,
  useUpdateContentPost,
  validateForm,
} from "@ark/api-client"
import {
  type AttachmentRef,
  AttachmentUploader,
  BackLink,
  Button,
  ConfirmDialog,
  DataTable,
  Icons,
  Input,
  Modal,
  ModalFooter,
  PageLoading,
  Select,
  StatusBadge,
  TableSkeleton,
  Textarea,
  THead,
  Th,
  Tr,
  toast,
} from "@ark/ui"
import { createEffect, createMemo, createSignal, For, Show } from "solid-js"
import { z } from "zod"
import { Footer, Navbar } from "@/components"

type PostFormState = {
  title: string
  slug: string
  excerpt: string
  content: string
  coverImageUrl: string
  seoTitle: string
  seoDescription: string
  published: boolean
  attachments: AttachmentRef[]
}

const emptyPost: PostFormState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImageUrl: "",
  seoTitle: "",
  seoDescription: "",
  published: false,
  attachments: [],
}

const attachmentSchema = z.object({
  name: z.string().trim().min(1).max(255),
  url: z.string().trim().url().max(1000),
  type: z.string().trim().max(50).optional(),
  size: z.number().int().nonnegative().optional(),
  uploadedAt: z.string().datetime().optional(),
})

const postSchema = z.object({
  title: z.string().trim().min(1, "Title required").max(220),
  slug: z
    .string()
    .trim()
    .min(1, "Slug required")
    .max(220)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens"),
  excerpt: z
    .string()
    .max(500)
    .transform(v => nullableTrim(v)),
  content: z.string().trim().min(1, "Content required"),
  coverImageUrl: z
    .string()
    .trim()
    .max(1000)
    .transform(v => nullableTrim(v))
    .refine(v => !v || z.string().url().safeParse(v).success, "Enter a valid URL"),
  seoTitle: z
    .string()
    .max(220)
    .transform(v => nullableTrim(v)),
  seoDescription: z
    .string()
    .max(500)
    .transform(v => nullableTrim(v)),
  published: z.boolean(),
  attachments: z.array(attachmentSchema),
})

const statusOptions = [
  { label: "Draft", value: false },
  { label: "Published", value: true },
]

function nullableTrim(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
}

function formFromPost(post: ContentPost): PostFormState {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? "",
    content: post.content,
    coverImageUrl: post.coverImageUrl ?? "",
    seoTitle: post.seoTitle ?? "",
    seoDescription: post.seoDescription ?? "",
    published: !!post.publishedAt,
    attachments: post.attachments ?? [],
  }
}

function formatDate(value: string | null): string {
  if (!value) return "—"
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value))
}

export default function AdminPostsPage() {
  const userQuery = useCurrentUser()
  const postsQuery = useAdminContentPosts()
  const createPost = useCreateContentPost()
  const updatePost = useUpdateContentPost()
  const deletePost = useDeleteContentPost()

  const [editorOpen, setEditorOpen] = createSignal(false)
  const [editingPost, setEditingPost] = createSignal<ContentPost | null>(null)
  const [deleteTarget, setDeleteTarget] = createSignal<ContentPost | null>(null)
  const [form, setForm] = createSignal<PostFormState>({ ...emptyPost })
  const [errors, setErrors] = createSignal<Record<string, string>>({})
  const [uploadingCover, setUploadingCover] = createSignal(false)
  const [slugTouched, setSlugTouched] = createSignal(false)

  createEffect(() => {
    if (typeof window === "undefined") return
    if (userQuery.isError) {
      window.location.href = "/login"
      return
    }
    if (userQuery.data && userQuery.data.role !== "admin") {
      window.location.href = "/"
    }
  })

  const isAdmin = () => userQuery.data?.role === "admin"
  const sortedPosts = createMemo(() => postsQuery.data ?? [])
  const publishedCount = createMemo(() => sortedPosts().filter(post => post.publishedAt).length)

  function resetEditor() {
    setEditingPost(null)
    setForm({ ...emptyPost })
    setErrors({})
    setSlugTouched(false)
  }

  function openCreate() {
    resetEditor()
    setEditorOpen(true)
  }

  function openEdit(post: ContentPost) {
    setEditingPost(post)
    setForm(formFromPost(post))
    setErrors({})
    setSlugTouched(true)
    setEditorOpen(true)
  }

  function closeEditor() {
    if (createPost.isPending || updatePost.isPending || uploadingCover()) return
    setEditorOpen(false)
  }

  async function submitPost(e: Event) {
    e.preventDefault()
    const parsed = validateForm(postSchema, form())
    if (!parsed.success) {
      setErrors(parsed.errors)
      return
    }
    setErrors({})

    try {
      const current = editingPost()
      if (current) {
        await updatePost.mutateAsync({ id: current.id, data: parsed.data })
        toast.success("Post updated")
      } else {
        await createPost.mutateAsync(parsed.data)
        toast.success("Post created")
      }
      setEditorOpen(false)
      resetEditor()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save post")
    }
  }

  async function uploadCover(file: File | undefined) {
    if (!file) return
    setUploadingCover(true)
    try {
      const result = await uploadContentCover(file)
      setForm({ ...form(), coverImageUrl: result.secure_url })
      toast.success("Cover uploaded")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cover upload failed")
    } finally {
      setUploadingCover(false)
    }
  }

  async function confirmDelete() {
    const target = deleteTarget()
    if (!target) return
    try {
      await deletePost.mutateAsync(target.id)
      toast.success("Post deleted")
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete post")
    }
  }

  return (
    <div class="min-h-screen bg-surface-muted flex flex-col">
      <Show when={!userQuery.isPending && isAdmin()} fallback={<PageLoading />}>
        <Navbar
          userName={`${userQuery.data?.firstName ?? ""} ${userQuery.data?.lastName ?? ""}`.trim()}
          userRole={userQuery.data?.role}
          userEmail={userQuery.data?.email}
          userPhotoUrl={userQuery.data?.photoUrl}
        />

        <main class="flex-1 px-6 sm:px-8 lg:px-12 py-8 sm:py-10">
          <div class="max-w-6xl mx-auto mt-4">
            <div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div class="mb-2">
                  <BackLink href="/">Dashboard</BackLink>
                </div>
                <h1 class="text-2xl font-bold text-foreground">Blog Posts</h1>
                <p class="text-sm text-muted mt-0.5">
                  Manage public Ark Institute articles from the ERP portal.
                </p>
              </div>
              <Button variant="primary" size="md" onClick={openCreate}>
                <Icons.plus class="w-4 h-4" /> New post
              </Button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div class="rounded-xl border border-border bg-surface px-5 py-4">
                <p class="text-xs font-medium uppercase tracking-wide text-muted">Total posts</p>
                <p class="mt-2 text-2xl font-bold text-foreground">{sortedPosts().length}</p>
              </div>
              <div class="rounded-xl border border-border bg-surface px-5 py-4">
                <p class="text-xs font-medium uppercase tracking-wide text-muted">Published</p>
                <p class="mt-2 text-2xl font-bold text-foreground">{publishedCount()}</p>
              </div>
              <div class="rounded-xl border border-border bg-surface px-5 py-4">
                <p class="text-xs font-medium uppercase tracking-wide text-muted">Drafts</p>
                <p class="mt-2 text-2xl font-bold text-foreground">
                  {sortedPosts().length - publishedCount()}
                </p>
              </div>
            </div>

            <div class="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
              <Show when={!postsQuery.isPending} fallback={<TableSkeleton rows={6} cols={5} />}>
                <Show
                  when={postsQuery.isError}
                  fallback={
                    <DataTable>
                      <THead>
                        <Th>Post</Th>
                        <Th>Status</Th>
                        <Th>Published</Th>
                        <Th>Updated</Th>
                        <Th align="right">Actions</Th>
                      </THead>
                      <tbody>
                        <For each={sortedPosts()}>
                          {post => (
                            <Tr>
                              <td class="px-6 py-4">
                                <p class="font-semibold text-foreground">{post.title}</p>
                                <div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                                  <span class="font-mono">/blog/{post.slug}</span>
                                  <Show when={post.coverImageUrl}>
                                    <a
                                      href={post.coverImageUrl ?? undefined}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      class="text-primary hover:underline"
                                    >
                                      Cover
                                    </a>
                                  </Show>
                                  <Show when={(post.attachments?.length ?? 0) > 0}>
                                    <span>
                                      {post.attachments?.length} attachment
                                      {post.attachments?.length === 1 ? "" : "s"}
                                    </span>
                                  </Show>
                                </div>
                              </td>
                              <td class="px-6 py-4">
                                <StatusBadge
                                  status={post.publishedAt ? "published" : "draft"}
                                  label={post.publishedAt ? "Published" : "Draft"}
                                />
                              </td>
                              <td class="px-6 py-4 text-sm text-muted">
                                {formatDate(post.publishedAt)}
                              </td>
                              <td class="px-6 py-4 text-sm text-muted">
                                {formatDate(post.updatedAt)}
                              </td>
                              <td class="px-6 py-4 text-right">
                                <div class="inline-flex items-center gap-2">
                                  <a
                                    href={`https://arkinstitutebc.com/blog/${post.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-muted transition-colors"
                                  >
                                    <Icons.eye class="w-3.5 h-3.5 text-muted" />
                                    View
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => openEdit(post)}
                                    class="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-surface-muted transition-colors"
                                  >
                                    <Icons.edit class="w-3.5 h-3.5 text-muted" />
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteTarget(post)}
                                    class="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
                                  >
                                    <Icons.trash class="w-3.5 h-3.5" />
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </Tr>
                          )}
                        </For>
                        <Show when={sortedPosts().length === 0}>
                          <tr>
                            <td colspan={5} class="px-6 py-12 text-center text-sm text-muted">
                              No blog posts yet.
                            </td>
                          </tr>
                        </Show>
                      </tbody>
                    </DataTable>
                  }
                >
                  <div class="p-12 text-center text-sm text-red-600">
                    Could not load posts. Please refresh.
                  </div>
                </Show>
              </Show>
            </div>
          </div>
        </main>

        <Footer />
      </Show>

      <Modal
        open={editorOpen()}
        onClose={closeEditor}
        title={editingPost() ? "Edit blog post" : "Create blog post"}
        size="xl"
      >
        <form onSubmit={submitPost} class="space-y-5">
          <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-5">
            <div class="space-y-5">
              <div class="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-4">
                <Input
                  label="Title"
                  value={form().title}
                  onInput={e => {
                    const title = e.currentTarget.value
                    setForm({
                      ...form(),
                      title,
                      slug: slugTouched() ? form().slug : slugify(title),
                    })
                  }}
                  error={errors().title}
                />
                <div class="flex flex-col gap-2">
                  <label for="post-status" class="text-sm font-medium text-foreground">
                    Status
                  </label>
                  <Select
                    id="post-status"
                    options={statusOptions}
                    value={form().published}
                    onChange={published => setForm({ ...form(), published })}
                    ariaLabel="Post status"
                  />
                </div>
              </div>

              <Input
                label="Slug"
                value={form().slug}
                onInput={e => {
                  setSlugTouched(true)
                  setForm({ ...form(), slug: slugify(e.currentTarget.value) })
                }}
                error={errors().slug}
              />

              <div class="rounded-xl border border-border bg-surface-muted/40 p-4">
                <p class="text-xs font-medium uppercase tracking-wide text-muted">Public path</p>
                <p class="mt-1 break-all font-mono text-sm text-foreground">
                  arkinstitutebc.com/blog/{form().slug || "post-slug"}
                </p>
              </div>

              <Textarea
                label="Excerpt"
                rows={3}
                value={form().excerpt}
                onInput={e => setForm({ ...form(), excerpt: e.currentTarget.value })}
                error={errors().excerpt}
              />

              <Textarea
                label="Content"
                rows={16}
                value={form().content}
                onInput={e => setForm({ ...form(), content: e.currentTarget.value })}
                error={errors().content}
                class="font-mono text-sm"
              />
            </div>

            <aside class="space-y-4">
              <section class="rounded-xl border border-border bg-surface p-4">
                <h3 class="text-sm font-semibold text-foreground">Cover image</h3>
                <Show when={form().coverImageUrl}>
                  <img
                    src={form().coverImageUrl}
                    alt=""
                    class="mt-3 h-36 w-full rounded-lg border border-border object-cover"
                  />
                </Show>
                <div class="mt-3 space-y-3">
                  <Input
                    label="Cover image URL"
                    value={form().coverImageUrl}
                    onInput={e => setForm({ ...form(), coverImageUrl: e.currentTarget.value })}
                    error={errors().coverImageUrl}
                  />
                  <label class="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-muted transition-colors cursor-pointer">
                    <Icons.upload class="w-4 h-4 text-muted" />
                    {uploadingCover() ? "Uploading…" : "Upload cover"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={uploadingCover()}
                      onChange={e => {
                        const target = e.currentTarget
                        uploadCover(target.files?.[0]).finally(() => {
                          target.value = ""
                        })
                      }}
                      class="hidden"
                    />
                  </label>
                </div>
              </section>

              <section class="rounded-xl border border-border bg-surface p-4">
                <h3 class="text-sm font-semibold text-foreground">Attachments</h3>
                <p class="mt-1 text-xs text-muted">
                  Add images or PDFs that should appear below the public article.
                </p>
                <div class="mt-3">
                  <AttachmentUploader
                    attachments={form().attachments}
                    onChange={attachments => setForm({ ...form(), attachments })}
                    signatureEndpoint="/api/admin/content/upload-signature/attachment"
                  />
                </div>
              </section>

              <section class="rounded-xl border border-border bg-surface p-4 space-y-3">
                <h3 class="text-sm font-semibold text-foreground">SEO</h3>
                <Input
                  label="SEO title"
                  value={form().seoTitle}
                  onInput={e => setForm({ ...form(), seoTitle: e.currentTarget.value })}
                  error={errors().seoTitle}
                />
                <Textarea
                  label="SEO description"
                  rows={3}
                  value={form().seoDescription}
                  onInput={e => setForm({ ...form(), seoDescription: e.currentTarget.value })}
                  error={errors().seoDescription}
                />
              </section>
            </aside>
          </div>

          <ModalFooter
            onCancel={closeEditor}
            submitInForm
            submitting={createPost.isPending || updatePost.isPending}
            submitLabel={editingPost() ? "Save changes" : "Create post"}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget()}
        onClose={() => setDeleteTarget(null)}
        title="Delete blog post"
        description={
          <span>
            Delete <strong>{deleteTarget()?.title}</strong>? This cannot be undone.
          </span>
        }
        danger
        pending={deletePost.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
