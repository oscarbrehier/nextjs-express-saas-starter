import puppeteer from "puppeteer";

export async function generatePdfFromHtml(html: string): Promise<Buffer> {

	const browser = await puppeteer.launch({
		headless: true,
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
	});

	try {

		const page = await browser.newPage();

		await page.setContent(html, { waitUntil: "load" });
		// The template loads Public Sans / Courier Prime from Google Fonts;
		// "load" fires once the stylesheet arrives, not once the font files
		// referenced inside it are ready, so print would otherwise fall back
		// to system fonts.
		await page.evaluateHandle("document.fonts.ready");

		const pdf = await page.pdf({
			format: "A4",
			printBackground: true,
			margin: { top: "40px", bottom: "40px", left: "40px", right: "40px" },
		});

		return Buffer.from(pdf);

	} finally {
		await browser.close();
	}
}