<script lang="ts">
	import CarbonTrashCan from "~icons/carbon/trash-can";
	import CarbonArrowUpRight from "~icons/carbon/arrow-up-right";
	import CarbonAdd from "~icons/carbon/add";

	import { useSettingsStore } from "$lib/stores/settings";
	import Switch from "$lib/components/Switch.svelte";
	import { env as envPublic } from "$env/dynamic/public";
	import { goto } from "$app/navigation";
	import { error } from "$lib/stores/errors";
	import { base } from "$app/paths";
	import { page } from "$app/stores";

	let settings = useSettingsStore();
	let loading = $state(false);

	function handleDeleteConversations(e: Event) {
		e.preventDefault();
		if (confirm("Are you sure you want to delete all conversations?")) {
			fetch(`${base}/api/conversations`, {
				method: "DELETE",
			})
				.then(async () => {
					await goto(`${base}/`, { invalidateAll: true });
				})
				.catch((err) => {
					console.error(err);
					$error = err.message;
				});
		}
	}

	function handlePopulateDatabase(e: Event) {
		e.preventDefault();
		if (!confirm('Are you sure you want to populate the database with test data?')) return;
		
		loading = true;
		fetch(`${base}/api/populate`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ flags: ['all'] })
		})
			.then(async (res) => {
				const data = await res.json();
				if (!res.ok) {
					throw new Error(data.message || 'Failed to populate database');
				}
				alert(data.message);
				await goto(`${base}/`, { invalidateAll: true });
			})
			.catch((err) => {
				console.error('Population error:', err);
				$error = err.message;
			})
			.finally(() => {
				loading = false;
			});
	}
</script>

<div class="flex w-full flex-col gap-5">
	<h2 class="text-center text-xl font-semibold text-gray-800 md:text-left">Application Settings</h2>
	{#if !!envPublic.PUBLIC_COMMIT_SHA}
		<div class="flex flex-col items-start justify-between text-xl font-semibold text-gray-800">
			<a
				href={`https://github.com/huggingface/chat-ui/commit/${envPublic.PUBLIC_COMMIT_SHA}`}
				target="_blank"
				rel="noreferrer"
				class="text-sm font-light text-gray-500"
			>
				Latest deployment <span class="gap-2 font-mono"
					>{envPublic.PUBLIC_COMMIT_SHA.slice(0, 7)}</span
				>
			</a>
		</div>
	{/if}
	<div class="flex h-full max-w-2xl flex-col gap-2 max-sm:pt-0">
		{#if envPublic.PUBLIC_APP_DATA_SHARING === "1"}
			<label class="flex items-center">
				<Switch
					name="shareConversationsWithModelAuthors"
					bind:checked={$settings.shareConversationsWithModelAuthors}
				/>
				<div class="inline cursor-pointer select-none items-center gap-2 pl-2">
					Share conversations with model authors
				</div>
			</label>

			<p class="text-sm text-gray-500">
				Sharing your data will help improve the training data and make open models better over time.
			</p>
		{/if}
		<label class="mt-6 flex items-center">
			<Switch name="hideEmojiOnSidebar" bind:checked={$settings.hideEmojiOnSidebar} />
			<div class="inline cursor-pointer select-none items-center gap-2 pl-2 font-semibold">
				Hide emoticons in conversation topics
				<p class="text-sm font-normal text-gray-500">
					Emoticons are shown in the sidebar by default, enable this to hide them.
				</p>
			</div>
		</label>

		<label class="mt-6 flex items-center">
			<Switch name="disableStream" bind:checked={$settings.disableStream} />
			<div class="inline cursor-pointer select-none items-center gap-2 pl-2 font-semibold">
				Disable streaming tokens
			</div>
		</label>

		<label class="mt-6 flex items-center">
			<Switch name="directPaste" bind:checked={$settings.directPaste} />
			<div class="inline cursor-pointer select-none items-center gap-2 pl-2 font-semibold">
				Paste text directly into chat
				<p class="text-sm font-normal text-gray-500">
					By default, when pasting long text into the chat, we treat it as a plaintext file. Enable
					this to paste directly into the chat instead.
				</p>
			</div>
		</label>

		<div class="mt-12 flex flex-col gap-3">
			<a
				href="https://huggingface.co/spaces/huggingchat/chat-ui/discussions"
				target="_blank"
				rel="noreferrer"
				class="flex items-center underline decoration-gray-300 underline-offset-2 hover:decoration-gray-700"
				><CarbonArrowUpRight class="mr-1.5 shrink-0 text-sm " /> Share your feedback on HuggingChat</a
			>
			<button
				onclick={handleDeleteConversations}
				type="submit"
				class="flex items-center underline decoration-gray-300 underline-offset-2 hover:decoration-gray-700"
				><CarbonTrashCan class="mr-2 inline text-sm text-red-500" />Delete all conversations</button
			>
			<button
				onclick={handlePopulateDatabase}
				disabled={loading}
				class="flex items-center underline decoration-gray-300 underline-offset-2 hover:decoration-gray-700 disabled:opacity-50"
			>
				{#if loading}
					<div class="mr-2 inline h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
				{:else}
					<CarbonAdd class="mr-2 inline text-sm text-blue-500" />
				{/if}
				Populate database with test data
			</button>
		</div>
	</div>
</div>
