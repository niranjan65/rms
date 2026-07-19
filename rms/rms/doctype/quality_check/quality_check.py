# # quality_check.py
# # Copyright (c) 2025, Anantdv and contributors
# # For license information, please see license.txt

# import frappe
# from frappe.model.document import Document
# from datetime import datetime


# class QualityCheck(Document):
#     def before_save(self):
#         """Update RMA BIN records with quality check assigned to value from child table when document is saved"""
#         # self.update_rma_bin_quality_check()
#         # update_rma_bin_quality_check(self)
#         pass


# def calculate_time_difference(start_time_str, end_time_str):
#     """
#     Calculate time difference between two datetime strings.
#     Returns time in HH:MM:SS format.
    
#     Args:
#         start_time_str: datetime string (e.g., "2025-12-02 13:30:45")
#         end_time_str: datetime string (e.g., "2025-12-02 15:45:30")
    
#     Returns:
#         str: Time difference in HH:MM:SS format
#     """
#     if not start_time_str or not end_time_str:
#         return None
    
#     try:
#         # Parse datetime strings
#         start_time = datetime.strptime(str(start_time_str), "%Y-%m-%d %H:%M:%S")
#         end_time = datetime.strptime(str(end_time_str), "%Y-%m-%d %H:%M:%S")
        
#         # Calculate difference
#         diff = end_time - start_time
        
#         # Get total seconds
#         total_seconds = int(diff.total_seconds())
        
#         # Convert to HH:MM:SS format
#         hours = total_seconds // 3600
#         minutes = (total_seconds % 3600) // 60
#         seconds = total_seconds % 60
        
#         # Format with leading zeros
#         tat_time = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        
#         return tat_time
#     except Exception as e:
#         frappe.logger().error(f"Error calculating TAT: {str(e)}")
#         return None


# def update_rma_bin_quality_check(self):
#     updated_count = 0
#     processed_count = 0

#     for row in self.quality_check:
#         processed_count += 1

#         if not row.rma_id:
#             continue

#         if not frappe.db.exists("RMA BIN", row.rma_id):
#             continue

#         rma_bin_doc = frappe.get_doc("RMA BIN", row.rma_id)
#         changes_made = False

#         # Employee link fields check
#         for field in ["assigned_to", "quality_check_assign_to"]:
#             new_value = getattr(row, field, None) or ""
#             old_value = getattr(rma_bin_doc, "quality_check_assigned_to") or ""

#             if new_value and (old_value.split(" - ")[0] != new_value):
#                 rma_bin_doc.set(field, new_value)
#                 changes_made = True

#         # Quality check date
#         if row.quality_check_date and row.quality_check_date != rma_bin_doc.quality_check_assigned_date:
#             rma_bin_doc.quality_check_assigned_date = row.quality_check_date
#             changes_made = True

#         # Append repair remarks if not empty
#         if row.repair_remarks:
#             remark_row = rma_bin_doc.append("remarks", {})
#             remark_row.repair_remarks = row.repair_remarks
#             remark_row.timestamp = row.modified
#             changes_made = True

#         # Append repair status if not empty
#         if row.repair_status:
#             status_row = rma_bin_doc.append("rma_status", {})
#             status_row.repair_status = row.repair_status
#             status_row.timestamp = row.modified
#             changes_made = True

#         if changes_made:
#             rma_bin_doc.save(ignore_permissions=True)
#             updated_count += 1

#     frappe.msgprint(f"Processed: {processed_count}, Updated: {updated_count}")


# @frappe.whitelist()
# def get_quality_check_data(customer=None, lot_no=None, warranty_status=None, circle=None, rma_id=None, repair_status=None):
#     """
#     Filter RMA BIN records for Quality Check - same pattern as Repair and Return
#     but ONLY shows items with "Repaired" status
#     """
#     # Build filters for the query
#     conditions = []
#     values = {}
    
#     if customer:
#         conditions.append("customer = %(customer)s")
#         values["customer"] = customer
    
#     if lot_no:
#         conditions.append("lot_no = %(lot_no)s")
#         values["lot_no"] = lot_no
    
#     if warranty_status:
#         conditions.append("warranty_status = %(warranty_status)s")
#         values["warranty_status"] = warranty_status
    
#     if circle:
#         conditions.append("circle = %(circle)s")
#         values["circle"] = circle
    
#     if rma_id:
#         # Check both rma_id and name fields
#         conditions.append("(rma_id LIKE %(rma_id_filter)s OR name LIKE %(rma_id_filter)s)")
#         values["rma_id_filter"] = f"%{rma_id}%"
    
#     # Always exclude cancelled documents
#     conditions.append("docstatus != 2")
    
#     # Build the WHERE clause
#     where_clause = ""
#     if conditions:
#         where_clause = "WHERE " + " AND ".join(conditions)
    
#     # Execute query to get RMA bins
#     query = f"""
#         SELECT * FROM `tabRMA BIN`
#         {where_clause}
#         ORDER BY creation DESC
#     """
    
#     rma_bins = frappe.db.sql(query, values, as_dict=True)
    
#     filtered_rma_bins = []
    
#     for rma in rma_bins:
#         # Get status records for this RMA
#         rma["rma_status"] = frappe.get_all(
#             "Status",  
#             filters={"parent": rma["name"]},
#             fields=["*"],
#             order_by="timestamp desc"  # Order by timestamp to get latest first
#         )

#         # Get remarks for this RMA
#         rma["remarks"] = frappe.get_all(
#             "Repair Remarks",  
#             filters={"parent": rma["name"]},
#             fields=["*"],
#             order_by="creation desc"  # Also order remarks by newest first
#         )
        
#         # Apply status filter logic
#         should_include = False
        
#         if rma["rma_status"] and len(rma["rma_status"]) > 0:
#             # Get the latest status (first one since ordered desc)
#             last_status = rma["rma_status"][0]
            
#             # Store the last status in the RMA object for easy access
#             rma["rma_id_status"] = last_status.get("repair_status")
            
#             # QUALITY CHECK SPECIFIC LOGIC:
#             # If repair_status filter is provided, check if it matches
#             if repair_status:
#                 # Check if the last status matches the filter
#                 if last_status.get("repair_status") == repair_status:
#                     should_include = True
#             else:
#                 # DEFAULT: Only show "Repaired" status for Quality Check
#                 if last_status.get("repair_status") == "Repaired":
#                     should_include = True
#         else:
#             # No status exists - check main field
#             if rma.get("rma_id_status"):
#                 # If repair_status filter is provided, check if it matches
#                 if repair_status:
#                     if rma.get("rma_id_status") == repair_status:
#                         should_include = True
#                 else:
#                     # Default: only include if status is "Repaired"
#                     if rma.get("rma_id_status") == "Repaired":
#                         should_include = True
        
#         # Special case: If only RMA ID is specified (no other filters), include it regardless of status
#         # This helps when searching for a specific RMA ID
#         if rma_id and not customer and not lot_no and not warranty_status and not circle and not repair_status:
#             should_include = True
        
#         if should_include:
#             # Set repair_remarks from the latest remark if exists
#             if rma["remarks"] and len(rma["remarks"]) > 0:
#                 rma["repair_remarks"] = rma["remarks"][0].get("repair_remarks", "")
#             else:
#                 rma["repair_remarks"] = ""
            
#             # Ensure rma_id field is populated
#             if not rma.get("rma_id"):
#                 rma["rma_id"] = rma.get("name")
            
#             filtered_rma_bins.append(rma)
    

#     return filtered_rma_bins

# @frappe.whitelist()
# def get_repair_status_options():
#     """
#     Helper function to get all unique repair status values
#     for populating dropdown options in Quality Check
#     """
#     statuses = frappe.db.sql("""
#         SELECT DISTINCT repair_status 
#         FROM `tabStatus` 
#         WHERE repair_status IS NOT NULL 
#         ORDER BY repair_status
#     """, as_dict=True)
    
#     return [s.repair_status for s in statuses]







import frappe
from frappe import _
from frappe.model.document import Document
from datetime import datetime


class QualityCheck(Document):
    def before_save(self):
        """Update RMA BIN records with quality check assigned to value from child table when document is saved"""
        # self.update_rma_bin_quality_check()
        # update_rma_bin_quality_check(self)
        pass


def calculate_time_difference(start_time_str, end_time_str):
    """
    Calculate time difference between two datetime strings.
    Returns time in HH:MM:SS format.
    
    Args:
        start_time_str: datetime string (e.g., "2025-12-02 13:30:45")
        end_time_str: datetime string (e.g., "2025-12-02 15:45:30")
    
    Returns:
        str: Time difference in HH:MM:SS format
    """
    if not start_time_str or not end_time_str:
        return None
    
    try:
        # Parse datetime strings
        start_time = datetime.strptime(str(start_time_str), "%Y-%m-%d %H:%M:%S")
        end_time = datetime.strptime(str(end_time_str), "%Y-%m-%d %H:%M:%S")
        
        # Calculate difference
        diff = end_time - start_time
        
        # Get total seconds
        total_seconds = int(diff.total_seconds())
        
        # Convert to HH:MM:SS format
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        
        # Format with leading zeros
        tat_time = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        
        return tat_time
    except Exception as e:
        frappe.logger().error(f"Error calculating TAT: {str(e)}")
        return None


def update_rma_bin_quality_check(self):
    updated_count = 0
    processed_count = 0

    for row in self.quality_check:
        processed_count += 1

        if not row.rma_id:
            continue

        if not frappe.db.exists("RMA BIN", row.rma_id):
            continue

        rma_bin_doc = frappe.get_doc("RMA BIN", row.rma_id)
        changes_made = False

        # Employee link fields check
        for field in ["assigned_to", "quality_check_assign_to"]:
            new_value = getattr(row, field, None) or ""
            old_value = getattr(rma_bin_doc, "quality_check_assigned_to") or ""

            if new_value and (old_value.split(" - ")[0] != new_value):
                rma_bin_doc.set(field, new_value)
                changes_made = True

        # Quality check date
        if row.quality_check_date and row.quality_check_date != rma_bin_doc.quality_check_assigned_date:
            rma_bin_doc.quality_check_assigned_date = row.quality_check_date
            changes_made = True

        # Append repair remarks if not empty
        if row.repair_remarks:
            remark_row = rma_bin_doc.append("remarks", {})
            remark_row.repair_remarks = row.repair_remarks
            remark_row.timestamp = row.modified
            changes_made = True

        # Append repair status if not empty
        if row.repair_status:
            status_row = rma_bin_doc.append("rma_status", {})
            status_row.repair_status = row.repair_status
            status_row.timestamp = row.modified
            changes_made = True

        if changes_made:
            rma_bin_doc.save(ignore_permissions=True)
            updated_count += 1

    frappe.msgprint(f"Processed: {processed_count}, Updated: {updated_count}")


@frappe.whitelist()
def get_quality_check_data(customer=None, lot_no=None, warranty_status=None, circle=None, rma_id=None, repair_status=None):
    """
    Filter RMA BIN records for Quality Check - same pattern as Repair and Return
    but ONLY shows items with "Repaired & Ready for Quality check" status
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
        # Check both rma_id and name fields
        conditions.append("(rma_id LIKE %(rma_id_filter)s OR name LIKE %(rma_id_filter)s)")
        values["rma_id_filter"] = f"%{rma_id}%"
    
    # Always exclude cancelled documents
    conditions.append("docstatus != 2")
    
    # Build the WHERE clause
    where_clause = ""
    if conditions:
        where_clause = "WHERE " + " AND ".join(conditions)
    
    # Execute query to get RMA bins
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
        
        # Apply status filter logic
        should_include = False
        
        if rma["rma_status"] and len(rma["rma_status"]) > 0:
            # Get the latest status (first one since ordered desc)
            last_status = rma["rma_status"][0]
            
            # Store the last status in the RMA object for easy access
            rma["rma_id_status"] = last_status.get("repair_status")
            
            # QUALITY CHECK SPECIFIC LOGIC:
            # If repair_status filter is provided, check if it matches
            if repair_status:
                # Check if the last status matches the filter
                if last_status.get("repair_status") == repair_status:
                    should_include = True
            else:
                # DEFAULT: Only show "Repaired & Ready for Quality check" status for Quality Check
                if last_status.get("repair_status") == "Repaired & Ready for Quality check":
                    should_include = True
        else:
            # No status exists - check main field
            if rma.get("rma_id_status"):
                # If repair_status filter is provided, check if it matches
                if repair_status:
                    if rma.get("rma_id_status") == repair_status:
                        should_include = True
                else:
                    # Default: only include if status is "Repaired & Ready for Quality check"
                    if rma.get("rma_id_status") == "Repaired & Ready for Quality check":
                        should_include = True
        
        # Special case: If only RMA ID is specified (no other filters), include it regardless of status
        if rma_id and not customer and not lot_no and not warranty_status and not circle and not repair_status:
            should_include = True
        
        if should_include:
            # Set repair_remarks from the latest remark if exists
            if rma["remarks"] and len(rma["remarks"]) > 0:
                rma["repair_remarks"] = rma["remarks"][0].get("repair_remarks", "")
            else:
                rma["repair_remarks"] = ""
            
            # Ensure rma_id field is populated
            if not rma.get("rma_id"):
                rma["rma_id"] = rma.get("name")
            
            filtered_rma_bins.append(rma)
    
    return filtered_rma_bins


@frappe.whitelist()
def get_repair_status_options():
    """
    Helper function to get all unique repair status values
    for populating dropdown options in Quality Check
    """
    statuses = frappe.db.sql("""
        SELECT DISTINCT repair_status 
        FROM `tabStatus` 
        WHERE repair_status IS NOT NULL 
        ORDER BY repair_status
    """, as_dict=True)
    
    return [s.repair_status for s in statuses]