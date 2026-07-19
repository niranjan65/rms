# Copyright (c) 2026, Anantdv and contributors
# For license information, please see license.txt

# import frappe


# def execute(filters=None):
# 	columns, data = [], []
# 	return columns, data

import frappe

def execute(filters=None):
    columns = get_columns()
    data = get_data(filters)
    return columns, data

def get_columns():
    return [
        {"fieldname": "rma_id", "label": "RMA ID", "fieldtype": "Link", "options": "RMA BIN", "width": 120},
        {"fieldname": "customer", "label": "Customer", "fieldtype": "Link", "options": "Customer", "width": 150},
        {"fieldname": "circle", "label": "Circle", "fieldtype": "Data", "width": 100},
        {"fieldname": "repair_status", "label": "Current State", "fieldtype": "Data", "width": 120},
        {"fieldname": "rma_id_status", "label": "Tracking Status", "fieldtype": "Data", "width": 140},
        {"fieldname": "quality_check_pass", "label": "QC Status", "fieldtype": "Data", "width": 90},
        {"fieldname": "component_used_init", "label": "Components Used", "fieldtype": "Data", "width": 180},
        {"fieldname": "material_request", "label": "Material Request", "fieldtype": "Link", "options": "Stock Entry", "width": 130},
        {"fieldname": "total_repair_time", "label": "Repair Time", "fieldtype": "Data", "width": 100},
        {"fieldname": "total_quality_time", "label": "QC Time", "fieldtype": "Data", "width": 100},
        {"fieldname": "total_tat", "label": "Total TAT", "fieldtype": "Data", "width": 100},
    ]

def get_data(filters):
    conditions = ""
    # Add logic here to append to conditions based on filters (e.g., if filters.get('customer'): conditions += f" AND customer = '{filters.get('customer')}'")
    
    # Query your RMA BIN based on requirements
    data = frappe.db.sql("""
        SELECT 
            name as rma_id, customer, circle, repair_status, 
            rma_id_status, quality_check_pass, component_used_init, 
            material_request, total_repair_time, total_quality_time, total_tat
        FROM `tabRMA BIN`
        WHERE docstatus < 2 {conditions}
        ORDER BY creation DESC
    """.format(conditions=conditions), as_dict=1)
    
    return data