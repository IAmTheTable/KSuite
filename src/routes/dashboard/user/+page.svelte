<script>
    /** @type {import('./$types').PageData} */
    export let data;

    $: ({ user } = data);
</script>

<svelte:head>
    <title>KSuite - Dashboard</title>
</svelte:head>

<div class="min-h-screen bg-slate-900 text-white p-6">
    <!-- Top Navigation Bar -->
    <nav class="bg-slate-800 rounded-lg p-4 mb-6 flex justify-between items-center">
        <div class="text-2xl font-bold">KSuite Dashboard</div>
        <div class="flex items-center gap-4">
            {#if user.avatar}
                <img 
                    src={user.avatar} 
                    alt={user.name} 
                    class="w-10 h-10 rounded-full"
                />
            {/if}
            <span class="text-purple-400">{user.name}</span>
            <form method="POST" action="/api/auth/logout">
                <button type="submit" class="bg-purple-600 px-4 py-2 rounded-lg hover:bg-purple-700 transition">
                    Logout
                </button>
            </form>
        </div>
    </nav>

    <!-- Welcome Card -->
    <div class="bg-slate-800 rounded-lg p-8 max-w-3xl mx-auto text-center">
        <h1 class="text-3xl font-bold mb-4">Welcome to KSuite</h1>
        <p class="text-gray-300 mb-6">
            Your premium support and management dashboard
        </p>
        
        <!-- Quick Actions -->
        <div class="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
            <a href="/tickets/new" class="bg-purple-600 p-4 rounded-lg hover:bg-purple-700 transition text-center">
                Create New Ticket
            </a>
            <a href="/tickets" class="bg-purple-600 p-4 rounded-lg hover:bg-purple-700 transition text-center">
                View My Tickets
            </a>
            <a href="https://krnl.cat" class="bg-purple-600 p-4 rounded-lg hover:bg-purple-700 transition text-center">
                Download Client
            </a>
            <a href="/docs" class="bg-purple-600 p-4 rounded-lg hover:bg-purple-700 transition text-center">
                Support Documentation
            </a>
        </div>
    </div>
    
    <!-- Footer -->
    <footer class="mt-8 text-center text-gray-500 text-sm">
        <p class="mt-2">Need help? Contact our <a href="https://discord.gg/get-krnl" class="text-purple-400 hover:text-purple-300">support team</a></p>
    </footer>
</div>