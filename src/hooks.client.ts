import { auth } from "$lib/firebase";
import { goto } from "$app/navigation";

auth.onAuthStateChanged((user) => {
	const protectedPaths = ["/chat"];
	const currentPath = window.location.pathname;

	if (!user && protectedPaths.some((path) => currentPath.startsWith(path))) {
		goto("/login");
	}
});
