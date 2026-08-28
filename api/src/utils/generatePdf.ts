import puppeteer from "puppeteer";

export async function generatePdfFromHtml(html: string): Promise<Buffer> {

	const browser = await puppeteer.launch({
		headless: true,
		args: ["--no-sandbox", "--disable-setuid-sandbox"],
	});

	try {

		const page = await browser.newPage();

		await page.setContent(html, { waitUntil: "load" });

		const pdf = await page.pdf({
			format: "A4",
			printBackground: true,
			margin: { top: "40px", bottom: "40px", left: "40px", right: "40px" },
		});

		return Buffer.from(pdf);

	} finally {
		await browser.close();
	};

};