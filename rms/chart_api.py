import frappe

@frappe.whitelist()
def rnr_chart():
    return {
        "data": {
            "labels": ["Repaired", "Under Repair", "Scrap"],
            "datasets": [
                {
                    "name": "Pending",
                    "values": [
                        frappe.db.count("RMA BIN", {"repair_status": "Repaired"}),
                        frappe.db.count("RMA BIN", {"repair_status": "Under Repair"}),
                        frappe.db.count("RMA BIN", {"repair_status": "Scrap"})
                    ]
                }
            ]
        }
    }
# @frappe.whitelist()
# def rnr_chart():
#     return {
#         "labels": ["Repaired", "Under Repair", "Scrap"],
#         "datasets": [
#             {
#                 "name": "Pending",
#                 "values": [40, 7, 4]
#             }
#         ]
#     }