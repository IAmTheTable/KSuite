<script>
    /** @type {import('./$types').PageData} */
    export let data;

    $: ({ ticket, user } = data);

    let newMessage = '';

    function formatDate(dateString) {
        return new Date(dateString).toLocaleString();
    }
</script>

<svelte:head>
    <title>KSuite - Ticket #{ticket.id}</title>
</svelte:head>

<div class="min-h-screen bg-slate-900 text-white p-6">
    <!-- Top Navigation Bar -->
    <nav class="bg-slate-800 rounded-lg p-4 mb-6 flex justify-between items-center">
        <div class="flex items-center gap-6">
            <a href="/dashboard/user" class="text-2xl font-bold hover:text-purple-400 transition">KSuite</a>
            <span class="text-gray-400">Ticket #{ticket.id}</span>
        </div>
        <div class="flex items-center gap-4">
            {#if user.avatar}
                <img src={user.avatar} alt={user.name} class="w-10 h-10 rounded-full"/>
            {/if}
            <span class="text-purple-400">{user.name}</span>
            <a href="/tickets" class="text-purple-400 hover:text-purple-300">
                Back to Tickets
            </a>
        </div>
    </nav>

    <!-- Ticket Details -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-3">
            <!-- Ticket Header -->
            <div class="bg-slate-800 rounded-lg p-6 mb-6">
                <h1 class="text-2xl font-bold mb-4">{ticket.subject}</h1>
                <div class="flex flex-wrap gap-4 text-sm mb-4">
                    <span class="px-3 py-1 rounded-full {ticket.status === 'open' ? 'bg-green-500/20 text-green-400' : 
                        ticket.status === 'closed' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}">
                        {ticket.status}
                    </span>
                    <span class="text-gray-400">Category: {ticket.category}</span>
                    <span class="text-gray-400">Created: {formatDate(ticket.createdAt)}</span>
                    <span class="text-gray-400">Last Updated: {formatDate(ticket.updatedAt)}</span>
                </div>
                <p class="text-gray-300 whitespace-pre-wrap">{ticket.description}</p>
            </div>

            <!-- Ticket Transcript -->
            <div class="space-y-4 mb-6">
                {#each ticket.transcript as message}
                    <div class="bg-slate-800 rounded-lg p-4">
                        <div class="flex items-start gap-4">
                            {#if message.userAvatar}
                                <img src={message.userAvatar} alt={message.userName} class="w-8 h-8 rounded-full"/>
                            {/if}
                            <div class="flex-1">
                                <div class="flex justify-between items-center mb-2">
                                    <span class="font-medium {message.isStaff ? 'text-purple-400' : 'text-gray-300'}">
                                        {message.userName}
                                    </span>
                                    <span class="text-sm text-gray-500">{formatDate(message.timestamp)}</span>
                                </div>
                                <p class="text-gray-300 whitespace-pre-wrap">{message.content}</p>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>

            <!-- Reply Form -->
            {#if ticket.status === 'open'}
                <form method="POST" class="bg-slate-800 rounded-lg p-6">
                    <div class="mb-4">
                        <label for="message" class="block text-sm font-medium text-gray-400 mb-2">
                            Add Reply
                        </label>
                        <textarea
                            name="message"
                            id="message"
                            bind:value={newMessage}
                            class="w-full bg-slate-700 rounded-lg border-gray-600 text-white px-4 py-2 focus:ring-purple-500 focus:border-purple-500 h-32"
                            required
                            minlength="1"
                            maxlength="2000"
                        ></textarea>
                    </div>
                    <div class="flex justify-end">
                        <button
                            type="submit"
                            class="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
                        >
                            Send Reply
                        </button>
                    </div>
                </form>
            {:else}
                <div class="bg-slate-800 rounded-lg p-6 text-center">
                    <p class="text-gray-400">This ticket is closed</p>
                </div>
            {/if}
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-1">
            <div class="bg-slate-800 rounded-lg p-6">
                <h2 class="text-lg font-semibold mb-4">Ticket Actions</h2>
                {#if ticket.status === 'open'}
                    <form method="POST">
                        <input type="hidden" name="action" value="close"/>
                        <button
                            type="submit"
                            class="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition mb-2"
                        >
                            Close Ticket
                        </button>
                    </form>
                {:else}
                    <form method="POST">
                        <input type="hidden" name="action" value="reopen"/>
                        <button
                            type="submit"
                            class="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition mb-2"
                        >
                            Reopen Ticket
                        </button>
                    </form>
                {/if}
            </div>
        </div>
    </div>
</div>
