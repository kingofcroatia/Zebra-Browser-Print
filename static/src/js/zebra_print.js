/** @odoo-module **/
import { registry } from "@web/core/registry";
import { download } from "@web/core/network/download";

console.log("[Zebra Browser Print] Module loading...");

const BROWSER_PRINT_URL = "http://localhost:9100";
const CHECK_TIMEOUT = 3000;

async function isBrowserPrintAvailable() {
    try {
        const response = await fetch(BROWSER_PRINT_URL + "/available", {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(CHECK_TIMEOUT)
        });
        if (response.ok) {
            const data = await response.json();
            console.log("[Zebra] Browser Print available, printers:", data);
            return data.printer && data.printer.length > 0;
        }
        return false;
    } catch (error) {
        console.log("[Zebra] Browser Print not available:", error.message);
        return false;
    }
}

async function getDefaultPrinter() {
    try {
        const response = await fetch(BROWSER_PRINT_URL + "/available", {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        if (response.ok) {
            const data = await response.json();
            if (data.printer && data.printer.length > 0) {
                const printer = data.printer[0];
                console.log("[Zebra] Using printer:", printer.name);
                return printer;
            }
        }
        return null;
    } catch (error) {
        console.error("[Zebra] Error getting printer:", error);
        return null;
    }
}

async function printZPL(zplData, printer) {
    try {
        console.log("[Zebra] Sending ZPL to printer:", printer.name);
        console.log("[Zebra] ZPL data length:", zplData.length, "bytes");
        const response = await fetch(BROWSER_PRINT_URL + "/write", {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                device: {
                    name: printer.name,
                    uid: printer.uid,
                    connection: printer.connection,
                    deviceType: printer.deviceType,
                    version: printer.version,
                    provider: printer.provider,
                    manufacturer: printer.manufacturer
                },
                data: zplData
            })
        });
        if (response.ok) {
            console.log("[Zebra] Print command sent successfully!");
            return true;
        } else {
            const errorText = await response.text();
            console.error("[Zebra] Print failed:", response.status, errorText);
            return false;
        }
    } catch (error) {
        console.error("[Zebra] Print error:", error);
        return false;
    }
}

registry.category("services").add("zebra_browser_print", {
    start(env) {
        console.log("[Zebra Browser Print] Service starting...");
        const originalDownload = download._download || download;
        download._download = async function(options) {
            console.log("[Zebra] Download intercepted:", options);
            const isProductLabel = options.url && options.url.includes('/report/') && (
                options.url.includes('stock.label_product_product_view') ||
                options.url.includes('label_product_product') ||
                options.url.includes('label_product_view') ||
                options.url.includes('product_label') ||
                (options.data && options.data.data && (
                    String(options.data.data).includes('stock.label_product_product_view') ||
                    String(options.data.data).includes('label_product_product') ||
                    String(options.data.data).includes('label_product_view') ||
                    String(options.data.data).includes('product_label')
                ))
            );
            console.log("[Zebra] Checking if product label report...");
            console.log("[Zebra] URL:", options.url);
            if (options.data && options.data.data) {
                const dataStr = String(options.data.data);
                console.log("[Zebra] Data contains 'label_product'?", dataStr.includes('label_product'));
            }
            console.log("[Zebra] Is product label?", isProductLabel);
            if (!isProductLabel) {
                console.log("[Zebra] Not a product label report, using default download");
                return originalDownload.call(this, options);
            }
            console.log("[Zebra] Product label detected! Checking Browser Print and ZPL format...");
            const browserPrintAvailable = await isBrowserPrintAvailable();
            if (!browserPrintAvailable) {
                console.log("[Zebra] Browser Print not available, falling back to download");
                env.services.notification.add("Zebra Browser Print not detected. Install from zebra.com or downloading file...", { type: "info" });
                return originalDownload.call(this, options);
            }
            try {
                const printer = await getDefaultPrinter();
                if (!printer) {
                    console.error("[Zebra] No printer found");
                    env.services.notification.add("No Zebra printer found. Please connect a Zebra printer.", { type: "warning" });
                    return originalDownload.call(this, options);
                }
                console.log("[Zebra] Extracting report URL from request data...");
                let reportUrl = null;
                if (options.data && options.data.data) {
                    try {
                        const dataArray = JSON.parse(options.data.data);
                        console.log("[Zebra] Parsed data array:", dataArray);
                        if (Array.isArray(dataArray) && dataArray.length > 0) {
                            reportUrl = dataArray[0];
                            console.log("[Zebra] Extracted report URL:", reportUrl);
                        }
                    } catch (e) {
                        console.error("[Zebra] Error parsing data:", e);
                    }
                }
                if (!reportUrl) {
                    console.error("[Zebra] Could not extract report URL from data");
                    throw new Error("Could not extract report URL");
                }
                const fullUrl = window.location.origin + reportUrl;
                console.log("[Zebra] Fetching report from:", fullUrl);
                const response = await fetch(fullUrl, {
                    method: 'GET',
                    credentials: 'include',
                    headers: { 'Accept': 'text/plain, */*' }
                });
                if (!response.ok) {
                    throw new Error("HTTP " + response.status + ": " + response.statusText);
                }
                const responseData = await response.text();
                console.log("[Zebra] Response received, length:", responseData.length, "bytes");
                console.log("[Zebra] First 100 characters:", responseData.substring(0, 100));
                const isZPL = responseData.includes('^XA') && responseData.includes('^XZ');
                if (!isZPL) {
                    console.log("[Zebra] Response is NOT ZPL format (missing ^XA/^XZ markers)");
                    console.log("[Zebra] Content type appears to be:", responseData.startsWith('%PDF') ? 'PDF' : responseData.startsWith('<') ? 'HTML' : 'Unknown');
                    console.log("[Zebra] The rfid_epc_auto module may not be installed/active");
                    console.log("[Zebra] Falling back to download");
                    env.services.notification.add("Label is not in ZPL format. Make sure 'RFID EPC Auto Generation' module is installed and active.", { type: "warning", sticky: true });
                    return originalDownload.call(this, options);
                }
                console.log("[Zebra] Valid ZPL format confirmed!");
                if (responseData.includes('^RFW') || responseData.includes('^RFR')) {
                    console.log("[Zebra] RFID encoding detected in ZPL");
                } else {
                    console.log("[Zebra] No RFID encoding found in ZPL");
                }
                const success = await printZPL(responseData, printer);
                if (success) {
                    env.services.notification.add("Label sent to " + printer.name + "!", { type: "success" });
                    console.log("[Zebra] Print completed successfully!");
                } else {
                    throw new Error("Print command failed");
                }
            } catch (error) {
                console.error("[Zebra] Error:", error);
                env.services.notification.add("Print failed: " + error.message + ". Downloading file instead...", { type: "warning" });
                return originalDownload.call(this, options);
            }
        };
        console.log("[Zebra Browser Print] Service initialized successfully!");
        console.log("[Zebra] Ready to intercept product label reports");
    }
});

console.log("[Zebra Browser Print] Integration loaded");