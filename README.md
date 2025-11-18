# Zebra Browser Print Integration for Odoo

Automatically print ZPL labels directly to Zebra printers without file downloads.

![Odoo](https://img.shields.io/badge/odoo-18.0-purple)
![License](https://img.shields.io/badge/license-LGPL--3-blue)

---

## 🎯 Overview

This module intercepts Odoo ZPL report downloads and sends them directly to local Zebra printers via Zebra Browser Print service. Works seamlessly with cloud-hosted Odoo installations.

**No more manual file downloads!** Labels print automatically when you click "Print" in Odoo.

---

## ✨ Features

- ✅ **Automatic ZPL Detection** - Recognizes ZPL format reports
- ✅ **Direct Printing** - No file downloads required
- ✅ **Multi-Connection Support** - USB, Network, and Bluetooth printers
- ✅ **Cloud Compatible** - Works with cloud-hosted Odoo
- ✅ **Smart Fallback** - Downloads file if Browser Print unavailable
- ✅ **User Notifications** - Clear success/error messages
- ✅ **Zero Configuration** - Works out of the box

---

## 📋 Requirements

### Server Side
- Odoo 18.0 (Community or Enterprise)
- ZPL-generating report module (e.g., `rfid_epc_auto`)

### Client Side
- **Zebra Browser Print** installed on user's computer
- Chrome or Edge browser (recommended)
- Zebra printer (USB, Network, or Bluetooth)

---

## 🚀 Installation

### Step 1: Install Zebra Browser Print (Client Computer)

**Download:**
https://www.zebra.com/us/en/support-downloads/software/printer-software/zebra-browser-print.html

**Install:**
1. Download for your OS (Windows/Mac/Linux)
2. Run installer
3. Start the service
4. Verify: Open `http://localhost:9100/available` in browser

**Should show:**
```json
{
  "printer": [{
    "name": "ZT231R-203dpi",
    "connection": "usb",
    "deviceType": "printer"
  }]
}
```

### Step 2: Install Odoo Module
```bash
# Copy module to Odoo addons directory
cd /opt/odoo/odoo/addons/
git clone https://github.com/yourusername/zebra_browser_print.git

# Set permissions
sudo chown -R odoo:odoo zebra_browser_print
sudo chmod -R 755 zebra_browser_print

# Restart Odoo
sudo systemctl restart odoo
```

### Step 3: Activate in Odoo

1. Go to **Apps** menu
2. Click **Update Apps List**
3. Search: **"Zebra Browser Print"**
4. Click **Install**
5. Done! No configuration needed.

---

## 📖 Usage

### Printing Labels

1. Open any Odoo form with ZPL report (e.g., Product Labels)
2. Click **Print** → Select ZPL report
3. Click **Print**
4. **Label prints automatically!**

**What happens behind the scenes:**
```
User clicks Print
    ↓
JavaScript intercepts download
    ↓
Detects ZPL format (^XA...^XZ)
    ↓
Checks Browser Print (localhost:9100)
    ↓
Gets available printer
    ↓
Sends ZPL to printer
    ↓
Label prints! ✅
```

---

## 🔧 How It Works

### Architecture
```
Odoo Server                Client Browser               Zebra Printer
    │                           │                            │
    │  1. Generate ZPL Report   │                            │
    │──────────────────────────>│                            │
    │                           │                            │
    │                           │  2. Intercept Download     │
    │                           │     (JavaScript)           │
    │                           │                            │
    │                           │  3. Detect ZPL Format      │
    │                           │     (Check ^XA/^XZ)        │
    │                           │                            │
    │                           │  4. Send to Browser Print  │
    │                           │─────────────────────────>  │
    │                           │     (localhost:9100)       │
    │                           │                            │
    │                           │                      5. Print Label
    │                           │                            │
```

### JavaScript Detection Logic

The module detects ZPL reports by checking:
- URL contains product label indicators
- Response contains ZPL markers (`^XA`, `^XZ`)
- Content includes RFID commands (`^RFW`, `^RFR`)

### Supported Printers

**Tested:**
- Zebra ZT231R (USB/Network)
- Zebra ZT411R (USB/Network)
- Zebra ZT610R (USB/Network)

**Should work with any Zebra printer supporting:**
- ZPL programming language
- Zebra Browser Print service

---

## 🐛 Troubleshooting

### Issue: Labels Download Instead of Print

**Symptom:** File downloads when clicking Print

**Cause:** Zebra Browser Print not running

**Solution:**
```bash
# Check if Browser Print is running
# Open in browser: http://localhost:9100/available

# Windows: Check service status
services.msc → Find "Zebra Browser Print Service" → Start

# Mac: Check Applications
Applications → Zebra Browser Print → Open

# Verify printer detected
http://localhost:9100/available
# Should show your printer in JSON format
```

---

### Issue: "Not ZPL Format" Warning

**Symptom:** Warning message about ZPL format

**Cause:** Report is not generating ZPL (probably PDF)

**Solution:**
1. Ensure you're using a ZPL-generating report
2. Check if `rfid_epc_auto` or similar module is installed
3. Verify report template includes `^XA`/`^XZ` markers

---

### Issue: Port 9100 Already in Use

**Symptom:** Browser Print won't start

**Cause:** Another application using port 9100

**Solution:**
```bash
# Find what's using port 9100
netstat -ano | findstr :9100

# Windows: Kill the process
taskkill /F /PID [process_id]

# Mac/Linux: Kill the process
kill -9 [process_id]

# Restart Browser Print
net start "Zebra Browser Print Service"
```

---

### Issue: Printer Not Detected

**Symptom:** "No printer found" message

**Cause:** Printer not connected or not recognized

**Solution:**
1. **Check physical connection:**
   - USB: Ensure cable connected and drivers installed
   - Network: Verify printer IP is accessible (ping test)

2. **Check Browser Print:**
```
   http://localhost:9100/available
```
   Should list your printer

3. **Restart printer and Browser Print**

---

## 🧪 Testing

### Test Browser Print Service

**In browser console (F12):**
```javascript
// Check if service is running
fetch('http://localhost:9100/available')
  .then(r => r.json())
  .then(d => console.log('✅ Printers:', d))
  .catch(e => console.error('❌ Error:', e));
```

**Expected output:**
```javascript
✅ Printers: {
  printer: [{
    name: "ZT231R-203dpi USB",
    connection: "usb",
    deviceType: "printer",
    manufacturer: "Zebra Technologies"
  }]
}
```

### Test ZPL Printing

**Send test ZPL:**
```javascript
const testZPL = `
^XA
^FO50,50^ADN,36,20^FDTest Label^FS
^FO50,100^BY2^BCN,100,Y,N,N^FD123456^FS
^XZ
`;

fetch('http://localhost:9100/write', {
  method: 'POST',
  body: JSON.stringify({
    device: { name: "ZT231R-203dpi USB" },
    data: testZPL
  })
})
.then(r => console.log('✅ Print sent!'))
.catch(e => console.error('❌ Error:', e));
```

---

## 🔍 Debug Mode

### Enable Console Logging

Open browser console (F12) to see detailed logs:
```
[Zebra Browser Print] Module loading...
[Zebra Browser Print] Service starting...
[Zebra] Download intercepted: {...}
[Zebra] Is product label? true
[Zebra] Browser Print available, printers: {...}
[Zebra] Using printer: ZT231R-203dpi (192.168.3.142)
[Zebra] Valid ZPL format confirmed!
[Zebra] RFID encoding detected in ZPL
[Zebra] Print command sent successfully!
[Zebra] ✓ Print completed successfully!
```

---

## 🌐 Browser Compatibility

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome | ✅ Supported | Recommended |
| Edge | ✅ Supported | Recommended |
| Firefox | ⚠️ Limited | May require `localhost` exception |
| Safari | ❌ Not Supported | Zebra Browser Print limitation |

---

## 📡 Network Configuration

### Firewall Rules

**Windows Firewall:**
- Allow: `ZebraBrowserPrint.exe`
- Port: 9100 (TCP)

**Corporate Firewall:**
- Allow: `localhost:9100` (loopback)
- No internet access required

### Multiple Users

Each user needs:
- Zebra Browser Print installed on their computer
- Printer connected to their computer (USB/Network)
- Works independently - no server configuration needed

---

## 🔐 Security

### Data Flow
- All printing happens locally (client → printer)
- No data sent to external servers
- Zebra Browser Print runs on localhost only
- ZPL data never leaves user's computer

### Privacy
- No telemetry or tracking
- No external API calls
- Works offline
- GDPR compliant

---

## 🛠️ Technical Details

### API Endpoints

**Zebra Browser Print provides:**
```
GET  http://localhost:9100/available
Response: List of available printers

POST http://localhost:9100/write
Body: { device: {...}, data: "ZPL..." }
Response: Print status
```

### JavaScript Integration

**Module type:** ES6 module (`@odoo-module`)

**Core functionality:**
- Intercepts `download` service
- Detects ZPL reports via pattern matching
- Communicates with Browser Print via fetch API
- Handles errors with graceful fallback

### Files
```
zebra_browser_print/
├── __init__.py                    # Module initialization
├── __manifest__.py                # Module metadata
├── README.md                      # This file
└── static/
    └── src/
        └── js/
            └── zebra_print.js     # JavaScript interceptor
```

---

## 🤝 Integration

### Works With

- **RFID EPC Auto Generation** - Print RFID-encoded labels
- **Stock Barcodes** - Print product/location labels
- **Custom ZPL Reports** - Any Odoo report generating ZPL

### Creating Compatible Reports

**Your report must:**
1. Output ZPL format (text/plain)
2. Include `^XA` (start) and `^XZ` (end) markers
3. Be named with `label` or `product` in the name

**Example report XML:**
```xml
<record id="my_zpl_report" model="ir.actions.report">
    <field name="name">My ZPL Labels</field>
    <field name="model">product.product</field>
    <field name="report_type">qweb-text</field>
    <field name="report_name">my_module.zpl_template</field>
</record>
```

---

## 📄 License

LGPL-3.0 License

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Lesser General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

---

## 👨‍💻 Author

**Aurora Tech Group LTD**  
London, United Kingdom

- **Developer:** Andrew
- **Email:** info@auroratechgroup.co.uk
- **Website:** https://auroratechgroup.co.uk

---

## 🙏 Credits

- **Zebra Technologies** - Browser Print API
- **Odoo SA** - Framework
- **Community** - Testing and feedback

---

**Email:** info@auroratechgroup.co.uk  

---

## 🗺️ Roadmap

- [ ] Printer selection UI
- [ ] Print queue management
- [ ] Print history/logging
- [ ] Custom printer profiles
- [ ] Batch printing optimization
- [ ] Odoo 17.x/19.x support

---

## ⭐ Like This Module?

If this module helped you, please:
- ⭐ Star the repository
- 📢 Share with others
- 🐛 Report issues
- 💡 Suggest features

```

---

**Made with ❤️ by Aurora Tech Group**
