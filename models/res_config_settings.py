# -*- coding: utf-8 -*-
# Copyright 2025 Aurora Tech Group LTD, London, UK
# Developer: Andrew
# License LGPL-3.0 or later (https://www.gnu.org/licenses/lgpl-3.0).

from odoo import models, fields


class ResConfigSettings(models.TransientModel):
    """Add Zebra Browser Print configuration to Inventory settings."""
    _inherit = "res.config.settings"
    
    zebra_browser_print_enabled = fields.Boolean(
        string="Enable Zebra Browser Print",
        config_parameter="zebra_browser_print.enabled",
        help="Enable automatic printing to Zebra printers using Browser Print extension"
    )
