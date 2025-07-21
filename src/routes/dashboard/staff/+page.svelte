<script>
    /** @type {import('./$types').PageData} */
    export let data;
    /** @type {import('./$types').ActionData} */
    export let form;

    $: ({ user, users, stats, recentTickets } = data);

    // Filter users list
    let searchTerm = '';
    $: filteredUsers = users.filter(u => 
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.id.includes(searchTerm)
    );

    function getPermissionLabel(permissions) {
        if (permissions & 4) return 'Admin';
        if (permissions & 2) return 'Staff';
        return 'User';
    }

    function getPermissionColor(permissions) {
        if (permissions & 4) return 'text-red-400';
        if (permissions & 2) return 'text-purple-400';
        return 'text-gray-400';
    }
</script>

<svelte:head>
    <title>KSuite - Staff Dashboard</title>
</svelte:head>

<div class="min-h-screen bg-slate-900 text-white p-6">
    <!-- Top Navigation -->
    <nav class="bg-slate-800 rounded-lg p-4 mb-6 flex justify-between items-center">
        <div class="flex items-center gap-6">
            <a href="/dashboard/user" class="text-2xl font-bold hover:text-purple-400 transition">KSuite</a>
            <span class="text-gray-400">Staff Dashboard</span>
        </div>
        <div class="flex items-center gap-4">
            {#if user.avatar}
                <img src={user.avatar} alt={user.username} class="w-10 h-10 rounded-full"/>
            {/if}
            <span class="text-purple-400">{user.username}</span>
            <form method="POST" action="/api/auth/logout">
                <button type="submit" class="bg-purple-600 px-4 py-2 rounded-lg hover:bg-purple-700 transition">
                    Logout
                </button>
            </form>
        </div>
    </nav>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div class="bg-slate-800 rounded-lg p-6">
            <h3 class="text-gray-400 mb-2">Total Users</h3>
            <p class="text-3xl font-bold text-purple-400">{stats.totalUsers}</p>
        </div>
        <div class="bg-slate-800 rounded-lg p-6">
            <h3 class="text-gray-400 mb-2">Total Tickets</h3>
            <p class="text-3xl font-bold text-purple-400">{stats.totalTickets}</p>
        </div>
        <div class="bg-slate-800 rounded-lg p-6">
            <h3 class="text-gray-400 mb-2">Open Tickets</h3>
            <p class="text-3xl font-bold text-green-400">{stats.openTickets}</p>
        </div>
        <div class="bg-slate-800 rounded-lg p-6">
            <h3 class="text-gray-400 mb-2">Closed Tickets</h3>
            <p class="text-3xl font-bold text-red-400">{stats.closedTickets}</p>
        </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- User Management -->
        <div class="lg:col-span-2">
            <div class="bg-slate-800 rounded-lg p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold">User Management</h2>
                    <input
                        type="text"
                        bind:value={searchTerm}
                        placeholder="Search users..."
                        class="bg-slate-700 rounded-lg px-4 py-2 text-white placeholder-gray-400"
                    />
                </div>

                {#if form?.message}
                    <div class="mb-4 p-4 rounded-lg {form.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}">
                        {form.message}
                    </div>
                {/if}

                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead>
                            <tr class="text-left text-gray-400 border-b border-gray-700">
                                <th class="pb-3">User</th>
                                <th class="pb-3">ID</th>
                                <th class="pb-3">Role</th>
                                <th class="pb-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {#each filteredUsers as u}
                                <tr class="border-b border-gray-700/50">
                                    <td class="py-4">
                                        <div class="flex items-center gap-3">
                                            {#if u.avatar}
                                                <img src={u.avatar} alt={u.username} class="w-8 h-8 rounded-full"/>
                                            {/if}
                                            <span>{u.username}</span>
                                        </div>
                                    </td>
                                    <td class="py-4 text-gray-400">{u.id}</td>
                                    <td class="py-4">
                                        <span class={getPermissionColor(u.permissions)}>
                                            {getPermissionLabel(u.permissions)}
                                        </span>
                                    </td>
                                    <td class="py-4">
                                        {#if user.permissions & 4} <!-- Admin only actions -->
                                            <form method="POST" action="?/updatePermissions" class="flex gap-2">
                                                <input type="hidden" name="userId" value={u.id}>
                                                {#if u.isStaff}
                                                    <button
                                                        name="action"
                                                        value="demote_staff"
                                                        class="bg-red-600/20 text-red-400 px-3 py-1 rounded hover:bg-red-600/30 transition"
                                                    >
                                                        Remove Staff
                                                    </button>
                                                {:else}
                                                    <button
                                                        name="action"
                                                        value="promote_staff"
                                                        class="bg-purple-600/20 text-purple-400 px-3 py-1 rounded hover:bg-purple-600/30 transition"
                                                    >
                                                        Make Staff
                                                    </button>
                                                {/if}

                                                {#if u.id !== user.id}
                                                    {#if u.isAdmin}
                                                        <button
                                                            name="action"
                                                            value="demote_admin"
                                                            class="bg-red-600/20 text-red-400 px-3 py-1 rounded hover:bg-red-600/30 transition"
                                                        >
                                                            Remove Admin
                                                        </button>
                                                    {:else}
                                                        <button
                                                            name="action"
                                                            value="promote_admin"
                                                            class="bg-red-600/20 text-red-400 px-3 py-1 rounded hover:bg-red-600/30 transition"
                                                        >
                                                            Make Admin
                                                        </button>
                                                    {/if}
                                                {/if}
                                            </form>
                                        {/if}
                                    </td>
                                </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Recent Tickets -->
        <div class="lg:col-span-1">
            <div class="bg-slate-800 rounded-lg p-6">
                <h2 class="text-xl font-bold mb-6">Recent Tickets</h2>
                <div class="space-y-4">
                    {#each recentTickets as ticket}
                        <div class="border-b border-gray-700 pb-4">
                            <div class="flex justify-between items-start mb-2">
                                <h3 class="font-medium">#{ticket.id}</h3>
                                <span class="px-2 py-1 rounded-full text-sm {
                                    ticket.status === 'open' ? 'bg-green-500/20 text-green-400' : 
                                    'bg-red-500/20 text-red-400'
                                }">
                                    {ticket.status}
                                </span>
                            </div>
                            <p class="text-gray-400 text-sm mb-2">{ticket.subject}</p>
                            <div class="flex justify-between text-xs text-gray-500">
                                <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                <a href="/tickets/{ticket.id}" class="text-purple-400 hover:text-purple-300">
                                    View Ticket →
                                </a>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    </div>
</div>