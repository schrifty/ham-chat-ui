<script lang="ts">
    interface Props {
        classNames?: string;
    }

    let { classNames = "" }: Props = $props();
</script>

<div class="flex flex-col items-start {classNames}">
    <div class="text-lg font-semibold text-primary-500">Strategy Advisors</div>
    <div class="text-sm text-gray-600 dark:text-gray-400">Contextual Chat</div>
</div>
