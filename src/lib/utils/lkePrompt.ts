export async function getLKEPrompt() {
	try {
		const response = await fetch("/api/lke");
		const data = await response.json();
		return data.prompt;
	} catch (error) {
		console.error("Error fetching LKE prompt:", error);
		return "You are a Linux Kernel Expert. Please help me understand Linux kernel concepts.";
	}
}
