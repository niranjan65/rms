# # Copyright (c) 2025, Anantdv and contributors
# # For license information, please see license.txt



from __future__ import unicode_literals
import frappe
from frappe import _

def execute(filters=None):
    conditions = " status = 'Not Ok' "


    if filters.get("customer"):
        conditions += f"AND parent = '{filters.get("customer")}' "
        # conditions.append(f"status = '{filters.get('status')}'")

    # if filters.get("status"):
    #     conditions += f" AND status = '{filters.get('status')}' "


    columns = get_columns()
    data = get_data(filters,conditions)
    return columns, data

def get_columns():
    
    return [
        {"label": "Item", "fieldname": "item", "fieldtype": "Data", "width": 200},
		{"label": "Status", "fieldname": "status", "fieldtype": "Data", "width": 200},
        {"label": "Issue", "fieldname": "issue", "fieldtype": "Data", "width": 200},
        {"label": "Remark", "fieldname": "remark", "fieldtype": "Data", "width": 200},
        {"label": "Item","fieldname": "item1", "fieldtype": "Data", "width": 200},
    ]

def get_data(filters,conditions):
    data = frappe.db.sql(f""" SELECT item,status,issue,remark,item1
        FROM 
        `tabItem Checklist`
        WHERE  {conditions} 
        ORDER BY creation DESC
         """ , 
    as_dict=True) 

    return data

# from __future__ import unicode_literals
# from frappe import _
# import frappe


# def execute(filters=None):
# 	return get_columns() , get_data(filters)

# def get_data(filters):
# 	print(f"\n\n\n\{filters}\n\n\n\n")

# 	return [
# 		{'item': 'GPL4G009', 'status': 'Ok', 'issue': None, 'remark': None}
# 		]

# 	# data = frappe.db.sql(""" SELECT item,status,issue,remark
#     # FROM `tabItem Checklist`
# 	# WHERE status ="Not Ok" AND order_by: "creation desc"; """)
# 	return data

# def get_columns():
# 	return [
#         {"label": "Item", "fieldname": "item", "fieldtype": "Data", "width": 200},
# 		{"label": "Status", "fieldname": "status", "fieldtype": "Data", "width": 120},
#         {"label": "Issue", "fieldname": "issue", "fieldtype": "Data", "width": 200},
#         {"label": "Remark", "fieldname": "remark", "fieldtype": "Data", "width": 300},
#     ]



# import frappe

# import frappe
# from frappe import _

# def execute(filters=None):
#     if not filters:
#         filters = {}
#     columns = get_columns()
#     data = get_nasfund_data(filters)
#     return columns, data

# def get_columns():
#     return [
#         {"label": _("Employee Name"), "fieldname": "employee_name", "fieldtype": "Data", "width": 120},
#         # {"label": _("Date of Joining"), "fieldname": "date_of_joining", "fieldtype": "Date", "width": 120},
#         {"label": _("Branch"), "fieldname": "branch", "fieldtype": "Data", "width": 120},
#         {"label": _("Start Date"), "fieldname": "start_date", "fieldtype": "Date", "width": 120},
#         {"label": _("End Date"), "fieldname": "end_date", "fieldtype": "Date", "width": 120},
#         {"label": _("Payment Days"), "fieldname": "payment_days", "fieldtype": "Int", "width": 120},
#         {"label": _("Nasfund"), "fieldname": "nasfund", "fieldtype": "Currency", "width": 120},
#     ]

# def get_nasfund_data(filters):
#     conditions = []
#     if filters.get("from_date"):
#         conditions.append("ss.start_date >= %(from_date)s")
#     if filters.get("to_date"):
#         conditions.append("ss.start_date <= %(to_date)s")
#     if filters.get("branch"):
#         conditions.append("ss.branch = %(branch)s")
#     if filters.get("employee"):
#         conditions.append("ss.employee_name = %(employee)s")
#     if filters.get("status"):
#         if filters["status"] == "Draft":
#             conditions.append("ss.docstatus = 0")
#         elif filters["status"] == "Submitted":
#             conditions.append("ss.docstatus = 1")
#         elif filters["status"] == " ":
#             conditions.append("ss.docstatus != 2")

#     conditions = " AND ".join(conditions) if conditions else "1=1"

#     nasfund_data = frappe.db.sql("""
#         SELECT
#             ss.employee_name,
#             e.date_of_joining,
#             ss.branch,
#             ss.start_date,
#             ss.end_date,
#             ss.payment_days,
#             ss.docstatus,
#             sd.amount AS national_superannuation_fund,
#             ec.component AS employer_npf_component,
#             ec.amount AS employer_npf_amount,
#             (sd.amount + ec.amount) AS nasfund
#         FROM
#             `tabSalary Slip` ss
#         JOIN
#             `tabSalary Detail` sd ON ss.name = sd.parent
#         JOIN
#             `tabEmployee` e ON ss.employee = e.name
#         JOIN
#             `tabEmployer Contribution` ec ON ss.name = ec.parent
#         WHERE
#             sd.salary_component = 'NATIONAL SUPERANNUATION FUND'
#             AND ec.component = 'EMPLOYER NPF'
#             AND {conditions}
#     """.format(conditions=conditions), filters, as_dict=True)

#     return nasfund_data

# /////////////////////////////////////////////////////////////////////////////////
