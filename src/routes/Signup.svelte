<script>
    import { authStore } from '$lib/stores/auth';
    
    let email = '';
    let password = '';
    let confirmPassword = '';
    let error = '';
    let loading = false;

    async function handleSubmit(e) {
        e.preventDefault();

        if (password !== confirmPassword) {
            error = 'Passwords do not match';
            return;
        }

        loading = true;
        error = '';

        try {
            await authStore.signup(email, password);
            // Redirect to home or dashboard after successful signup
        } catch (err) {
            error = err.message;
        } finally {
            loading = false;
        }
    }
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
        <div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Create your account
            </h2>
        </div>
        {#if error}
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <span class="block sm:inline">{error}</span>
            </div>
        {/if}
        <form class="mt-8 space-y-6" on:submit={handleSubmit}>
            <div class="rounded-md shadow-sm -space-y-px">
                <div>
                    <input
                        id="email-address"
                        name="email"
                        type="email"
                        required
                        class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                        placeholder="Email address"
                        bind:value={email}
                    />
                </div>
                <div>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                        placeholder="Password"
                        bind:value={password}
                    />
                </div>
                <div>
                    <input
                        id="confirm-password"
                        name="confirm-password"
                        type="password"
                        required
                        class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                        placeholder="Confirm password"
                        bind:value={confirmPassword}
                    />
                </div>
            </div>

            <div>
                <button
                    type="submit"
                    disabled={loading}
                    class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    {loading ? 'Creating account...' : 'Sign up'}
                </button>
            </div>
        </form>
    </div>
</div>
