<script lang="ts">
    import { browser } from '$app/environment';
    import { signIn, user } from '$lib/stores/auth';
    import { env as envPublic } from "$env/dynamic/public";
    import Logo from "$lib/components/icons/Logo.svelte";
    import { goto } from '$app/navigation';

    let email = '';
    let password = '';
    let error = '';
    let loading = false;
    let showPassword = false;
    let rememberMe = browser ? localStorage.getItem('rememberMe') === 'true' : false;

    async function handleLogin() {
        loading = true;
        error = '';
        
        try {
            await signIn(email, password);
            if (rememberMe) {
                localStorage.setItem('rememberMe', 'true');
            } else {
                localStorage.removeItem('rememberMe');
            }
            
            // Wait for the user store to be updated
            await new Promise<void>((resolve) => {
                const unsubscribe = user.subscribe((value) => {
                    if (value) {
                        unsubscribe();
                        resolve();
                    }
                });
            });
            
            // Use SvelteKit's goto for navigation
            await goto('/');
        } catch (e: any) {
            error = e?.message || 'An error occurred';
        } finally {
            loading = false;
        }
    }
</script>

<div class="grid h-screen w-screen place-items-center bg-gray-50/50 p-4 dark:bg-gray-900/50">
    <div class="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-800">
        <div class="mb-8 flex items-center justify-center gap-2 text-2xl font-semibold">
            <Logo classNames="flex-none" />
            {envPublic.PUBLIC_APP_NAME}
        </div>
    <form on:submit|preventDefault={handleLogin}>
        <div class="space-y-4">
            <div>
                <input 
                    type="email" 
                    bind:value={email} 
                    placeholder="Email" 
                    required 
                    disabled={loading}
                    class="w-full rounded-lg border bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:disabled:bg-gray-900"
                />
            </div>

            <div class="relative">
                <input 
                    type={showPassword ? 'text' : 'password'} 
                    bind:value={password} 
                    placeholder="Password" 
                    required 
                    disabled={loading}
                    class="w-full rounded-lg border bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:disabled:bg-gray-900"
                />
                <button 
                    type="button" 
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400" 
                    on:click={() => showPassword = !showPassword}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
            </div>
        </div>

        <label class="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <input 
                type="checkbox" 
                bind:checked={rememberMe} 
                disabled={loading}
                class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800"
            >
            Keep me signed in
        </label>

        {#if error}
            <div class="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-500 dark:bg-red-900/50 dark:text-red-400" role="alert">
                <span class="text-lg">⚠️</span>
                <span>{error}</span>
            </div>
        {/if}

        <button 
            type="submit" 
            disabled={loading} 
            class="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-offset-gray-800 dark:disabled:bg-blue-400"
        >
            {loading ? 'Logging in...' : 'Login'}
        </button>
    </form>
    </div>
</div>


