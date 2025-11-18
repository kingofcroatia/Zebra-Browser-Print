# Odoo RFID Modules

Professional RFID label generation and printing solution for Odoo 18.0.

Automates SGTIN-96 EPC code generation and direct printing to Zebra RFID printers via Browser Print, eliminating manual file downloads and improving warehouse efficiency.

![License](https://img.shields.io/badge/license-LGPL--3-blue)
![Odoo](https://img.shields.io/badge/odoo-18.0-purple)
![Python](https://img.shields.io/badge/python-3.11+-green)

---

## 🎯 Features

### RFID EPC Auto Generation
- ✅ Automatic SGTIN-96 EPC code generation (GS1 standard)
- ✅ Sequential serial numbers per product (production tracking)
- ✅ Auto-generates barcodes if missing
- ✅ Thread-safe counters (multi-user support)
- ✅ ZPL label templates with RFID encoding commands
- ✅ Compatible with Zebra ZT231R, ZT411R, and other RFID printers

### Zebra Browser Print Integration
- ✅ Direct printing to local/network Zebra printers
- ✅ No file downloads required
- ✅ Automatic printer detection (USB, Network, Bluetooth)
- ✅ Works with cloud-hosted Odoo
- ✅ ZPL format validation
- ✅ Seamless integration with Odoo reports

---

## 📦 Modules

### 1. RFID EPC Auto Generation (`rfid_epc_auto`)

Generates GS1-compliant SGTIN-96 EPC codes and creates ZPL labels with RFID encoding.

**Key Features:**
- Automatic EPC generation using product barcode
- Sequential or random serial numbers
- RFID chip encoding via ZPL `^RFW` command
- Integrated with Odoo product labels
- Supports EAN-13, EAN-14, UPC-A barcodes

**Use Cases:**
- Medical device tracking
- Inventory management
- Asset tracking
- Production counting
- Recall capability

### 2. Zebra Browser Print Integration (`zebra_browser_print`)

JavaScript module that intercepts Odoo report downloads and sends ZPL directly to Zebra printers via Browser Print service.

**Key Features:**
- Automatic ZPL detection
- Direct printer communication
- USB/Network/Bluetooth support
- Error handling with fallback to download
- User-friendly notifications

---

## 🚀 Installation

### Prerequisites

- **Odoo 18.0** (Community or Enterprise)
- **Python 3.11+**
- **pyepc library** for EPC encoding
- **Zebra Browser Print** (on client computers)
- **Zebra RFID printer** (ZT231R, ZT411R, etc.)

### Step 1: Install Python Dependencies
```bash
# Install pyepc library for EPC generation
pip install pyepc --break-system-packages
```

### Step 2: Install Odoo Modules
```bash
# Clone repository
cd /opt/odoo/odoo/addons/
git clone https://github.com/yourusername/odoo-rfid-modules.git

# Move modules to addons directory
mv odoo-rfid-modules/rfid_epc_auto ./
mv odoo-rfid-modules/zebra_browser_print ./

# Set permissions
sudo chown -R odoo:odoo rfid_epc_auto zebra_browser_print
sudo chmod -R 755 rfid_epc_auto zebra_browser_print

# Restart Odoo
sudo systemctl restart odoo
```

### Step 3: Install Zebra Browser Print (Client Side)

**On each computer that prints labels:**

1. Download from [Zebra Support](https://www.zebra.com/us/en/support-downloads/software/printer-software/zebra-browser-print.html)
2. Install for your OS (Windows/Mac/Linux)
3. Start the service
4. Verify: Open `http://localhost:9100/available` in browser

### Step 4: Activate Modules in Odoo

1. **Apps** → **Update Apps List**
2. Search: **"RFID EPC Auto Generation"**
3. Click **Install**
4. Search: **"Zebra Browser Print Integration"**
5. Click **Install**

---

## ⚙️ Configuration

### RFID EPC Auto Generation

**Per Product Settings:**

1. Go to **Inventory → Products → Open any product**
2. **Inventory tab** → RFID Serial Numbers section:
   - ✅ **Use Sequential RFID Serials** (default: enabled)
   - View **Last RFID Serial** (counter)

**Features:**
- Each product has its own serial counter
- Counter starts at 1 and increments automatically
- Barcodes auto-generated if missing (format: `999` + Product ID)

### Zebra Browser Print

**No configuration needed!** Works automatically once installed.

**How it works:**
1. User clicks "Print → Product Labels" in Odoo
2. JavaScript detects ZPL format
3. Sends directly to Zebra Browser Print
4. Label prints automatically

---

## 📖 Usage

### Printing RFID Labels

1. **Go to:** Inventory → Products → Products
2. **Open** any product
3. **Click:** Print → Product Labels
4. **Enter quantity** (e.g., 10)
5. **Click:** Print

**What happens:**
- ✅ EPC codes generated (one per label)
- ✅ Serial numbers incremented automatically
- ✅ ZPL sent to printer via Browser Print
- ✅ Labels print with encoded RFID chips
- ❌ No file downloads!

### Checking Serial Numbers

**View last used serial:**
- Product → Inventory tab → "Last RFID Serial"

**Example:**
```
Product: Medical Implant ABC
Last RFID Serial: 156

Next print will use serials: 157, 158, 159...
```

---

## 🔧 Technical Details

### SGTIN-96 EPC Structure
```
Header:          8 bits  (0x30 - SGTIN-96)
Filter:          3 bits  (1 = Point of Sale)
Partition:       3 bits  (5 = 7-digit prefix)
Company Prefix: 24 bits  (7 digits)
Item Reference: 20 bits  (5 digits)
Serial Number:  38 bits  (1 to 274,877,906,943)
```

### ZPL Label Template
```zpl
^XA
^RW28
^RS8
^RZ2,1
^CI28
^PW609
^LL200

^FO150,10^BY2.4
^BCN,80,N,N,N
^FD1234567890123^FS

^FO25,120
^A0N,22,18^FDProduct Name^FS

^RFW,H^FD30344B32641D29770000001^FS

^XZ
```

**Key commands:**
- `^BCN` - Barcode (Code 128)
- `^RFW` - Write RFID tag
- `^XA`/`^XZ` - ZPL start/end markers

### Browser Print API

**Endpoints:**
```javascript
GET  http://localhost:9100/available  // List printers
POST http://localhost:9100/write      // Send ZPL
```

---

## 🐛 Troubleshooting

### Issue: Labels Download Instead of Print

**Cause:** Zebra Browser Print not running

**Solution:**
```bash
# Windows: Check service
services.msc → Find "Zebra Browser Print Service"

# Verify in browser
http://localhost:9100/available
```

---

### Issue: "Not ZPL Format" Warning

**Cause:** RFID EPC Auto module not installed

**Solution:**
1. Apps → Search "RFID EPC"
2. Install "RFID EPC Auto Generation"
3. Restart Odoo
4. Try printing again

---

### Issue: Java Process Using Port 9100

**Cause:** Another application using port 9100

**Solution:**
```bash
# Find process
netstat -ano | findstr :9100

# Kill it (Windows)
taskkill /F /PID [process_id]

# Start Zebra Browser Print
net start "Zebra Browser Print Service"
```

---

## 🧪 Testing

### Test EPC Generation
```python
# Odoo shell
product = env['product.product'].browse(1)
epc = product.generate_sgtin96_epc()
print(f"Generated EPC: {epc}")
print(f"Serial: {product.last_rfid_serial}")
```

### Test Browser Print

1. Open browser console (F12)
2. Run:
```javascript
fetch('http://localhost:9100/available')
  .then(r => r.json())
  .then(d => console.log('Printers:', d))
```

---

## 📊 Production Statistics

Track production by checking serial counters:
```sql
-- SQL query to get production counts
SELECT 
    name,
    last_rfid_serial as total_labels_printed
FROM product_product
WHERE use_sequential_rfid = true
ORDER BY last_rfid_serial DESC;
```

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📜 License

LGPL-3.0 License

---

## 👨‍💻 Author

**Aurora Tech Group LTD**  
London, United Kingdom

- **Developer:** Andrew
- **Email:** info@auroratechgroup.co.uk
- **Website:** [auroratechgroup.co.uk](https://auroratechgroup.co.uk)

---

## 🙏 Credits

- **Odoo SA** - Base framework
- **pyepc library** - EPC encoding
- **Zebra Technologies** - Browser Print API
- **Ventor Tech** - RFID mobile app inspiration

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/yourusername/odoo-rfid-modules/issues)
- **Email:** info@auroratechgroup.co.uk
- **Odoo Forum:** Search "Aurora Tech RFID"

---

## 🗺️ Roadmap

### Future Features

- [ ] EPC tracking database
- [ ] Multiple EPC schemes (SSCC, GRAI, GIAI)
- [ ] Batch EPC generation API
- [ ] GS1 compliance module
- [ ] Printer selection UI
- [ ] Bosnia and Herzegovina localization
- [ ] Multi-language support (BS/HR/SR)
- [ ] Odoo 17.0 and 19.0 backports

---

## 📸 Screenshots

### RFID Label Printing

![Print Labels](docs/screenshots/print-labels.png)

*Direct printing with automatic RFID encoding*

### Product Configuration

![Product Settings](docs/screenshots/product-settings.png)

*Sequential serial number configuration*

### Browser Print Integration

![Browser Print](docs/screenshots/browser-print.png)

*Automatic printer detection and ZPL transmission*

---

## ⭐ Star Us!

If this project helped you, please star the repository!

[![GitHub stars](https://img.shields.io/github/stars/yourusername/odoo-rfid-modules?style=social)](https://github.com/yourusername/odoo-rfid-modules)
