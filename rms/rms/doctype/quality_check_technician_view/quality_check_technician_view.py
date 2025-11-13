


# # Copyright (c) 2025, Anantdv and contributors
# # For license information, please see license.txt

# import frappe
# from frappe.model.document import Document

# class QualityCheckTechnicianView(Document):
#     pass

# @frappe.whitelist()
# def get_doctype_fields(doctype_name):
#     """
#     Helper method to get fields of a specific DocType
#     """
#     try:
#         fields = frappe.db.sql("""
#             SELECT fieldname, label, fieldtype, options
#             FROM `tabDocField`
#             WHERE parent = %s 
#             AND fieldtype NOT IN ('Section Break', 'Column Break', 'HTML', 'Heading')
#             ORDER BY idx
#         """, doctype_name, as_dict=True)
        
#         return fields
#     except Exception as e:
#         frappe.logger().error(f"Error getting fields for {doctype_name}: {str(e)}")
#         return []

# @frappe.whitelist()
# def get_available_doctypes():
#     """
#     Helper method to find available DocTypes that might contain quality check data
#     """
#     try:
#         # Get all custom DocTypes
#         doctypes = frappe.db.sql("""
#             SELECT name, module 
#             FROM `tabDocType` 
#             WHERE custom = 1 
#             AND name LIKE '%quality%' OR name LIKE '%check%' OR name LIKE '%rma%' OR name LIKE '%bin%'
#             ORDER BY name
#         """, as_dict=True)
        
#         return doctypes
#     except Exception as e:
#         frappe.logger().error(f"Error getting DocTypes: {str(e)}")
#         return []

# @frappe.whitelist()
# def get_technician_quality_check_data(technician, customer=None, lot_no=None, warranty_status=None, circle=None, rma_id=None):
#     """
#     Fetch Quality Check data for a specific technician with optional filters,
#     including RMA ID filter and child table values.
#     """
#     try:
#         # Build filters - using SQL approach for better control
#         conditions = []
#         values = {}
        
#         # Technician filter (required)
#         conditions.append("quality_check_assigned_to = %(technician)s")
#         values["technician"] = technician
        
#         if customer:
#             conditions.append("customer = %(customer)s")
#             values["customer"] = customer
            
#         if lot_no:
#             conditions.append("lot_no = %(lot_no)s")
#             values["lot_no"] = lot_no
            
#         if warranty_status:
#             conditions.append("warranty_status = %(warranty_status)s")
#             values["warranty_status"] = warranty_status
            
#         if circle:
#             conditions.append("circle = %(circle)s")
#             values["circle"] = circle
            
#         if rma_id:
#             # Check both rma_id and name fields with LIKE for partial matching
#             conditions.append("(rma_id LIKE %(rma_id_filter)s OR name LIKE %(rma_id_filter)s)")
#             values["rma_id_filter"] = f"%{rma_id}%"
        
#         # Always exclude cancelled documents
#         conditions.append("docstatus != 2")
        
#         # Build WHERE clause
#         where_clause = ""
#         if conditions:
#             where_clause = "WHERE " + " AND ".join(conditions)
        
#         # Execute query
#         query = f"""
#             SELECT * FROM `tabRMA BIN`
#             {where_clause}
#             ORDER BY creation DESC
#         """
        
#         rma_bins = frappe.db.sql(query, values, as_dict=True)
        
#         # Fetch child table data for each record
#         for rma in rma_bins:
#             # Get status records
#             rma["rma_status"] = frappe.get_all(
#                 "Status",
#                 filters={"parent": rma["name"]},
#                 fields=["*"],
#                 order_by="timestamp desc"
#             )
            
#             # Get remarks
#             rma["remarks"] = frappe.get_all(
#                 "Repair Remarks",
#                 filters={"parent": rma["name"]},
#                 fields=["*"],
#                 order_by="creation desc"
#             )
            
#             # Set latest status if exists
#             if rma["rma_status"] and len(rma["rma_status"]) > 0:
#                 rma["rma_id_status"] = rma["rma_status"][0].get("repair_status")
            
#             # Ensure rma_id field is populated
#             if not rma.get("rma_id"):
#                 rma["rma_id"] = rma.get("name")
        
#         # Log for debugging
#         frappe.logger().info(f"Quality Check Technician View - Found {len(rma_bins)} records for technician: {technician}, Filters: {values}")
        
#         return rma_bins

#     except Exception as e:
#         frappe.logger().error(f"Error in get_technician_quality_check_data: {str(e)}")
#         frappe.throw(f"Error fetching RMA BIN data: {str(e)}")

# @frappe.whitelist()
# def update_rma_bin_status(rma_bin_id, status, remarks=None):
#     """
#     Update RMA BIN status and remarks
#     """
#     try:
#         doc = frappe.get_doc("RMA BIN", rma_bin_id)
        
#         # Update the main status field
#         doc.rma_id_status = status
        
#         # Add status to child table
#         doc.append("rma_status", {
#             "repair_status": status,
#             "timestamp": frappe.utils.now_datetime()
#         })
        
#         # Add remarks to child table if provided
#         if remarks:
#             doc.append("remarks", {
#                 "repair_remarks": remarks,
#                 "timestamp": frappe.utils.now_datetime()  
#             })
        
#         # Update last_updated_on if it exists
#         if hasattr(doc, 'last_updated_on'):
#             doc.last_updated_on = frappe.utils.now_datetime()
            
#         doc.save()
#         frappe.db.commit()
        
#         return {"success": True, "message": f"RMA BIN {rma_bin_id} updated successfully"}
        
#     except Exception as e:
#         frappe.logger().error(f"Error updating RMA BIN: {str(e)}")
#         return {"success": False, "message": f"Error: {str(e)}"}






# Copyright (c) 2025, Anantdv and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class QualityCheckTechnicianView(Document):
    pass

@frappe.whitelist()
def get_doctype_fields(doctype_name):
    """
    Helper method to get fields of a specific DocType
    """
    try:
        fields = frappe.db.sql("""
            SELECT fieldname, label, fieldtype, options
            FROM `tabDocField`
            WHERE parent = %s 
            AND fieldtype NOT IN ('Section Break', 'Column Break', 'HTML', 'Heading')
            ORDER BY idx
        """, doctype_name, as_dict=True)
        
        return fields
    except Exception as e:
        frappe.logger().error(f"Error getting fields for {doctype_name}: {str(e)}")
        return []

@frappe.whitelist()
def get_available_doctypes():
    """
    Helper method to find available DocTypes that might contain quality check data
    """
    try:
        # Get all custom DocTypes
        doctypes = frappe.db.sql("""
            SELECT name, module 
            FROM `tabDocType` 
            WHERE custom = 1 
            AND name LIKE '%quality%' OR name LIKE '%check%' OR name LIKE '%rma%' OR name LIKE '%bin%'
            ORDER BY name
        """, as_dict=True)
        
        return doctypes
    except Exception as e:
        frappe.logger().error(f"Error getting DocTypes: {str(e)}")
        return []

@frappe.whitelist()
def get_technician_quality_check_data(technician, customer=None, lot_no=None, warranty_status=None, circle=None, rma_id=None, repair_status=None):
    """
    Fetch Quality Check data for a specific technician with optional filters,
    including RMA ID and Repair Status filters with child table values.
    Following the same pattern as repair_and_return.py
    """
    try:
        # Build filters - using SQL approach for better control
        conditions = []
        values = {}
        
        # Technician filter (required)
        conditions.append("quality_check_assigned_to = %(technician)s")
        values["technician"] = technician
        
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
            # Check both rma_id and name fields with LIKE for partial matching
            conditions.append("(rma_id LIKE %(rma_id_filter)s OR name LIKE %(rma_id_filter)s)")
            values["rma_id_filter"] = f"%{rma_id}%"
        
        # Always exclude cancelled documents
        conditions.append("docstatus != 2")
        
        # Build WHERE clause
        where_clause = ""
        if conditions:
            where_clause = "WHERE " + " AND ".join(conditions)
        
        # Execute query
        query = f"""
            SELECT * FROM `tabRMA BIN`
            {where_clause}
            ORDER BY creation DESC
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
                last_status = rma["rma_status"][0]
                
                # Store the last status in the RMA object for easy access
                rma["rma_id_status"] = last_status.get("repair_status")
                
                # If repair_status filter is provided, check if it matches
                if repair_status:
                    # Check if the last status matches the filter
                    if last_status.get("repair_status") != repair_status:
                        should_include = False
            else:
                # No status exists - check the main field
                if rma.get("rma_id_status"):
                    # If repair_status filter is provided, check against main field
                    if repair_status and rma.get("rma_id_status") != repair_status:
                        should_include = False
                else:
                    # No status at all
                    rma["rma_id_status"] = None
                    
                    # If repair_status filter is provided and no status exists, exclude
                    if repair_status:
                        should_include = False
            
            if should_include:
                # Ensure rma_id field is populated
                if not rma.get("rma_id"):
                    rma["rma_id"] = rma.get("name")
                    
                filtered_rma_bins.append(rma)
        
        # Log for debugging
        frappe.logger().info(f"Quality Check Technician View - Found {len(filtered_rma_bins)} records for technician: {technician}, Filters: {values}, Repair Status: {repair_status}")
        
        return filtered_rma_bins

    except Exception as e:
        frappe.logger().error(f"Error in get_technician_quality_check_data: {str(e)}")
        frappe.throw(f"Error fetching RMA BIN data: {str(e)}")

@frappe.whitelist()
def update_rma_bin_status(rma_bin_id, status, remarks=None):
    """
    Update RMA BIN status and remarks
    """
    try:
        doc = frappe.get_doc("RMA BIN", rma_bin_id)
        
        # Update the main status field
        doc.rma_id_status = status
        
        # Add status to child table
        doc.append("rma_status", {
            "repair_status": status,
            "timestamp": frappe.utils.now_datetime()
        })
        
        # Add remarks to child table if provided
        if remarks:
            doc.append("remarks", {
                "repair_remarks": remarks,
                "timestamp": frappe.utils.now_datetime()  
            })
        
        # Update last_updated_on if it exists
        if hasattr(doc, 'last_updated_on'):
            doc.last_updated_on = frappe.utils.now_datetime()
            
        doc.save()
        frappe.db.commit()
        
        return {"success": True, "message": f"RMA BIN {rma_bin_id} updated successfully"}
        
    except Exception as e:
        frappe.logger().error(f"Error updating RMA BIN: {str(e)}")
        return {"success": False, "message": f"Error: {str(e)}"}

@frappe.whitelist()
def get_repair_status_options():
    """
    Helper function to get all unique repair status values
    for populating dropdown options (matching repair_and_return.py pattern)
    """
    statuses = frappe.db.sql("""
        SELECT DISTINCT repair_status 
        FROM `tabStatus` 
        WHERE repair_status IS NOT NULL 
        ORDER BY repair_status
    """, as_dict=True)
    
    return [s.repair_status for s in statuses]