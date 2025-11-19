# -*- coding: utf-8 -*-
{
    "name": "Zebra Browser Print Integration",
    "version": "18.0.1.0.0",
    "category": "Inventory",
    "summary": "Print ZPL labels directly to Zebra printers using Browser Print",
    "author": "Aurora Tech Group LTD",
    "website": "https://auroratechgroup.co.uk",
    "license": "LGPL-3",
    "support": "info@auroratechgroup.co.uk",
    "depends": ["stock", "web"],
    "data": [],
    "assets": {
        "web.assets_backend": [
            "zebra_browser_print/static/src/js/zebra_print.js",
        ],
    },
    "installable": True,
    "application": False,
    "auto_install": False,
}
