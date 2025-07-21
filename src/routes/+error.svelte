<script>
    import { page } from '$app/stores';
</script>

<div class="min-h-screen bg-slate-900 flex items-center justify-center p-4">
    <div class="bg-slate-800 rounded-lg p-8 max-w-md w-full text-center">
        <h1 class="text-4xl font-bold text-purple-400 mb-4">
            {$page.status}
        </h1>
        <p class="text-xl text-white mb-6">
            {$page.error?.message || 'Something went wrong'}
        </p>
        <div class="space-y-4">
            <p class="text-gray-400">
                Don't worry, our team has been notified of this issue.
            </p>
            <a href="/" class="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition">
                Return to Home
            </a>
        </div>
    </div>
</div>