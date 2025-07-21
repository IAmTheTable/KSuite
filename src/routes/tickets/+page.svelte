<script>
    /** @type {import('./$types').PageData} */
    export let data;

    $: ({ tickets, user } = data);
</script>

<svelte:head>
    <title>KSuite - Tickets</title>
</svelte:head>

<div class="min-h-screen bg-slate-900 text-white p-6">
    <!-- Top Navigation Bar -->
    <nav class="bg-slate-800 rounded-lg p-4 mb-6 flex justify-between items-center">
        <a href="/dashboard/user" class="text-2xl font-bold hover:text-purple-400 transition">KSuite</a>
        <div class="flex items-center gap-4">
            {#if user.avatar}
                <img src={user.avatar} alt={user.name} class="w-10 h-10 rounded-full"/>
            {/if}
            <span class="text-purple-400">{user.name}</span>
            <a href="/dashboard/user" class="text-purple-400 hover:text-purple-300">
                Dashboard
            </a>
        </div>
    </nav>

    <!-- Ticket Actions -->
    <div class="mb-6">
        <a href="/tickets/new" class="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition">
            Create New Ticket
        </a>
    </div>

    <!-- Tickets List -->
    <div class="grid gap-4">
        {#if tickets.length > 0}
            {#each tickets as ticket}
                <div class="bg-slate-800 rounded-lg p-6">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="text-xl font-semibold mb-2">#{ticket.id} - {ticket.subject}</h3>
                            <p class="text-gray-400 mb-4">{ticket.description}</p>
                            <div class="flex gap-4 text-sm">
                                <span class="px-3 py-1 rounded-full {ticket.status === 'open' ? 'bg-green-500/20 text-green-400' : 
                                    ticket.status === 'closed' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}">
                                    {ticket.status}
                                </span>
                                <span class="text-gray-400">Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                                <span class="text-gray-400">Last Updated: {new Date(ticket.updatedAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <a href="/tickets/{ticket.id}" class="bg-purple-600 px-4 py-2 rounded-lg hover:bg-purple-700 transition">
                            View Details
                        </a>
                    </div>
                </div>
            {/each}
        {:else}
            <div class="bg-slate-800 rounded-lg p-8 text-center">
                <p class="text-gray-400 mb-4">No tickets found</p>
                <a href="/tickets/new" class="text-purple-400 hover:text-purple-300">Create your first ticket</a>
            </div>
        {/if}
    </div>
</div>