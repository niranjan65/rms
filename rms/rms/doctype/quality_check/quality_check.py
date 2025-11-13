

# import frappe
# from frappe.model.document import Document


# class QualityCheck(Document):
#     def before_save(self):
#         """Update RMA BIN records with quality check assigned to value from child table when document is saved"""
#         print("=== QUALITY CHECK BEFORE_SAVE TRIGGERED ===")
#         # self.update_rma_bin_quality_check()
#         # update_rma_bin_quality_check(self)

    
    


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
# def get_quality_check_data(customer='', lot_no='', warranty_status='', circle=''):
#     """Quality Check ke liye RMA data fetch karta hai - CASE INSENSITIVE FIXED VERSION"""
    
#     try:
#         print("=== QUALITY CHECK FIXED VERSION START ===")
        
#         # Basic filters
#         filters = {"docstatus": ["!=", 2]}
        
#         # User ke filters add karte hain
#         if customer:
#             filters["customer"] = customer
#         if lot_no:
#             filters["lot_no"] = lot_no
#         if warranty_status:
#             filters["warranty_status"] = warranty_status
#         if circle:
#             filters["circle"] = circle
        
#         print(f"Applied Filters: {filters}")
        
#         # Sabka data fetch karte hain first
#         all_rma_bins = frappe.get_all(
#             "RMA BIN",
#             filters=filters,
#             fields=["*"],
#             order_by="creation desc"
#         )
        
#         print(f"Total RMA BIN records found: {len(all_rma_bins)}")
        
#         if len(all_rma_bins) == 0:
#             print("❌ No basic records found!")
#             return []
        
#         # Step 1: Filter by main status (CASE INSENSITIVE)
#         main_status_filtered = []
#         for rma in all_rma_bins:
#             main_status = rma.get("rma_id_status", "")
#             # Case insensitive comparison
#             if main_status and main_status.lower() == "repaired":
#                 main_status_filtered.append(rma)
#                 print(f"✅ Main Status Match: {rma.get('name')} - '{main_status}'")
#             else:
#                 print(f"❌ Main Status Skip: {rma.get('name')} - '{main_status}'")
        
#         print(f"After main status filter: {len(main_status_filtered)}")
        
#         if len(main_status_filtered) == 0:
#             print("❌ No records with main status 'Repaired' found!")
#             print("Available status values:")
#             unique_statuses = set([rma.get("rma_id_status", "NOT_SET") for rma in all_rma_bins])
#             for status in unique_statuses:
#                 count = len([rma for rma in all_rma_bins if rma.get("rma_id_status") == status])
#                 print(f"  - '{status}': {count} records")
#             return []
        
#         # Step 2: Filter by child table latest status (CASE INSENSITIVE)
#         final_filtered_data = []
        
#         for rma in main_status_filtered:
#             print(f"\nProcessing RMA: {rma.get('name')}")
            
#             # Child tables fetch karte hain
#             status_entries = frappe.get_all(
#                 "Status",
#                 filters={"parent": rma["name"]},
#                 fields=["*"],
#                 order_by="creation desc, timestamp desc"
#             )
            
#             remarks_entries = frappe.get_all(
#                 "Repair Remarks",
#                 filters={"parent": rma["name"]},
#                 fields=["*"],
#                 order_by="creation desc, timestamp desc"
#             )
            
#             print(f"  Status entries: {len(status_entries)}")
#             print(f"  Remarks entries: {len(remarks_entries)}")
            
#             # Latest status check (CASE INSENSITIVE)
#             child_status_match = False
#             if status_entries and len(status_entries) > 0:
#                 latest_entry = status_entries[0]
#                 latest_repair_status = latest_entry.get("repair_status", "")
#                 print(f"  Latest child repair_status: '{latest_repair_status}'")
                
#                 # Case insensitive comparison
#                 if latest_repair_status and latest_repair_status.lower() == "repaired":
#                     child_status_match = True
#                     print("  ✅ Child status match!")
#                 else:
#                     print("  ❌ Child status no match")
#             else:
#                 print("  ❌ No child status entries found")
            
#             # Final decision
#             if child_status_match:
#                 # Attach child tables
#                 rma["rma_status"] = status_entries
#                 rma["remarks"] = remarks_entries
                
#                 # Latest remarks add karte hain
#                 if remarks_entries and len(remarks_entries) > 0:
#                     rma["repair_remarks"] = remarks_entries[0].get("repair_remarks", "")
#                 else:
#                     rma["repair_remarks"] = ""
                
#                 final_filtered_data.append(rma)
#                 print(f"  ✅ ADDED to final data: {rma.get('name')}")
#             else:
#                 print(f"  ❌ SKIPPED from final data: {rma.get('name')}")
        
#         print(f"\n=== FINAL SUMMARY ===")
#         print(f"Total original: {len(all_rma_bins)}")
#         print(f"Main status filtered: {len(main_status_filtered)}")
#         print(f"Final result: {len(final_filtered_data)}")
        
#         # Final data ke names print karte hain
#         final_names = [rma.get('name') for rma in final_filtered_data]
#         print(f"Final RMA IDs: {final_names}")
#         print("=== FIXED VERSION END ===")
        
#         return final_filtered_data
    
#     except Exception as e:
#         print(f"Error in fixed function: {str(e)}")
#         frappe.log_error(f"Fixed QC function error: {str(e)}", "Fixed QC Error")
#         frappe.throw(f"Error: {str(e)}")


# @frappe.whitelist()
# def get_all_quality_check_data(customer='', lot_no='', warranty_status='', circle=''):
#     """Temporary function - returns all data without filtering for testing"""
    
#     try:
#         print("=== ALL DATA FETCH (NO FILTER) ===")
        
#         # Basic filters only
#         filters = {"docstatus": ["!=", 2]}
        
#         if customer:
#             filters["customer"] = customer
#         if lot_no:
#             filters["lot_no"] = lot_no
#         if warranty_status:
#             filters["warranty_status"] = warranty_status
#         if circle:
#             filters["circle"] = circle
        
#         print(f"Filters: {filters}")
        
#         # Get all data
#         rma_bins = frappe.get_all(
#             "RMA BIN",
#             filters=filters,
#             fields=["*"],
#             order_by="creation desc"
#         )
        
#         print(f"Total records found: {len(rma_bins)}")
        
#         # Attach child tables
#         for rma in rma_bins:
#             rma["rma_status"] = frappe.get_all(
#                 "Status",
#                 filters={"parent": rma["name"]},
#                 fields=["*"],
#                 order_by="creation desc, timestamp desc"
#             )
            
#             rma["remarks"] = frappe.get_all(
#                 "Repair Remarks",
#                 filters={"parent": rma["name"]},
#                 fields=["*"],
#                 order_by="creation desc, timestamp desc"
#             )
            
#             if rma["remarks"] and len(rma["remarks"]) > 0:
#                 rma["repair_remarks"] = rma["remarks"][0].get("repair_remarks", "")
#             else:
#                 rma["repair_remarks"] = ""
        
#         print(f"Returning {len(rma_bins)} records with child tables")
#         return rma_bins
        
#     except Exception as e:
#         print(f"Error fetching all QC data: {str(e)}")
#         frappe.log_error(f"Error fetching all QC data: {str(e)}", "QC All Data Fetch Error")
#         frappe.throw(f"Error: {str(e)}")


# @frappe.whitelist() 
# def test_case_sensitivity():
#     """Case sensitivity test function"""
    
#     try:
#         print("=== CASE SENSITIVITY TEST ===")
        
#         # Get sample data
#         sample = frappe.db.sql("""
#             SELECT name, rma_id_status 
#             FROM `tabRMA BIN` 
#             WHERE rma_id_status IS NOT NULL 
#             LIMIT 5
#         """, as_dict=True)
        
#         print("Sample status values:")
#         for record in sample:
#             status_val = record.get("rma_id_status")
#             print(f"  {record.get('name')}: '{status_val}' -> lower: '{status_val.lower() if status_val else ''}'")
            
#         # Check child table values
#         child_sample = frappe.db.sql("""
#             SELECT parent, repair_status 
#             FROM `tabStatus` 
#             WHERE repair_status IS NOT NULL 
#             LIMIT 5
#         """, as_dict=True)
        
#         print("\nSample child status values:")
#         for record in child_sample:
#             repair_status = record.get("repair_status")
#             print(f"  {record.get('parent')}: '{repair_status}' -> lower: '{repair_status.lower() if repair_status else ''}'")
        
#         return {
#             "main_statuses": sample,
#             "child_statuses": child_sample
#         }
        
#     except Exception as e:
#         print(f"Case test error: {str(e)}")
#         return {"error": str(e)}


# @frappe.whitelist()
# def update_quality_check_status(rma_id, status, remarks=''):
#     """Update the quality check status for an RMA"""
    
#     try:
#         # Check if RMA exists
#         if not frappe.db.exists("RMA BIN", rma_id):
#             frappe.throw(f"RMA {rma_id} does not exist")
        
#         # Update the RMA BIN with quality check information
#         doc = frappe.get_doc("RMA BIN", rma_id)
        
#         # Add your quality check fields here
#         # doc.quality_check_status = status
#         # doc.quality_check_remarks = remarks
#         # doc.quality_check_date = frappe.utils.nowdate()
#         # doc.quality_checked_by = frappe.session.user
        
#         doc.save()
        
#         return {"status": "success", "message": f"Quality check updated for RMA {rma_id}"}
        
#     except Exception as e:
#         frappe.log_error(f"Error updating quality check status: {str(e)}", "Quality Check Update Error")
#         frappe.throw(f"Error updating quality check status: {str(e)}")


# @frappe.whitelist()
# def get_rma_details(rma_id):
#     """Get detailed information for a specific RMA"""
    
#     try:
#         data = frappe.db.get_value("RMA BIN", rma_id, 
#             ["name", "customer", "lot_no", "serial_no", "make", "model_no", 
#              "part_no", "warranty_status", "circle", "repaired_by", 
#              "component_used", "repair_status", "fault_found"], 
#             as_dict=True)
        
#         return data
        
#     except Exception as e:
#         frappe.log_error(f"Error fetching RMA details: {str(e)}", "RMA Details Fetch Error")
#         frappe.throw(f"Error fetching RMA details: {str(e)}")



# # quality_check.py
# import frappe
# from frappe.model.document import Document


# class QualityCheck(Document):
#     def before_save(self):
#         """Update RMA BIN records with quality check assigned to value from child table when document is saved"""
#         # self.update_rma_bin_quality_check()
#         # update_rma_bin_quality_check(self)
#         pass


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
# def get_quality_check_data(customer='', lot_no='', warranty_status='', circle='', rma_id='', repair_status=''):
#     """Quality Check ke liye RMA data fetch karta hai with working filters"""
    
#     try:
#         # First, apply basic filters using Frappe's ORM
#         filters = {"docstatus": ["!=", 2]}
        
#         if customer:
#             filters["customer"] = customer
#         if lot_no:
#             filters["lot_no"] = lot_no
#         if warranty_status:
#             filters["warranty_status"] = warranty_status
#         if circle:
#             filters["circle"] = circle
            
#         # Get initial filtered data
#         all_rma_bins = frappe.get_all(
#             "RMA BIN",
#             filters=filters,
#             fields=["*"],
#             order_by="creation desc"
#         )
        
#         # Apply RMA ID filter if provided
#         if rma_id and rma_id.strip():
#             rma_id_clean = rma_id.strip()
#             # Filter the list to only include matching RMA IDs
#             all_rma_bins = [
#                 rma for rma in all_rma_bins 
#                 if (
#                     (rma.get("rma_id") and rma_id_clean in str(rma.get("rma_id"))) or
#                     (rma.get("name") and rma_id_clean in str(rma.get("name"))) or
#                     (rma.get("rma_reference") and rma_id_clean in str(rma.get("rma_reference")))
#                 )
#             ]
            
#             # Log for debugging
#             frappe.log_error(
#                 f"RMA ID Filter: '{rma_id_clean}' - Found {len(all_rma_bins)} matching records", 
#                 "QC RMA Filter Debug"
#             )
        
#         if len(all_rma_bins) == 0:
#             return []
        
#         # Filter by main status - Looking for "Repaired"
#         main_status_filtered = []
#         for rma in all_rma_bins:
#             main_status = rma.get("rma_id_status", "")
#             if main_status and main_status.lower() == "repaired":
#                 main_status_filtered.append(rma)
        
#         if len(main_status_filtered) == 0:
#             # If no "Repaired" status found, return empty
#             return []
        
#         # Process each RMA and check child table status
#         final_filtered_data = []
        
#         for rma in main_status_filtered:
#             # Get child tables
#             status_entries = frappe.get_all(
#                 "Status",
#                 filters={"parent": rma["name"]},
#                 fields=["*"],
#                 order_by="timestamp desc"
#             )
            
#             remarks_entries = frappe.get_all(
#                 "Repair Remarks",
#                 filters={"parent": rma["name"]},
#                 fields=["*"],
#                 order_by="creation desc"
#             )
            
#             # Apply repair_status filter
#             should_include = False
            
#             if status_entries and len(status_entries) > 0:
#                 latest_entry = status_entries[0]
#                 latest_repair_status = latest_entry.get("repair_status", "")
#                 rma["rma_id_status"] = latest_repair_status
                
#                 if repair_status and repair_status.strip():
#                     # If repair_status filter provided, check exact match
#                     if latest_repair_status == repair_status.strip():
#                         should_include = True
#                 else:
#                     # Default: check for "Repaired" status
#                     if latest_repair_status and latest_repair_status.lower() == "repaired":
#                         should_include = True
#             else:
#                 rma["rma_id_status"] = None
#                 # If no status and repair_status filter provided, exclude
#                 if not repair_status:
#                     should_include = False
            
#             if should_include:
#                 rma["rma_status"] = status_entries
#                 rma["remarks"] = remarks_entries
                
#                 if remarks_entries and len(remarks_entries) > 0:
#                     rma["repair_remarks"] = remarks_entries[0].get("repair_remarks", "")
#                 else:
#                     rma["repair_remarks"] = ""
                
#                 final_filtered_data.append(rma)
        
#         # Final debug log
#         frappe.log_error(
#             f"Final results: {len(final_filtered_data)} records (from {len(all_rma_bins)} initial)", 
#             "QC Final Results"
#         )
        
#         return final_filtered_data
    
#     except Exception as e:
#         frappe.log_error(f"Quality Check error: {str(e)}", "QC Error")
#         frappe.throw(f"Error fetching quality check data: {str(e)}")




import frappe
from frappe.model.document import Document


class QualityCheck(Document):
    def before_save(self):
        """Update RMA BIN records with quality check assigned to value from child table when document is saved"""
        # self.update_rma_bin_quality_check()
        # update_rma_bin_quality_check(self)
        pass


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
    but ONLY shows items with "Repaired" status
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
                # DEFAULT: Only show "Repaired" status for Quality Check
                if last_status.get("repair_status") == "Repaired":
                    should_include = True
        else:
            # No status exists - check main field
            if rma.get("rma_id_status"):
                # If repair_status filter is provided, check if it matches
                if repair_status:
                    if rma.get("rma_id_status") == repair_status:
                        should_include = True
                else:
                    # Default: only include if status is "Repaired"
                    if rma.get("rma_id_status") == "Repaired":
                        should_include = True
        
        # Special case: If only RMA ID is specified (no other filters), include it regardless of status
        # This helps when searching for a specific RMA ID
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
    
    # Log for debugging
    frappe.log_error(
        f"Quality Check Filter Results: Total: {len(rma_bins)}, After Filter: {len(filtered_rma_bins)}, Filters: {values}", 
        "QC Filter Debug"
    )

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