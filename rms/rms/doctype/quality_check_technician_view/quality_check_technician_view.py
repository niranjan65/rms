# Copyright (c) 2025, Anantdv and contributors
# For license information, please see license.txt


import frappe
from frappe.model.document import Document
from datetime import datetime


class QualityCheckTechnicianView(Document):

    def before_save(self):
        rows = self.get("quality_check_technician_view_table") or []

        if not rows:
            return

        for row in rows:
            initiated = 1 if row.get("quality_check_initiated") else 0
            done = 1 if row.get("quality_check_done") else 0
            passed = 1 if row.get("quality_check_pass") else 0

            # Skip completely untouched rows
            if not initiated and not done and not passed:
                continue

            # initiated only — allowed to save
            if initiated and not done and not passed:
                continue

            # done without initiated — block
            if done and not initiated:
                frappe.throw(
                    f"Row {row.idx} (RMA ID: <b>{row.rma_id}</b>): "
                    f"Please check <b>Quality Check Initiated</b> first."
                )

            # done without pass — block
            if done and not passed:
                frappe.throw(
                    f"Row {row.idx} (RMA ID: <b>{row.rma_id}</b>): "
                    f"<b>Quality Check Pass</b> is mandatory when "
                    f"<b>Quality Check Done</b> is checked."
                )

            # pass without done — block
            if passed and not done:
                frappe.throw(
                    f"Row {row.idx} (RMA ID: <b>{row.rma_id}</b>): "
                    f"<b>Quality Check Done</b> must be checked before "
                    f"marking <b>Quality Check Pass</b>."
                )





# @frappe.whitelist()
# def calculate_tat(start_time, end_time):
#     """
#     Public method to calculate TAT (Turn Around Time) between two datetime strings.
#     Returns time in HH:MM:SS format.
#     Called from client-side JavaScript.
    
#     Args:
#         start_time (str): Start datetime string
#         end_time (str): End datetime string
    
#     Returns:
#         str: Time difference in HH:MM:SS format
#     """
#     return calculate_time_difference(start_time, end_time)


@frappe.whitelist()
def calculate_tat(start_time, end_time):
    """
    Public method to calculate TAT (Turn Around Time) between two datetime strings.
    Returns time in HH:MM:SS format.
    Called from client-side JavaScript.
    """
    if not start_time or not end_time:
        return "00:00:00"
    
    try:
        # Safely convert to datetime objects
        if isinstance(start_time, str):
            dt_start = datetime.strptime(start_time.split(".")[0], "%Y-%m-%d %H:%M:%S")
        else:
            dt_start = start_time

        if isinstance(end_time, str):
            dt_end = datetime.strptime(end_time.split(".")[0], "%Y-%m-%d %H:%M:%S")
        else:
            dt_end = end_time

        diff = dt_end - dt_start
        total_seconds = int(diff.total_seconds())
        if total_seconds < 0:
            return "00:00:00"
        
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        
    except Exception as e:
        frappe.logger().error(f"Error in calculate_tat: {str(e)}")
        # Fallback to local function if defined in scope
        try:
            return calculate_time_difference(start_time, end_time)
        except NameError:
            return "00:00:00"

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
            AND (name LIKE '%quality%' OR name LIKE '%check%' OR name LIKE '%rma%' OR name LIKE '%bin%')
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
    
    Args:
        technician (str): Required - Employee ID/Name of the technician
        customer (str): Optional - Filter by customer name
        lot_no (str): Optional - Filter by lot number
        warranty_status (str): Optional - Filter by warranty status
        circle (str): Optional - Filter by circle
        rma_id (str): Optional - Filter by RMA ID
        repair_status (str): Optional - Filter by repair status
    
    Returns:
        list: List of RMA BIN documents with filtered data
        
    Raises:
        frappe.ValidationError: If there's an error fetching the data
    """
    try:
        # Build filters - using SQL approach for better control
        conditions = []
        values = {}
        
        # Technician filter (required) - quality_check_assigned_to field
        conditions.append("quality_check_assigned_to = %(technician)s")
        values["technician"] = technician
        
        # Document status filter - exclude cancelled documents
        conditions.append("docstatus != 2")
        ###
        # abhi///////////////
        conditions.append("dispatch_date IS NULL")  # Only include records that have been dispatched
        # debjit////////////////
        # conditions.append("delivery_note_date IS NULL") 
        ###
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
            # Check both rma_id and name fields with LIKE for partial matching
            conditions.append("(rma_id LIKE %(rma_id_filter)s OR name LIKE %(rma_id_filter)s)")
            values["rma_id_filter"] = f"%{rma_id}%"
        
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
                filters={"parent": rma["name"], "parenttype": "RMA BIN"},
                fields=["*"],
                order_by="timestamp desc"  # Order by timestamp to get latest first
            )
            
            # Get remarks for this RMA
            rma["remarks"] = frappe.get_all(
                "Repair Remarks",
                filters={"parent": rma["name"], "parenttype": "RMA BIN"},
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
