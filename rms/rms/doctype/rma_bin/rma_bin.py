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
