# repair_and_return_technician_view.py
# Copyright (c) 2025, Anantdv and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class RepairandReturnTechnicianView(Document):
    pass


@frappe.whitelist()
def get_technician_rma_data(technician, customer='', lot_no='', warranty_status='', circle='', rma_id='', repair_status=''):
    """Get RMA data with child table values filtered by technician and optional filters"""

    try:
        # Build filters using SQL for better control
        conditions = []
        values = {}
        
        # Required filter for technician
        conditions.append("repaired_by = %(technician)s")
        values["technician"] = technician
        
        # Document status filter
        conditions.append("docstatus != 2")
        
        # Optional filters
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
            # Check both rma_id and name fields for RMA ID
            conditions.append("(rma_id LIKE %(rma_id_filter)s OR name LIKE %(rma_id_filter)s)")
            values["rma_id_filter"] = f"%{rma_id}%"
        
        # Build WHERE clause
        where_clause = ""
        if conditions:
            where_clause = "WHERE " + " AND ".join(conditions)
        
        # Execute query to get RMA bins
        query = f"""
            SELECT * FROM `tabRMA BIN`
            {where_clause}
            ORDER BY creation DESC
        """
        
        parent_docs = frappe.db.sql(query, values, as_dict=True)
        
        filtered_docs = []
        
        # For each parent, get child table rows and check last status
        for doc in parent_docs:
            # Get status records
            child_rows = frappe.get_all(
                "Status",  
                filters={"parent": doc.name, "parenttype": "RMA BIN"},
                fields=["*"],
                order_by="timestamp desc"  # Order by timestamp to get latest first
            )
            
            # Apply repair_status filter if provided
            should_include = True
            
            if child_rows and len(child_rows) > 0:
                # Get the latest status (first item since ordered desc)
                last_status = child_rows[0]
                
                # Store the last status in the doc for easy access
                doc["rma_id_status"] = last_status.get("repair_status")
                
                # If repair_status filter is provided, check if it matches
                if repair_status:
                    if last_status.get("repair_status") != repair_status:
                        should_include = False
                else:
                    # If no repair_status filter, exclude "Hold" status (original logic)
                    if last_status.get("repair_status") == "Hold":
                        should_include = False
            else:
                # No status exists
                doc["rma_id_status"] = None
                
                # If repair_status filter is provided and no status exists, exclude
                if repair_status:
                    should_include = False
            
            # Only include if it passes the status filter
            if should_include:
                doc["rma_status"] = child_rows
                
                # Get remarks
                child_remarks = frappe.get_all(
                    "Repair Remarks",  
                    filters={"parent": doc.name, "parenttype": "RMA BIN"},
                    fields=["*"],
                    order_by="creation desc"
                )
                doc["remarks"] = child_remarks
                
                filtered_docs.append(doc)

        return filtered_docs

    except Exception as e:
        frappe.log_error(f"Error fetching technician RMA data: {str(e)}")
        frappe.throw(f"Error fetching RMA data for technician: {str(e)}")