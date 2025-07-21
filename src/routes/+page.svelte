<!-- src/routes/+page.svelte -->
<script>
	let isHovering = false;
	import { getOAuthURL } from '$lib/discord/util.js';
</script>

<svelte:head>
	<title>KSuite - Login</title>
	<meta name="description" content="Login to Krnl - Multi-platform Luau scripting engine" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
	<!-- Animated background particles -->
	<div class="absolute inset-0">
		{#each Array(20) as _, i}
			<div 
				class="absolute w-1 h-1 bg-purple-400 rounded-full opacity-30 animate-pulse"
				style="left: {Math.random() * 100}%; top: {Math.random() * 100}%; animation-delay: {Math.random() * 3}s;"
			></div>
		{/each}
	</div>

	<!-- Main content -->
	<div class="relative z-10 flex min-h-screen items-center justify-center px-4">
		<div class="text-center max-w-2xl mx-auto">
			<!-- Logo/Brand -->
			<div class="mb-8">
				<h1 class="text-6xl md:text-7xl font-bold text-white mb-4 tracking-tight">
					KSuite
				</h1>
				<p class="text-xl md:text-2xl text-gray-300 mb-2">
					Welcome back
				</p>
				<p class="text-lg text-gray-400">
					Sign in to continue to your dashboard
				</p>
			</div>

			<!-- Login Card -->
			<div class="bg-slate-800/50 backdrop-blur-lg border border-purple-500/20 rounded-2xl p-8 shadow-2xl">
				<div class="mb-6">
					<h2 class="text-2xl font-semibold text-white mb-2">
						Authentication Required
					</h2>
					<p class="text-gray-400">
						Use your Discord account to securely access Krnl
					</p>
				</div>

				<!-- Discord Login Button -->
				<button
					class="group relative w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/25 focus:outline-none focus:ring-4 focus:ring-purple-500/50"
					on:mouseenter={() => isHovering = true}
					on:mouseleave={() => isHovering = false}
					on:click={() => {
						// Frontend only - would normally redirect to Discord OAuth
                        window.open(getOAuthURL(), '_blank');
					}}
				>
					<div class="flex items-center justify-center space-x-3">
						<!-- Discord Icon -->
						<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="flex-shrink-0">
							<path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
						</svg>
						
						<span class="text-lg">Continue with Discord</span>
						
						<!-- Arrow icon with hover animation -->
						<svg 
							width="20" 
							height="20" 
							viewBox="0 0 24 24" 
							fill="none" 
							stroke="currentColor" 
							stroke-width="2" 
							stroke-linecap="round" 
							stroke-linejoin="round"
							class="transition-transform duration-300 {isHovering ? 'translate-x-1' : ''}"
						>
							<path d="M5 12h14M12 5l7 7-7 7"/>
						</svg>
					</div>
				</button>

				<!-- Additional info -->
				<div class="mt-6 text-sm text-gray-400">
					<p>
						By continuing, you agree to our 
						<a href="#tos" class="text-purple-400 hover:text-purple-300 underline transition-colors">
							Terms of Service
						</a> 
						and 
						<a href="#privacy" class="text-purple-400 hover:text-purple-300 underline transition-colors">
							Privacy Policy
						</a>
					</p>
				</div>
			</div>

			<!-- Footer -->
			<div class="mt-8 text-gray-500 text-sm">
				<p>Need help? Contact our <a href="https://discord.gg/get-krnl" class="text-purple-400 hover:text-purple-300 transition-colors">support team</a></p>
			</div>
		</div>
	</div>

	<!-- Decorative elements -->
	<div class="absolute top-1/4 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
	<div class="absolute bottom-1/4 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
</div>

<style>
	@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
	
	:global(body) {
		font-family: 'Inter', sans-serif;
		margin: 0;
		padding: 0;
	}
	
	@keyframes pulse {
		0%, 100% {
			opacity: 0.3;
		}
		50% {
			opacity: 0.8;
		}
	}
</style>