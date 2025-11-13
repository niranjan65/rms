# Copyright (c) 2025, Anantdv and contributors
# For license information, please see license.txt

import frappe

def execute(filters=None):
    columns, data = get_columns(), get_data(filters)
    return columns, data

def get_columns():
    return [
        {"fieldname": "technician", "label": "Technician", "fieldtype": "Data", "width": 250},
        {"fieldname": "total_jobs", "label": "Total Jobs", "fieldtype": "Int", "width": 120}
    ]

def get_data(filters):
    query = """
        SELECT repaired_by as technician, COUNT(*) as total_jobs
        FROM `tabRMA BIN`
        WHERE repaired_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          AND repaired_date <= CURDATE()
          AND repaired_by IS NOT NULL
          AND repaired_by != ''
        GROUP BY repaired_by
        ORDER BY total_jobs DESC
        LIMIT 10
    """
    return frappe.db.sql(query, as_dict=True)
