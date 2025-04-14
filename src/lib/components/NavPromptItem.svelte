<script lang="ts">
    import type { Prompt } from "$lib/types/Prompt";
    import { createEventDispatcher } from "svelte";

    interface Props {
        prompt: Prompt;
    }

    let { prompt }: Props = $props();

    const dispatch = createEventDispatcher<{
        message: string;
    }>();

    function handleClick() {
        dispatch('message', prompt.command);
    }
</script>

<button
    class="flex h-10 flex-none items-center gap-1.5 rounded-lg pl-2.5 pr-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 sm:h-[2.35rem]"
    onclick={handleClick}
>
    <div class="flex flex-1 items-center truncate">
        {prompt.title}
    </div>
</button>
