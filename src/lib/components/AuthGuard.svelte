<script>
    import { authStore } from '$lib/stores/auth';
    import { goto } from '$app/navigation';
    
    export let redirectTo = '/login';
    
    $: if (!$authStore.loading && !$authStore.user) {
        goto(redirectTo);
    }
</script>

{#if $authStore.loading}
    <div class="flex items-center justify-center min-h-screen">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
{:else if $authStore.user}
    <slot />
{/if}
