<script>
    /** @type {import('./$types').PageData} */
    export let data;
    
    /** @type {import('./$types').ActionData} */
    export let form;

    $: ({ user } = data);

    let subject = '';
    let description = '';
    let category = 'general';
</script>

<svelte:head>
    <title>KSuite - New Ticket</title>
</svelte:head>

<div class="min-h-screen bg-slate-900 text-white p-6">
    <!-- Top Navigation Bar -->
    <nav class="bg-slate-800 rounded-lg p-4 mb-6 flex justify-between items-center">
        <div class="flex items-center gap-6">
            <a href="/dashboard/user" class="text-2xl font-bold hover:text-purple-400 transition">KSuite</a>
            <span class="text-gray-400">Create New Ticket</span>
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

    <!-- Ticket Form -->
    <div class="max-w-2xl mx-auto">
        <div class="bg-slate-800 rounded-lg p-6">
            <form method="POST" class="space-y-6">
                {#if form?.error}
                    <div class="bg-red-500/20 text-red-400 p-4 rounded-lg">
                        {form.error}
                    </div>
                {/if}

                <div>
                    <label for="category" class="block text-sm font-medium text-gray-400 mb-2">
                        Category
                    </label>
                    <select
                        name="category"
                        id="category"
                        bind:value={category}
                        class="w-full bg-slate-700 rounded-lg border-gray-600 text-white px-4 py-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                    >
                        <option value="general">General Support</option>
                        <option value="technical">Technical Issue</option>
                        <option value="billing">Billing</option>
                        <option value="feature">Feature Request</option>
                    </select>
                </div>

                <div>
                    <label for="subject" class="block text-sm font-medium text-gray-400 mb-2">
                        Subject
                    </label>
                    <input
                        type="text"
                        name="subject"
                        id="subject"
                        bind:value={subject}
                        class="w-full bg-slate-700 rounded-lg border-gray-600 text-white px-4 py-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                        minlength="5"
                        maxlength="100"
                    />
                </div>

                <div>
                    <label for="description" class="block text-sm font-medium text-gray-400 mb-2">
                        Description
                    </label>
                    <textarea
                        name="description"
                        id="description"
                        bind:value={description}
                        class="w-full bg-slate-700 rounded-lg border-gray-600 text-white px-4 py-2 focus:ring-purple-500 focus:border-purple-500 h-40"
                        required
                        minlength="20"
                        maxlength="2000"
                    ></textarea>
                    <p class="text-sm text-gray-400 mt-1">
                        Please provide as much detail as possible
                    </p>
                </div>

                <div class="flex justify-end">
                    <button
                        type="submit"
                        class="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
                    >
                        Submit Ticket
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>
