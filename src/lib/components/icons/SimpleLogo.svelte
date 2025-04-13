<script lang="ts">
    interface Props {
        classNames?: string;
    }

    let { classNames = "" }: Props = $props();
</script>

<div class="flex items-center {classNames}">
    <div class="text-lg font-semibold text-primary-500">LKE</div>
</div>
