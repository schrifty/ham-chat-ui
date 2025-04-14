<script lang="ts">
	import "../styles/main.css";

	import { onDestroy, onMount, untrack } from "svelte";
	import { goto } from "$app/navigation";
	import { pendingMessage } from "$lib/stores/pendingMessage";
	import { base } from "$app/paths";
	import { page } from "$app/stores";

	import { env as envPublic } from "$env/dynamic/public";

	import { error } from "$lib/stores/errors";
	import { createSettingsStore } from "$lib/stores/settings";

	import { shareConversation } from "$lib/shareConversation";

	import Toast from "$lib/components/Toast.svelte";
	import NavMenu from "$lib/components/NavMenu.svelte";
	import MobileNav from "$lib/components/MobileNav.svelte";
	import titleUpdate from "$lib/stores/titleUpdate";
	import DisclaimerModal from "$lib/components/DisclaimerModal.svelte";
	import ExpandNavigation from "$lib/components/ExpandNavigation.svelte";
	import { loginModalOpen } from "$lib/stores/loginModal";
	import LoginModal from "$lib/components/LoginModal.svelte";
	import OverloadedModal from "$lib/components/OverloadedModal.svelte";
	import { isHuggingChat } from "$lib/utils/isHuggingChat";

	interface Conversation {
		id: string;
		title: string;
	}

	interface Settings {
		shareConversationsWithModelAuthors: boolean;
		hideEmojiOnSidebar: boolean;
		ethicsModalAccepted: boolean;
		ethicsModalAcceptedAt: Date | null;
		activeModel: string;
		customPrompts: Record<string, any>;
		assistants: any[];
		tools: any[];
		disableStream: boolean;
		directPaste: boolean;
	}

	interface Data {
		conversations: Conversation[];
		shared: boolean;
		models: any[];
		oldModels: any[];
		canLogin: boolean;
		user: any;
		assistant: any;
		loginEnabled: boolean;
		settings: Settings;
	}

	let { data, children } = $props<{ data: Data }>();

	let conversations = $state(data.conversations);
	$effect(() => {
		data.conversations && untrack(() => (conversations = data.conversations));
	});

	let isNavCollapsed = $state(false);

	let overloadedModalOpen = $state(false);

	let errorToastTimeout: ReturnType<typeof setTimeout>;
	let currentError: string | undefined = $state();

	async function onError() {
		// If a new different error comes, wait for the current error to hide first
		if ($error && currentError && $error !== currentError) {
			clearTimeout(errorToastTimeout);
			currentError = undefined;
			await new Promise((resolve) => setTimeout(resolve, 300));
		}

		currentError = $error;

		if (currentError === "Model is overloaded") {
			overloadedModalOpen = true;
		}
		errorToastTimeout = setTimeout(() => {
			$error = undefined;
			currentError = undefined;
		}, 10000);
	}

	async function deleteConversation(id: string) {
		try {
			const res = await fetch(`${base}/conversation/${id}`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!res.ok) {
				$error = "Error while deleting conversation, try again.";
				return;
			}

			conversations = conversations.filter((conv: Conversation) => conv.id !== id);

			if ($page.params.id === id) {
				await goto(`${base}/`, { invalidateAll: true });
			}
		} catch (err) {
			console.error(err);
			$error = String(err);
		}
	}

	async function editConversationTitle(id: string, title: string) {
		try {
			const res = await fetch(`${base}/conversation/${id}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ title }),
			});

			if (!res.ok) {
				$error = "Error while editing title, try again.";
				return;
			}

			conversations = conversations.map((conv: Conversation) => (conv.id === id ? { ...conv, title } : conv));
		} catch (err) {
			console.error(err);
			$error = String(err);
		}
	}

	onDestroy(() => {
		clearTimeout(errorToastTimeout);
	});

	$effect(() => {
		if ($error) onError();
	});

	$effect(() => {
		if ($titleUpdate) {
			const convIdx = conversations.findIndex(({ id }: { id: string }) => id === $titleUpdate?.convId);

			if (convIdx != -1) {
				conversations[convIdx].title = $titleUpdate?.title ?? conversations[convIdx].title;
			}

			$titleUpdate = null;
		}
	});

	const settings = createSettingsStore(data.settings ?? {
		shareConversationsWithModelAuthors: false,
		hideEmojiOnSidebar: false,
		ethicsModalAccepted: false,
		ethicsModalAcceptedAt: null,
		activeModel: 'default',
		customPrompts: {},
		assistants: [],
		tools: [],
		disableStream: false,
		directPaste: false
	});

	onMount(async () => {
		if ($page.url.searchParams.has("model")) {
			await settings
				.instantSet({
					activeModel: $page.url.searchParams.get("model") ?? data.settings?.activeModel ?? 'default',
				})
				.then(async () => {
					const query = new URLSearchParams($page.url.searchParams.toString());
					query.delete("model");
					await goto(`${base}/?${query.toString()}`, {
						invalidateAll: true,
					});
				});
		}

		if ($page.url.searchParams.has("tools")) {
			const tools = $page.url.searchParams.get("tools")?.split(",");

			await settings
				.instantSet({
					tools: [...(data.settings?.tools ?? []), ...(tools ?? [])],
				})
				.then(async () => {
					const query = new URLSearchParams($page.url.searchParams.toString());
					query.delete("tools");
					await goto(`${base}/?${query.toString()}`, {
						invalidateAll: true,
					});
				});
		}
	});

	let mobileNavTitle = $derived(
		["/models", "/assistants", "/privacy", "/tools"].includes($page.route.id ?? "")
			? ""
			: conversations.find((conv: Conversation) => conv.id === $page.params.id)?.title
	);

	let showDisclaimer = $derived(
		!(data.settings?.ethicsModalAccepted ?? false) &&
			$page.url.pathname !== `${base}/privacy` &&
			envPublic.PUBLIC_APP_DISCLAIMER === "1" &&
			!($page.data.shared === true)
	);
</script>

<svelte:head>
	<title>{envPublic.PUBLIC_APP_NAME}</title>
	<meta name="description" content="The first open source alternative to ChatGPT. 💪" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="@huggingface" />

	<!-- use those meta tags everywhere except on the share assistant page -->
	<!-- feel free to refacto if there's a better way -->
	{#if !$page.url.pathname.includes("/assistant/") && $page.route.id !== "/assistants" && !$page.url.pathname.includes("/models/") && !$page.url.pathname.includes("/tools")}
		<meta property="og:title" content={envPublic.PUBLIC_APP_NAME} />
		<meta property="og:type" content="website" />
		<meta property="og:url" content="{envPublic.PUBLIC_ORIGIN || $page.url.origin}{base}" />
		<meta
			property="og:image"
			content="{envPublic.PUBLIC_ORIGIN ||
				$page.url.origin}{base}/{envPublic.PUBLIC_APP_ASSETS}/thumbnail.png"
		/>
		<meta property="og:description" content={envPublic.PUBLIC_APP_DESCRIPTION} />
	{/if}
	<link
		rel="icon"
		href="{envPublic.PUBLIC_ORIGIN ||
			$page.url.origin}{base}/{envPublic.PUBLIC_APP_ASSETS}/favicon.ico"
		sizes="32x32"
	/>
	<link
		rel="icon"
		href="{envPublic.PUBLIC_ORIGIN ||
			$page.url.origin}{base}/{envPublic.PUBLIC_APP_ASSETS}/icon.svg"
		type="image/svg+xml"
	/>
	<link
		rel="apple-touch-icon"
		href="{envPublic.PUBLIC_ORIGIN ||
			$page.url.origin}{base}/{envPublic.PUBLIC_APP_ASSETS}/apple-touch-icon.png"
	/>
	<link
		rel="manifest"
		href="{envPublic.PUBLIC_ORIGIN ||
			$page.url.origin}{base}/{envPublic.PUBLIC_APP_ASSETS}/manifest.json"
	/>

	{#if envPublic.PUBLIC_PLAUSIBLE_SCRIPT_URL && envPublic.PUBLIC_ORIGIN}
		<script
			defer
			data-domain={new URL(envPublic.PUBLIC_ORIGIN).hostname}
			src={envPublic.PUBLIC_PLAUSIBLE_SCRIPT_URL}
		></script>
	{/if}

	{#if envPublic.PUBLIC_APPLE_APP_ID}
		<meta name="apple-itunes-app" content={`app-id=${envPublic.PUBLIC_APPLE_APP_ID}`} />
	{/if}
</svelte:head>

{#if showDisclaimer}
	<DisclaimerModal on:close={() => settings.instantSet({ ethicsModalAccepted: true })} />
{/if}

{#if $loginModalOpen}
	<LoginModal
		on:close={() => {
			$loginModalOpen = false;
		}}
	/>
{/if}

{#if overloadedModalOpen && isHuggingChat}
	<OverloadedModal onClose={() => (overloadedModalOpen = false)} />
{/if}

<div
	class="fixed grid h-full w-screen grid-cols-1 grid-rows-[auto,1fr] overflow-hidden text-smd {!isNavCollapsed
		? 'md:grid-cols-[290px,1fr]'
		: 'md:grid-cols-[0px,1fr]'} transition-[300ms] [transition-property:grid-template-columns] dark:text-gray-300 md:grid-rows-[1fr]"
>
	<ExpandNavigation
		isCollapsed={isNavCollapsed}
		onClick={() => (isNavCollapsed = !isNavCollapsed)}
		classNames="absolute inset-y-0 z-10 my-auto {!isNavCollapsed
			? 'left-[290px]'
			: 'left-0'} *:transition-transform"
	/>

	<MobileNav title={mobileNavTitle}>
		<NavMenu
			{conversations}
			user={data.user}
			canLogin={data.user === undefined && data.loginEnabled}
			on:shareConversation={(ev) => shareConversation(ev.detail.id, ev.detail.title)}
			on:deleteConversation={(ev) => deleteConversation(ev.detail)}
			on:editConversationTitle={(ev) => editConversationTitle(ev.detail.id, ev.detail.title)}
			on:message={(ev) => {
				if ($page.url.pathname.startsWith(`${base}/conversation/`)) {
					// If we're in a conversation, send the message there
					pendingMessage.set({
						content: ev.detail,
						files: []
					});
					goto(window.location.href, { replaceState: true });
				} else {
					// Otherwise create a new conversation
					goto(`${base}/?q=${encodeURIComponent(ev.detail)}`);
				}
			}}
		/>
	</MobileNav>
	<nav
		class="grid max-h-screen grid-cols-1 grid-rows-[auto,1fr,auto] overflow-hidden *:w-[290px] max-md:hidden"
	>
		<NavMenu
			{conversations}
			user={data.user}
			canLogin={data.user === undefined && data.loginEnabled}
			on:shareConversation={(ev) => shareConversation(ev.detail.id, ev.detail.title)}
			on:deleteConversation={(ev) => deleteConversation(ev.detail)}
			on:editConversationTitle={(ev) => editConversationTitle(ev.detail.id, ev.detail.title)}
			on:message={(ev) => {
				if ($page.url.pathname.startsWith(`${base}/conversation/`)) {
					// If we're in a conversation, send the message there
					pendingMessage.set({
						content: ev.detail,
						files: []
					});
					goto(window.location.href, { replaceState: true });
				} else {
					// Otherwise create a new conversation
					goto(`${base}/?q=${encodeURIComponent(ev.detail)}`);
				}
			}}
		/>
	</nav>
	{#if currentError}
		<Toast message={currentError} />
	{/if}
	{@render children?.()}
</div>
