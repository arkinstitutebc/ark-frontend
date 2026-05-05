export default function ErrorPage() {
  return (
    <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div class="text-center">
        <h1 class="text-4xl font-semibold text-gray-900 mb-4">Page Not Found</h1>
        <p class="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
        <a
          href="/"
          class="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg font-medium hover:opacity-90"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  )
}
