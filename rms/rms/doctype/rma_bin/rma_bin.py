# # Copyright (c) 2025, Anantdv and contributors
# # For license information, please see license.txt

from __future__ import unicode_literals
from frappe.model.document import Document


# class RMABIN(Document):
# 	pass



import frappe
from frappe import _

class RMABIN(Document):
    def validate(self):

        self.format_repaired_by()
        # self.validate_quality_check_rules()
    
    def format_repaired_by(self):
        """Format repaired_by field to show Employee ID - Employee Name"""
        if self.repaired_by:
            # Extract just the employee ID if the value is already formatted
            employee_id = self.repaired_by
            
            # Check if it's already in "ID - Name" format
            if ' - ' in employee_id:
                employee_id = employee_id.split(' - ')[0]
            
            # Only fetch and format if not already formatted
            if ' - ' not in self.repaired_by:
                try:
                    employee_data = frappe.db.get_value('Employee', employee_id, 
                                                      ['employee', 'employee_name'], as_dict=True)
                    
                    if employee_data:
                        self.repaired_by = f"{employee_data.employee} - {employee_data.employee_name}"
                    else:
                        frappe.throw(_("Employee {0} not found").format(employee_id))
                        
                except Exception as e:
                    frappe.throw(_("Error fetching employee data: {0}").format(str(e)))

    def before_save(self):
        pass
        # initiated = self.quality_check_initiated
        # done = self.quality_check_done
        # passed = self.quality_check_pass
        # if done:
        #     if not initiated:
        #         frappe.throw(
        #             "Quality Check Initiated must be checked before Quality Check Done."
        #         )

        #     if not passed:
        #         frappe.throw(
        #             "Quality Check Pass is mandatory when Quality Check Done is checked."
        #         )

        

    #     # if done and not initiated:
    #     #     frappe.throw(
    #     #         "Quality Check Initiated must be checked before Quality Check Done."
    #     #     )

    #     # if done and not passed:
    #     #     frappe.throw(
    #     #         "Quality Check Pass is mandatory when Quality Check Done is checked."
    #     #     )

    #     # if passed and not done:
    #     #     frappe.throw(
    #     #         "Quality Check Done must be checked before Quality Check Pass."
    #     #     )



    def format_quality_check_assigned_to(self):
        """Format repaired_by field to show Employee ID - Employee Name"""

        employee_id = self.quality_check_assigned_to
        if ' - ' in employee_id:
            employee_id = employee_id.split(' - ')[0]
        
        if ' - ' not in self.quality_check_assigned_to:
            try:
                employee_data = frappe.db.get_value('Employee', employee_id, ['employee', 'employee_name'], as_dict=True)

                if employee_data:
                    self.repaired_by = f"{employee_data.employee} - {employee_data.employee_name}"
                else:
                    frappe.throw(_("Employee {0} not found").format(employee_id))

            except Exception as e:
                frappe.throw(_("Error fetching employee data: {0}").format(str(e)))




# ////////////////////////////For dashboard Debjit/////////////////////////////////            


# /////////////////////// SIMPLE COUNTERS///////////////////////////

# @frappe.whitelist()
# def fetch_top_customer_last_30_days():
#     """Returns the customer with the most RMAs in the last 30 days"""
#     result = frappe.db.sql("""
#         SELECT customer, COUNT(*) as total_rmas
#         FROM `tabRMA BIN`
#         WHERE receiving_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
#           AND receiving_date <= CURDATE()
#         GROUP BY customer
#         ORDER BY total_rmas DESC
#         LIMIT 1
#     """, as_dict=True)
    
#     return result[0] if result else {"customer": "No data", "total_rmas": 0}



@frappe.whitelist()
def count_total_rma():
    """Total count of all RMA BIN records"""
    return {"value": frappe.db.count("RMA BIN")}

@frappe.whitelist()
def count_warranty_yes():
    """Count of records with warranty_status = 'Yes'"""
    return {"value": frappe.db.count("RMA BIN", {"warranty_status": "Yes"})}

@frappe.whitelist()
def count_warranty_no():
    """Count of records with warranty_status = 'No'"""
    return {"value": frappe.db.count("RMA BIN", {"warranty_status": "No"})}



@frappe.whitelist()
def count_total_rma_last_30_days():
    """Total RMA BIN records received in the last 30 days"""
    return {
        "value": frappe.db.sql(
            """
            SELECT COUNT(*) 
            FROM `tabRMA BIN`
            WHERE receiving_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
              AND receiving_date <= CURDATE()
            """
        )[0][0]
    }

@frappe.whitelist()
def count_total_rma_last_7_days():
    """Total RMA BIN records received in the last 7 days"""
    return {
        "value": frappe.db.sql(
            """
            SELECT COUNT(*) 
            FROM `tabRMA BIN`
            WHERE receiving_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
              AND receiving_date <= CURDATE()
            """
        )[0][0]
    }


# ──────────────────────────────────────────────────────────────────────────────
#  UNIQUE CUSTOMER TRENDS
# ──────────────────────────────────────────────────────────────────────────────

@frappe.whitelist()
def fetch_monthly_customers():
    """Unique customers whose receiving_date is within the past 30 days."""
    return {
        "value": frappe.db.sql(
            """
            SELECT COUNT(DISTINCT customer)
            FROM `tabRMA BIN`
            WHERE receiving_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
              AND receiving_date <= CURDATE()
            """
        )[0][0]
    }


@frappe.whitelist()
def fetch_weekly_customers():
    """Unique customers whose receiving_date is within the past 7 days."""
    return {
        "value": frappe.db.sql(
            """
            SELECT COUNT(DISTINCT customer)
            FROM `tabRMA BIN`
            WHERE receiving_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
              AND receiving_date <= CURDATE()
            """
        )[0][0]
    }

# ────────────────── single-value counters (repair_status) ──────────────────
@frappe.whitelist()
def count_delivered():
    return {"value": frappe.db.count("RMA BIN", {"repair_status": "Delivered"})}

# @frappe.whitelist()
# def rma_generated():
#     count = 0
#     rma_bins = frappe.get_all("RMA BIN", pluck="name")

#     for rma in rma_bins:
#         statuses = frappe.get_all(
#             "RMA Status Update",
#             filters={"parent": rma, "parenttype": "RMA BIN"},
#             pluck="status"
#         )
#         if statuses and all(s == "RMA Generated" for s in statuses):
#             count += 1

#     return {"value": count}


# @frappe.whitelist()
# def count_rma_assign():
#     count = 0
#     rma_bins = frappe.get_all("RMA BIN", pluck="name")

#     allowed_status = ["RMA Assign"]

#     for rma in rma_bins:
#         statuses = frappe.get_all(
#             "RMA Status Update",
#             filters={
#                 "parent": rma,
#                 "parenttype": "RMA BIN"
#             },
#             pluck="status"
#         )

#         if statuses and all(s in allowed_status for s in statuses):
#             count += 1

#     return {"value": count}


# @frappe.whitelist()
# def technician_update():
#     count = 0
#     rma_bins = frappe.get_all("RMA BIN", pluck="name")
#     allowed_status = ["RMA Technician Update"]
#     for rma in rma_bins:
#         statuses = frappe.get_all(
#             "RMA Status Update",
#             filters={
#                 "parent": rma,
#                 "parenttype": "RMA BIN"
#             },
#             pluck="status"
#         )
#         if statuses and all(s in allowed_status for s in statuses):
#             count += 1
#     return {"value": count}

# @frappe.whitelist()
# def qc_assigned():
#     count = 0
#     rma_bins = frappe.get_all("RMA BIN", pluck="name")
#     allowed_status = ["RMA Q/C Assigned"]
#     for rma in rma_bins:
#         statuses = frappe.get_all(
#             "RMA Status Update",
#             filters={
#                 "parent": rma,
#                 "parenttype": "RMA BIN"
#             },
#             pluck="status"
#         )
#         if statuses and all(s in allowed_status for s in statuses):
#             count += 1
#     return {"value": count}

# @frappe.whitelist()
# def qc_done():
#     count = 0
#     rma_bins = frappe.get_all("RMA BIN", pluck="name")
#     allowed_status = ["RMA Q/C Done"]
#     for rma in rma_bins:
#         statuses = frappe.get_all(
#             "RMA Status Update",
#             filters={
#                 "parent": rma,
#                 "parenttype": "RMA BIN"
#             },
#             pluck="status"
#         )
#         if statuses and all(s in allowed_status for s in statuses):
#             count += 1
#     return {"value": count}

# @frappe.whitelist()
# def dn_note_dispatch():
#     count = 0
#     rma_bins = frappe.get_all("RMA BIN", pluck="name")
#     allowed_status = ["Delivery Note Created and Dispatch Initiated"]
#     for rma in rma_bins:
#         statuses = frappe.get_all(
#             "RMA Status Update",
#             filters={
#                 "parent": rma,
#                 "parenttype": "RMA BIN"
#             },
#             pluck="status"
#         )
#         if statuses and all(s in allowed_status for s in statuses):
#             count += 1
#     return {"value": count}

# @frappe.whitelist()
# def dn_note_submit():
#     count = 0
#     rma_bins = frappe.get_all("RMA BIN", pluck="name")
#     allowed_status = ["Delivery Note Submitted"]
#     for rma in rma_bins:
#         statuses = frappe.get_all(
#             "RMA Status Update",
#             filters={
#                 "parent": rma,
#                 "parenttype": "RMA BIN"
#             },
#             pluck="status"
#         )
#         if statuses and all(s in allowed_status for s in statuses):
#             count += 1
#     return {"value": count}




@frappe.whitelist()
def rma_generated():
    count = 0
    rma_bins = frappe.get_all("RMA BIN", pluck="name")

    for rma in rma_bins:
        last_status = frappe.get_all(
            "RMA Status Update",
            filters={
                "parent": rma,
                "parenttype": "RMA BIN"
            },
            fields=["status"],
            order_by="idx desc",
            limit=1
        )

        if last_status and last_status[0].status == "RMA Generated":
            count += 1

    return {"value": count}



@frappe.whitelist()
def count_rma_assign():
    count = 0
    rma_bins = frappe.get_all("RMA BIN", pluck="name")

    for rma in rma_bins:
        last_status = frappe.get_all(
            "RMA Status Update",
            filters={
                "parent": rma,
                "parenttype": "RMA BIN"
            },
            fields=["status"],
            order_by="idx desc",
            limit=1
        )

        if last_status and last_status[0].status == "RMA Assign":
            count += 1

    return {"value": count}


@frappe.whitelist()
def technician_update():
    count = 0
    rma_bins = frappe.get_all("RMA BIN", pluck="name")

    for rma in rma_bins:
        last_status = frappe.get_all(
            "RMA Status Update",
            filters={
                "parent": rma,
                "parenttype": "RMA BIN"
            },
            fields=["status"],
            order_by="idx desc",
            limit=1
        )

        if last_status and last_status[0].status == "RMA Technician Update":
            count += 1

    return {"value": count}



@frappe.whitelist()
def qc_assigned():
    count = 0
    rma_bins = frappe.get_all("RMA BIN", pluck="name")

    for rma in rma_bins:
        last_status = frappe.get_all(
            "RMA Status Update",
            filters={
                "parent": rma,
                "parenttype": "RMA BIN"
            },
            fields=["status"],
            order_by="idx desc",
            limit=1
        )

        if last_status and last_status[0].status == "RMA Q/C Assigned":
            count += 1

    return {"value": count}


@frappe.whitelist()
def dn_note_dispatch():
    count = 0
    rma_bins = frappe.get_all("RMA BIN", pluck="name")

    for rma in rma_bins:
        last_status = frappe.get_all(
            "RMA Status Update",
            filters={
                "parent": rma,
                "parenttype": "RMA BIN"
            },
            fields=["status"],
            order_by="idx desc",
            limit=1
        )

        if last_status and last_status[0].status == "Delivery Note Created and Dispatch Initiated":
            count += 1

    return {"value": count}


@frappe.whitelist()
def dn_note_submit():
    count = 0
    rma_bins = frappe.get_all("RMA BIN", pluck="name")

    for rma in rma_bins:
        last_status = frappe.get_all(
            "RMA Status Update",
            filters={
                "parent": rma,
                "parenttype": "RMA BIN"
            },
            fields=["status"],
            order_by="idx desc",
            limit=1
        )

        if last_status and last_status[0].status == "Delivery Note Submitted":
            count += 1

    return {"value": count}


@frappe.whitelist()
def qc_done():
    count = 0
    rma_bins = frappe.get_all("RMA BIN", pluck="name")

    for rma in rma_bins:
        last_status = frappe.get_all(
            "RMA Status Update",
            filters={
                "parent": rma,
                "parenttype": "RMA BIN"
            },
            fields=["status"],
            order_by="idx desc",
            limit=1
        )

        if last_status and last_status[0].status == "RMA Q/C Done":
            count += 1

    return {"value": count}


@frappe.whitelist()
def count_dispatched():
    return {"value": frappe.db.count("RMA BIN", {"repair_status": "Dispatched"})}

@frappe.whitelist()
def count_approved_by_account():
    return {"value": frappe.db.count("RMA BIN", {"repair_status": "Approved By Account"})}

@frappe.whitelist()
def count_drafted():
    return {"value": frappe.db.count("RMA BIN", {"repair_status": "Drafted"})}

@frappe.whitelist()
def count_scrap():
    return {"value": frappe.db.count("RMA BIN", {"repair_status": "Scrap"})}

@frappe.whitelist()
def count_returned_unrepaired():
    return {"value": frappe.db.count("RMA BIN", {"repair_status": "Returned Unrepaired"})}

@frappe.whitelist()
def count_repaired():
    return {"value": frappe.db.count("RMA BIN", {"repair_status": "Repaired"})}

@frappe.whitelist()
def count_under_repair():
    return {"value": frappe.db.count("RMA BIN", {"repair_status": "Under Repair"})}

@frappe.whitelist()
def count_hold():
    return {"value": frappe.db.count("RMA BIN", {"repair_status": "Hold"})}

# function convert_seconds_to_tat(total_seconds) {]
#     if (!total_seconds || total_seconds === 0) return "00:00:00";
    
#     try {
#         const hours = Math.floor(total_seconds / 3600);
#         const minutes = Math.floor((total_seconds % 3600) / 60);
#         const seconds = total_seconds % 60;
        
#         return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
#     } catch (err) {
#         console.error("Error converting seconds to TAT:", err);
#         return "00:00:00";
#     }
# }





import datetime

# @frappe.whitelist()
# def count_Total_TAT(rma_id):
#     frappe.db.count("RMA BIN", {"repair_status": "Hold"})

#     repairandreturn_tat = frappe.db.sql("""
#         SELECT tat
#         FROM `tabRepair and Return Table`
#         WHERE tat IS NOT NULL
#         AND
#         rma_id = %s
#         """,(rma_id,),as_dict=True)[0]["tat"]

#     repairandreturn_tec_view_tat = frappe.db.sql("""
#         SELECT tat
#         FROM `tabRepair and Return Tech View Table`
#         WHERE 
#         rma_id = %s
#         """,(rma_id,),as_dict=True)[0]["tat"]

#     repairandreturn_queality_test_tat = frappe.db.sql("""
#         SELECT tat
#         FROM `tabQuality Check table`
#         where
#         rma_id = %s
#         """,(rma_id,),as_dict=True)[0]["tat"]
    
#     repairandreturn_queality_test_tech_view_tat = frappe.db.sql("""
#         SELECT tat
#         FROM `tabQuality Check Technician view Table`
#         where
#         rma_id = %s
#         """,(rma_id,),as_dict=True)[0]["tat"]
#     data = {
#         "RAR":repairandreturn_tat,"RAR-TV": repairandreturn_tec_view_tat,
#         "RAR-QT": repairandreturn_queality_test_tat,
#         "RAR-QT-TV": repairandreturn_queality_test_tech_view_tat
#     }
    
#     data = {
#     "RAR": repairandreturn_tat,
#     "RAR-TV": repairandreturn_tec_view_tat,
#     "RAR-QT": repairandreturn_queality_test_tat,
#     "RAR-QT-TV": repairandreturn_queality_test_tech_view_tat
#     }

#     total_seconds = 0

#     for t in data.values():

#         # Case 1: Already a timedelta → convert to seconds
#         if isinstance(t, datetime.timedelta):
#             total_seconds += t.total_seconds()
#             continue

#         # Case 2: Is Frappe Duration object
#         if hasattr(t, "total_seconds"):  
#             total_seconds += t.total_seconds()
#             continue

#         # Case 3: String "HH:MM:SS"
#         if isinstance(t, str):
#             parts = t.split(":")
#             h, m, s = map(int, parts)
#             total_seconds += h * 3600 + m * 60 + s
#             continue

#         # Unknown type → skip or raise error
#         frappe.throw(f"Unsupported type {type(t)} for value {t}")

#     final_time = str(datetime.timedelta(seconds=total_seconds))

#     # return (rma_id,data,final_time)
#     return final_time



import datetime
import frappe


@frappe.whitelist()
def count_Total_TAT(rma_id):
    frappe.db.count("RMA BIN", {"repair_status": "Hold"})

    def get_tat(query, params):
        rows = frappe.db.sql(query, params, as_dict=True)
        return rows[0]["tat"] if rows and rows[0].get("tat") is not None else "0:0:0"

    repairandreturn_tat = get_tat(
        """
        SELECT tat
        FROM `tabRepair and Return Table`
        WHERE tat IS NOT NULL
        AND rma_id = %s
        """,
        (rma_id,),
    )

    repairandreturn_tec_view_tat = get_tat(
        """
        SELECT tat
        FROM `tabRepair and Return Tech View Table`
        WHERE rma_id = %s
        """,
        (rma_id,),
    )

    repairandreturn_queality_test_tat = get_tat(
        """
        SELECT tat
        FROM `tabQuality Check table`
        WHERE rma_id = %s
        """,
        (rma_id,),
    )

    repairandreturn_queality_test_tech_view_tat = get_tat(
        """
        SELECT tat
        FROM `tabQuality Check Technician view Table`
        WHERE rma_id = %s
        """,
        (rma_id,),
    )

    data = {
        "RAR": repairandreturn_tat,
        "RAR-TV": repairandreturn_tec_view_tat,
        "RAR-QT": repairandreturn_queality_test_tat,
        "RAR-QT-TV": repairandreturn_queality_test_tech_view_tat,
    }

    total_seconds = 0

    for t in data.values():
        # Case 1: Already a timedelta → convert to seconds
        if isinstance(t, datetime.timedelta):
            total_seconds += t.total_seconds()
            continue

        # Case 2: Is Frappe Duration object
        if hasattr(t, "total_seconds"):
            total_seconds += t.total_seconds()
            continue

        # Case 3: String "HH:MM:SS"
        if isinstance(t, str):
            parts = t.split(":")
            h, m, s = map(int, parts)
            total_seconds += h * 3600 + m * 60 + s
            continue

        # Unknown type → skip or raise error
        frappe.throw(f"Unsupported type {type(t)} for value {t}")

    final_time = str(datetime.timedelta(seconds=total_seconds))
    return final_time





# USER WISE DAHSBOARD SHOW FOR TECHNICIAN 
# def get_employee_full():
#     user = frappe.session.user
#     emp = frappe.db.get_value("Employee", {"preferred_email": user}, "name")
#     if not emp:
#         emp = frappe.db.get_value("Employee", {"prefered_contact_email": user}, "name")
#     if not emp:
#         return None
#     emp_name = frappe.db.get_value("Employee", emp, "employee_name")
#     return f"{emp} - {emp_name}"
import frappe

def get_employee_full():
    user = frappe.session.user

    emp = frappe.db.get_value(
        "Employee",
        {
            "prefered_email": user
        },
        ["name", "employee_name"],
        as_dict=True
    )

    if not emp:
        emp = frappe.db.get_value(
            "Employee",
            {
                "prefered_contact_email": user
            },
            ["name", "employee_name"],
            as_dict=True
        )

    if not emp:
        return None

    return f"{emp.name} - {emp.employee_name}"

@frappe.whitelist()
def get_repaired_count():
    emp = get_employee_full()
    if not emp:
        return 0
    return frappe.db.count(
        "RMA BIN",
        {
            "repair_status": "Repaired",
            "repaired_by": emp
        }
    )


@frappe.whitelist()
def get_under_repair_count():
    emp = get_employee_full()
    if not emp:
        return 0
    return frappe.db.count(
        "RMA BIN",
        {
            "repair_status": "Under Repair",
            "repaired_by": emp
        }
    )


@frappe.whitelist()
def get_scrap_count():
    emp = get_employee_full()
    if not emp:
        return 0
    return frappe.db.count(
        "RMA BIN",
        {
            "repair_status": "Scrap",
            "repaired_by": emp
        }
    )

@frappe.whitelist()
def get_pending_count():
    emp = get_employee_full()
    if not emp:
        return 0

    return frappe.db.sql("""
        SELECT COUNT(*) as count
        FROM `tabRMA BIN`
        WHERE repaired_by = %s
        AND (repair_status IS NULL OR repair_status = '')
    """, emp)[0][0]