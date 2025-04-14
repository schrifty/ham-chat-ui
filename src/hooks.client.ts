import { auth } from "$lib/firebase";
import { goto } from "$app/navigation";
import { browser } from "$app/environment";

if (browser && auth) {
	auth.onAuthStateChanged((user) => {
		const protectedPaths = ["/chat"];
		const currentPath = window.location.pathname;

		if (!user && protectedPaths.some((path) => currentPath.startsWith(path))) {
			goto("/login");
		}
	});
}
