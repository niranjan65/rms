# import frappe

# def execute(filters=None):
#     if not filters:
#         filters = {}

#     columns = [
#         {"label": "Repaired Date", "fieldname": "repaired_date", "fieldtype": "Date", "width": 130},
#         {"label": "RMA ID", "fieldname": "rma_id", "fieldtype": "Data", "width": 150},
#         {"label": "Lot No.", "fieldname": "lot_no", "fieldtype": "Data", "width": 220},
#         {"label": "Repaired By", "fieldname": "repaired_by", "fieldtype": "Data", "width": 200},
#         {"label": "Customer", "fieldname": "customer", "fieldtype": "Data", "width": 200},
#         {"label": "Repair Status", "fieldname": "repair_status", "fieldtype": "Data", "width": 120},
#         {"label": "Start Time", "fieldname": "repair_and_return_start_time", "fieldtype": "Datetime", "width": 170},
#         {"label": "End Time", "fieldname": "repair_and_return_end_time", "fieldtype": "Datetime", "width": 170},
#         {"label": "Total Repair Time", "fieldname": "total_repair_time", "fieldtype": "Data", "width": 130}
#     ]

#     conditions = []

#     if filters.get("repair_status"):
#         conditions.append(["repair_status", "=", filters.get("repair_status")])

#     if filters.get("customer"):
#         conditions.append(["customer", "=", filters.get("customer")])

#     if filters.get("lot_no"):
#         conditions.append(["lot_no", "=", filters.get("lot_no")])

#     if filters.get("rma_id"):
#         conditions.append(["name", "=", filters.get("rma_id")])

    
#     user_roles = frappe.get_roles(frappe.session.user)
#     is_system_manager = "System Manager" in user_roles

#     if is_system_manager:
       
#         if filters.get("repaired_by"):
#             conditions.append(["repaired_by", "=", filters.get("repaired_by")])
#     else:
       
#         current_user_id = frappe.session.user
#         current_full_name = frappe.db.get_value("User", current_user_id, "full_name")

#         conditions.append(["repaired_by", "in", [current_user_id, current_full_name]])
    
#     records = frappe.get_all(
#         "RMA BIN",
#         filters=conditions,
#         fields=[
#             "name as rma_id",
#             "repaired_date",
#             "lot_no",
#             "repaired_by",
#             "customer",
#             "repair_status",
#             "repair_and_return_start_time",
#             "repair_and_return_end_time",
#             "total_repair_time"
#         ]
#     )

#     data = []
#     for row in records:
#         data.append({
#             "repaired_date": row.get("repaired_date"),
#             "rma_id": row.get("rma_id"),
#             "lot_no": row.get("lot_no"),
#             "repaired_by": row.get("repaired_by") or "",
#             "customer": row.get("customer"),
#             "repair_status": row.get("repair_status"),
#             "repair_and_return_start_time": row.get("repair_and_return_start_time"),
#             "repair_and_return_end_time": row.get("repair_and_return_end_time"),
#             "total_repair_time": row.get("total_repair_time")
#         })

#     return columns, data





# import frappe

# def execute(filters=None):
#     if not filters:
#         filters = {}

#     columns = [
#         {"label": "Repaired Date",      "fieldname": "repaired_date",               "fieldtype": "Date",     "width": 130},
#         {"label": "RMA ID",             "fieldname": "rma_id",                      "fieldtype": "Data",     "width": 150},
#         {"label": "Lot No.",            "fieldname": "lot_no",                      "fieldtype": "Data",     "width": 220},
#         {"label": "Repaired By",        "fieldname": "repaired_by",                 "fieldtype": "Data",     "width": 200},
#         {"label": "Customer",           "fieldname": "customer",                    "fieldtype": "Data",     "width": 200},
#         {"label": "Repair Status",      "fieldname": "repair_status",               "fieldtype": "Data",     "width": 120},
#         {"label": "Start Time",         "fieldname": "repair_and_return_start_time","fieldtype": "Datetime", "width": 170},
#         {"label": "End Time",           "fieldname": "repair_and_return_end_time",  "fieldtype": "Datetime", "width": 170},
#         {"label": "Total Repair Time",  "fieldname": "total_repair_time",           "fieldtype": "Data",     "width": 130}
#     ]

#     conditions = []

#     if filters.get("repair_status"):
#         conditions.append(["repair_status", "=", filters.get("repair_status")])

#     if filters.get("customer"):
#         conditions.append(["customer", "=", filters.get("customer")])

#     if filters.get("lot_no"):
#         conditions.append(["lot_no", "=", filters.get("lot_no")])

#     if filters.get("rma_id"):
#         conditions.append(["name", "=", filters.get("rma_id")])
     
      

#     # ---- ROLE-BASED ACCESS ----
#     user_roles = frappe.get_roles(frappe.session.user)
#     is_system_manager = "System Manager" in user_roles

#     if is_system_manager:
#         # System Manager: no restriction, sees all data
#         # repaired_by filter only applied if manually typed
#         if filters.get("repaired_by"):
#             conditions.append(["repaired_by", "like", f"%{filters.get('repaired_by')}%"])
#     else:
#         # Normal technician: ALWAYS restrict to their own data
#         # repaired_by stores "DT0014 - Satish Kumar" format
#         employees = frappe.get_all(
#             "Employee",
#             filters={"user_id": frappe.session.user},
#             fields=["name", "employee_name"]
#         )

#         if employees:
#             match_values = [
#                 "{} - {}".format(e["name"], e["employee_name"])
#                 for e in employees
#                 if e.get("name") and e.get("employee_name")
#             ]
#             if match_values:
#                 conditions.append(["repaired_by", "in", match_values])
#             else:
#                 conditions.append(["repaired_by", "=", "__NO_MATCH__"])
#         else:
#             conditions.append(["repaired_by", "=", "__NO_MATCH__"])
#     # ---- END ACCESS CONTROL ----

#     records = frappe.get_all(
#         "RMA BIN",
#         filters=conditions,
#         fields=[
#             "name as rma_id",
#             "repaired_date",
#             "lot_no",
#             "repaired_by",
#             "customer",
#             "repair_status",
#             "repair_and_return_start_time",
#             "repair_and_return_end_time",
#             "total_repair_time"
#         ]
#     )

#     data = []
#     for row in records:
#         data.append({
#             "repaired_date":                row.get("repaired_date"),
#             "rma_id":                       row.get("rma_id"),
#             "lot_no":                       row.get("lot_no"),
#             "repaired_by":                  row.get("repaired_by") or "",
#             "customer":                     row.get("customer"),
#             "repair_status":                row.get("repair_status"),
#             "repair_and_return_start_time": row.get("repair_and_return_start_time"),
#             "repair_and_return_end_time":   row.get("repair_and_return_end_time"),
#             "total_repair_time":            row.get("total_repair_time")
#         })

#     return columns, data



import frappe

def execute(filters=None):
    if not filters:
        filters = {}

    columns = [
        {"label": "Repaired Date",      "fieldname": "repaired_date",               "fieldtype": "Date",     "width": 130},
        {"label": "RMA ID",             "fieldname": "rma_id",                      "fieldtype": "Data",     "width": 150},
        {"label": "Lot No.",            "fieldname": "lot_no",                      "fieldtype": "Data",     "width": 220},
        {"label": "Repaired By",        "fieldname": "repaired_by",                 "fieldtype": "Data",     "width": 200},
        {"label": "Customer",           "fieldname": "customer",                    "fieldtype": "Data",     "width": 200},
        {"label": "Repair Status",      "fieldname": "repair_status",               "fieldtype": "Data",     "width": 120},
        {"label": "Start Time",         "fieldname": "repair_and_return_start_time","fieldtype": "Datetime", "width": 170},
        {"label": "End Time",           "fieldname": "repair_and_return_end_time",  "fieldtype": "Datetime", "width": 170},
        {"label": "Total Repair Time",  "fieldname": "total_repair_time",           "fieldtype": "Data",     "width": 130}
    ]

    conditions = []

    if filters.get("repair_status"):
        conditions.append(["repair_status", "=", filters.get("repair_status")])

    if filters.get("customer"):
        conditions.append(["customer", "=", filters.get("customer")])

    if filters.get("lot_no"):
        conditions.append(["lot_no", "=", filters.get("lot_no")])

    if filters.get("rma_id"):
        conditions.append(["name", "=", filters.get("rma_id")])
     
    # --- FIXED INDENTATION HERE ---
    if filters.get("repaired_by"):
        conditions.append(["repaired_by", "=", filters.get("repaired_by")])   

    # ---- ROLE-BASED ACCESS ----
    user_roles = frappe.get_roles(frappe.session.user)
    is_system_manager = "System Manager" in user_roles

    if is_system_manager:
        # System Manager: no restriction, sees all data
        # repaired_by filter only applied if manually typed
        if filters.get("repaired_by"):
            conditions.append(["repaired_by", "like", f"%{filters.get('repaired_by')}%"])
    else:
        # Normal technician: ALWAYS restrict to their own data
        # repaired_by stores "DT0014 - Satish Kumar" format
        employees = frappe.get_all(
            "Employee",
            filters={"user_id": frappe.session.user},
            fields=["name", "employee_name"]
        )

        if employees:
            match_values = [
                "{} - {}".format(e["name"], e["employee_name"])
                for e in employees
                if e.get("name") and e.get("employee_name")
            ]
            if match_values:
                conditions.append(["repaired_by", "in", match_values])
            else:
                conditions.append(["repaired_by", "=", "__NO_MATCH__"])
        else:
            conditions.append(["repaired_by", "=", "__NO_MATCH__"])
    # ---- END ACCESS CONTROL ----

    records = frappe.get_all(
        "RMA BIN",
        filters=conditions,
        fields=[
            "name as rma_id",
            "repaired_date",
            "lot_no",
            "repaired_by",
            "customer",
            "repair_status",
            "repair_and_return_start_time",
            "repair_and_return_end_time",
            "total_repair_time"
        ]
    )

    data = []
    for row in records:
        data.append({
            "repaired_date":                row.get("repaired_date"),
            "rma_id":                       row.get("rma_id"),
            "lot_no":                       row.get("lot_no"),
            "repaired_by":                  row.get("repaired_by") or "",
            "customer":                     row.get("customer"),
            "repair_status":                row.get("repair_status"),
            "repair_and_return_start_time": row.get("repair_and_return_start_time"),
            "repair_and_return_end_time":   row.get("repair_and_return_end_time"),
            "total_repair_time":            row.get("total_repair_time")
        })

    return columns, data