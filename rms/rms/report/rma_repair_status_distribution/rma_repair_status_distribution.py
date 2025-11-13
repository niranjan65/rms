# Copyright (c) 2025, Anantdv and contributors
# For license information, please see license.txt

import frappe

def execute(filters=None):
    columns, data = get_columns(), get_data(filters)
    return columns, data

def get_columns():
    return [
        {"fieldname": "status", "label": "Repair Status", "fieldtype": "Link", "options": "Repair Status", "width": 200},
        {"fieldname": "total", "label": "Total Count", "fieldtype": "Int", "width": 120},
        {"fieldname": "percentage", "label": "Percentage", "fieldtype": "Percent", "width": 100}
    ]

def get_data(filters):
    total_count = frappe.db.sql("""
        SELECT COUNT(*) FROM `tabRMA BIN` 
        WHERE repair_status IS NOT NULL AND repair_status != ''
    """)[0][0]
    
    query = """
        SELECT repair_status as status, 
               COUNT(*) as total,
               (COUNT(*) * 100.0 / %s) as percentage
        FROM `tabRMA BIN`
        WHERE repair_status IS NOT NULL
          AND repair_status != ''
        GROUP BY repair_status
        ORDER BY total DESC
    """
    return frappe.db.sql(query, (total_count,), as_dict=True)

