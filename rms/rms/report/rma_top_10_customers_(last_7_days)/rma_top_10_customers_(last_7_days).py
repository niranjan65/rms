# Copyright (c) 2025, Anantdv and contributors
# For license information, please see license.txt

import frappe

def execute(filters=None):
    columns, data = get_columns(), get_data(filters)
    return columns, data

def get_columns():
    return [
        {"fieldname": "customer", "label": "Customer", "fieldtype": "Link", "options": "Customer", "width": 250},
        {"fieldname": "total_rmas", "label": "Total RMAs", "fieldtype": "Int", "width": 120}
    ]

def get_data(filters):
    query = """
        SELECT customer, COUNT(*) as total_rmas
        FROM `tabRMA BIN`
        WHERE receiving_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          AND receiving_date <= CURDATE()
        GROUP BY customer
        ORDER BY total_rmas DESC
        LIMIT 10
    """
    return frappe.db.sql(query, as_dict=True)
