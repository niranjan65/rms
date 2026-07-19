// Copyright (c) 2026, Anantdv and contributors
// For license information, please see license.txt

// frappe.query_reports["RMA Master Administrator Report"] = {
// 	"filters": [

// 	]
// };

frappe.query_reports["RMA Master Administrator Report"] = {
    "filters": [
        {
            "fieldname": "customer",
            "label": __("Customer"),
            "fieldtype": "Link",
            "options": "Customer"
        },
        {
            "fieldname": "circle",
            "label": __("Circle"),
            "fieldtype": "Link",
            "options": "Location"
        },
        {
            "fieldname": "repair_status",
            "label": __("Current State (Repair Status)"),
            "fieldtype": "Link",
            "options": "Repair Status"
        },
        {
            "fieldname": "quality_check_pass",
            "label": __("QC Passed?"),
            "fieldtype": "Select",
            "options": "\nYes\nNo"
        },
        {
            "fieldname": "date_range",
            "label": __("Receiving Date Range"),
            "fieldtype": "DateRange",
        }
    ]
};