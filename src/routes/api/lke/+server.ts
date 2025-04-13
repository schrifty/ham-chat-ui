import { json } from "@sveltejs/kit";
import { promises as fs } from "fs";
import { join } from "path";

export async function GET() {
	try {
		const filePath = join(process.cwd(), "lke", "prompt.txt");
		const prompt = await fs.readFile(filePath, "utf-8");
		const trimmedPrompt = prompt.trim();
		if (!trimmedPrompt) {
			return json({ prompt: "" });
		}
		return json({ prompt: trimmedPrompt });
	} catch (error) {
		console.error("Error reading LKE prompt:", error);
		return json({
			prompt: "You are a Linux Kernel Expert. Please help me understand Linux kernel concepts.",
		});
	}
}
