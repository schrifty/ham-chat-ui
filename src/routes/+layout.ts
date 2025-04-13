import { browser } from "$app/environment";
import { goto } from "$app/navigation";
import type { LayoutLoad } from "./$types";
import { get } from "svelte/store";
import { user } from "$lib/stores/auth";

export const ssr = false;

export const load: LayoutLoad = async ({ url, data: parentData }) => {
	if (browser) {
		const currentUser = get(user);
		const isLoginPage = url.pathname === "/login";

		if (!currentUser && !isLoginPage) {
			goto("/login");
		} else if (currentUser && isLoginPage) {
			goto("/");
		}
	}

	return {
		...parentData,
		user: get(user),
	};
};
