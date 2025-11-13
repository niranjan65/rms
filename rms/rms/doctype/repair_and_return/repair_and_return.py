# repair_and_return.py
# Copyright (c) 2025, Anantdv and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class RepairandReturn(Document):
    pass


@frappe.whitelist()
def get_filtered_rma_data(customer=None, lot_no=None, warranty_status=None, circle=None, rma_id=None, repair_status=None):
    """
    Filter RMA BIN records based on provided filters
    """
    # Build filters for the query
    conditions = []
    values = {}
    
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
        # Check both rma_id and name fields (rma_reference doesn't exist in your DocType)
        conditions.append("(rma_id LIKE %(rma_id_filter)s OR name LIKE %(rma_id_filter)s)")
        values["rma_id_filter"] = f"%{rma_id}%"
    
    # Build the WHERE clause
    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)
    
    # Execute query to get RMA bins
    query = f"""
        SELECT * FROM `tabRMA BIN`
        {where_clause}
    """
    
    rma_bins = frappe.db.sql(query, values, as_dict=True)
    
    filtered_rma_bins = []
    
    for rma in rma_bins:
        # Get status records for this RMA
        rma["rma_status"] = frappe.get_all(
            "Status",  
            filters={"parent": rma["name"]},
            fields=["*"],
            order_by="timestamp desc"  # Order by timestamp to get latest first
        )

        # Get remarks for this RMA
        rma["remarks"] = frappe.get_all(
            "Repair Remarks",  
            filters={"parent": rma["name"]},
            fields=["*"],
            order_by="creation desc"  # Also order remarks by newest first
        )
        
        # Apply repair_status filter if provided
        should_include = True
        
        if rma["rma_status"] and len(rma["rma_status"]) > 0:
            # Get the last status - since we're ordering by timestamp desc, first is latest
            # No need to check order as we're explicitly ordering DESC in the query
            last_status = rma["rma_status"][0]
            
            # Store the last status in the RMA object for easy access
            rma["rma_id_status"] = last_status.get("repair_status")
            
            # If repair_status filter is provided, check if it matches
            if repair_status:
                # Check if the last status matches the filter
                if last_status.get("repair_status") != repair_status:
                    should_include = False
            else:
                # If no repair_status filter, exclude "Hold" status (original logic)
                if last_status.get("repair_status") == "Hold":
                    should_include = False
        else:
            # No status exists
            rma["rma_id_status"] = None
            
            # If repair_status filter is provided and no status exists, exclude
            if repair_status:
                should_include = False
        
        if should_include:
            filtered_rma_bins.append(rma)

    return filtered_rma_bins


@frappe.whitelist()
def get_repair_status_options():
    """
    Helper function to get all unique repair status values
    for populating dropdown options
    """
    statuses = frappe.db.sql("""
        SELECT DISTINCT repair_status 
        FROM `tabStatus` 
        WHERE repair_status IS NOT NULL 
        ORDER BY repair_status
    """, as_dict=True)
    
    return [s.repair_status for s in statuses]