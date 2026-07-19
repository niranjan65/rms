# Copyright (c) 2025, Anantdv and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from datetime import datetime, timedelta
from frappe.utils import now_datetime, get_datetime


class RepairandReturn(Document):
    def after_save(self):
        """
        After saving the Repair and Return document, update the repair_and_return_start_time
        in each corresponding RMA BIN record.
        """
        for row in self.repair_and_return:
            frappe.msgprint(f"Processing row with RMA ID: {row.rma_id}")
            if row.rma_id:
                # Check if repair_and_return_start_time is already set
                rma_bin = frappe.get_doc("RMA BIN", row.rma_id)
                if not rma_bin.repair_and_return_start_time:
                    rma_bin.repair_and_return_start_time = now_datetime()
                    rma_bin.save()


def calculate_time_difference(start_time_str, end_time_str):
    """
    Calculate time difference between two datetime strings safely.
    Returns time in HH:MM:SS format.
    """
    if not start_time_str or not end_time_str:
        return None
    
    try:
        start_time = get_datetime(start_time_str)
        end_time = get_datetime(end_time_str)
        
        diff = end_time - start_time
        total_seconds = int(diff.total_seconds())
        
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
    except Exception as e:
        frappe.logger().error(f"Error calculating TAT: {str(e)}")
        return None


@frappe.whitelist()
def get_filtered_rma_data(customer=None, lot_no=None, warranty_status=None, circle=None, rma_id=None, repair_status=None):
    """
    Filter RMA BIN records based on provided filters.
    Only active (unassigned) items are fetched.
    """
    conditions = []
    values = {}
    
    # Check that already-assigned records won't be visible in the listing
    
    conditions.append("(repaired_by IS NULL OR repaired_by = '' OR rma_id_status = 'Rma Generated')")
    # conditions.append("(repaired_by IS NULL OR repaired_by = '' OR repair_status = 'QC Failed, Returned to Repair' OR repair_status = 'Rma Generated')")
        
    if customer:
        conditions.append("customer = %(customer)s")
        values["customer"] = customer
    
    if lot_no:
        conditions.append("lot_no = %(lot_no)s")
        values["lot_no"] = lot_no
    
    if warranty_status:
        conditions.append("warranty_status = %(warranty_status)s")
        values["warranty_status"] = warranty_status
    
    if circle:
        conditions.append("circle = %(circle)s")
        values["circle"] = circle
    
    if rma_id:
        conditions.append("(rma_id LIKE %(rma_id_filter)s OR name LIKE %(rma_id_filter)s)")
        values["rma_id_filter"] = f"%{rma_id}%"
    
    where_clause = ""
    limit_clause = ""
    
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)
    else:
        limit_clause = "LIMIT 200"
    
    query = f"""
        SELECT * FROM `tabRMA BIN`
        {where_clause}
        {limit_clause}
    """
    
    rma_bins = frappe.db.sql(query, values, as_dict=True)
    filtered_rma_bins = []
    
    for rma in rma_bins:
        # Fetch status child records
        rma["rma_status"] = frappe.get_all(
            "Status",  
            filters={"parent": rma["name"]},
            fields=["*"],
            order_by="timestamp desc"
        )

        # Fetch remarks child records
        rma["remarks"] = frappe.get_all(
            "Repair Remarks",  
            filters={"parent": rma["name"]},
            fields=["*"],
            order_by="creation desc"
        )
        
        should_include = True
        
        if rma["rma_status"] and len(rma["rma_status"]) > 0:
            last_status = rma["rma_status"][0]
            rma["rma_id_status"] = last_status.get("repair_status")
            
            if repair_status:
                if last_status.get("repair_status") != repair_status:
                    should_include = False
            else:
                # Exclude hold status on default loads
                if last_status.get("repair_status") == "Hold":
                    should_include = False
        else:
            rma["rma_id_status"] = None
            if repair_status:
                should_include = False
        
        if should_include:
            filtered_rma_bins.append(rma)

    return filtered_rma_bins


@frappe.whitelist()
def get_repair_status_options():
    """
    Helper function to get all unique repair status values
    """
    statuses = frappe.db.sql("""
        SELECT DISTINCT repair_status 
        FROM `tabStatus` 
        WHERE repair_status IS NOT NULL 
        ORDER BY repair_status
    """, as_dict=True)
    
    return [s.repair_status for s in statuses]