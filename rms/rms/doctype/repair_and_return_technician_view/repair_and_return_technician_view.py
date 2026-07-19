import re 
import frappe
from frappe import _
from frappe.model.document import Document
from datetime import datetime
import json

class RepairandReturnTechnicianView(Document):
    def validate(self):
        self.validate_repair_status_rules()

    def validate_repair_status_rules(self):
        """
        Validates that if a child table row is modified or contains status updates, 
        the status must be set to 'Under Repair' before saving those changes.
        """
        meta = frappe.get_meta("RMA BIN")
        fields_to_get = ["repair_status"]
        
        # Safely determine available fields dynamically to avoid OperationalError
        if meta.has_field("component_requested"):
            fields_to_get.append("component_requested")
        if meta.has_field("requested_components"):
            fields_to_get.append("requested_components")
        if meta.has_field("component_used"):
            fields_to_get.append("component_used")

        for row in self.get("repair_and_return") or []:
            if not row.rma_id or not row.repair_status: # Skip empty status rows
                continue

            # 1. Direct bypass: If the row was untouched, skip validation entirely
            if hasattr(row, "is_modified") and row.is_modified == 0:
                continue

            # Fetch the current stored values of this RMA BIN safely from the database
            rma_bin_data = frappe.db.get_value(
                "RMA BIN", 
                row.rma_id, 
                fields_to_get, 
                as_dict=True
            )

            if not rma_bin_data:
                continue

            orig_status = (rma_bin_data.get("repair_status") or "").strip()
            curr_status = (row.repair_status or "").strip()

            # Fetch the latest remark from the child table "Repair Remarks" to avoid false change detection
            latest_remark = frappe.get_all(
                "Repair Remarks",
                filters={"parent": row.rma_id, "parenttype": "RMA BIN"},
                fields=["repair_remarks"],
                order_by="creation desc",
                limit=1
            )
            db_remarks = latest_remark[0].get("repair_remarks") if latest_remark else ""

            orig_remarks = str(db_remarks or "").strip()
            curr_remarks = str(row.repair_remarks or "").strip()

            # Dynamically determine the original components field to prevent schema mismatch errors
            orig_components = ""
            if "component_requested" in rma_bin_data:
                orig_components = rma_bin_data.get("component_requested") or ""
            elif "requested_components" in rma_bin_data:
                orig_components = rma_bin_data.get("requested_components") or ""
            elif "component_used" in rma_bin_data:
                orig_components = rma_bin_data.get("component_used") or ""

            orig_components = str(orig_components).strip()
            curr_components = str(row.component_used or "").strip()

            # Verify if this specific row was modified
            status_changed = orig_status != curr_status
            remarks_changed = orig_remarks != curr_remarks
            components_changed = orig_components != curr_components

            # Only enforce the "Under Repair" status validation if the row has actually been modified
            if status_changed or remarks_changed or components_changed:
                if orig_status != "Under Repair" and curr_status != "Under Repair":
                    frappe.throw(
                        _("Initial repair status for RMA ID <b>{0}</b> must be set to 'Under Repair' before performing other updates, adding components, or writing remarks.").format(row.rma_id),
                        title=_("Status Action Required")
                    )


def calculate_time_difference(start_time_str, end_time_str):
    """
    Calculate time difference between two datetime strings.
    Returns time in HH:MM:SS format.
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
        
        for doc in parent_docs:
            child_rows = frappe.get_all(
                "Status",  
                filters={"parent": doc.name, "parenttype": "RMA BIN"},
                fields=["*"],
                order_by="timestamp desc"
            )
            
            # Strict allowed statuses for the technician view list
            allowed_statuses = ["Repair Technician Assigned", "Under Repair","QC Failed, Returned to Repair"]
            current_status = None

            if child_rows and len(child_rows) > 0:
                current_status = child_rows[0].get("repair_status")
            else:
                # Fallback to parent fields if child records are missing
                current_status = doc.get("repair_status") or doc.get("rma_id_status")
                
            doc["rma_id_status"] = current_status
            should_include = False

            if repair_status:
                # If a specific filter is selected in the UI dropdown, match it
                if current_status == repair_status:
                    should_include = True
            else:
                # Default behavior: strictly display only "Technician Assigned" and "Under Repair"
                if current_status in allowed_statuses:
                    should_include = True
            
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


@frappe.whitelist()
def get_items_by_partial_name(item_names):
    """Get items using partial/fuzzy name matching"""
    if isinstance(item_names, str):
        item_names = json.loads(item_names)
    
    if not item_names:
        return []
    
    cleaned_names = [name.strip().replace('\n', '').replace('\t', '') for name in item_names]
    items = []

    for name in cleaned_names:
        qty = 1
        qty_match = re.search(r'\[Qty:(\d+)\]', name)
        if qty_match:
            qty = int(qty_match.group(1))
            name = re.sub(r'\s*\[Qty:\d+\]', '', name).strip()

        result = frappe.db.sql("""
            SELECT name, item_name, item_code, stock_uom, description, valuation_rate
            FROM `tabItem`
            WHERE item_name LIKE %s
            LIMIT 1
        """, (f"%{name}%",), as_dict=True)

        if result:
            item = result[0]
            item['qty'] = qty
            items.append(item)
    
    return items


# @frappe.whitelist()
# def create_material_issue(stock_entry_data):
#     try:
#         if isinstance(stock_entry_data, str):
#             stock_entry_data = json.loads(stock_entry_data)

#         # Check stock BEFORE creating Material Issue
#         shortage_items = []

#         for item in stock_entry_data.get("items", []):
#             warehouse = item.get("s_warehouse")
#             item_code = item.get("item_code")
#             qty = float(item.get("qty") or 0)

#             available_qty = frappe.db.get_value(
#                 "Bin",
#                 {"item_code": item_code, "warehouse": warehouse},
#                 "actual_qty"
#             ) or 0

#             available_qty = float(available_qty)

#             if available_qty < qty:
#                 shortage_items.append(
#                     f"Item: {item_code}<br>Warehouse: {warehouse}<br>Available Qty: {available_qty}<br>Required Qty: {qty}<br>"
#                 )

#         if shortage_items:
#             return {
#                 "success": 0,
#                 "stock_error": 1,
#                 "error": (
#                     "<b>Material Issue cannot be created due to insufficient stock.</b><br><br>"
#                     + "<hr>".join(shortage_items)
#                 )
#             }

#         stock_entry = frappe.get_doc(stock_entry_data)
#         stock_entry.insert(ignore_permissions=True)
#         stock_entry.submit()
#         frappe.db.commit()

#         return {
#             "success": 1,
#             "stock_entry": stock_entry.name
#         }

#     except Exception:
#         frappe.log_error(frappe.get_traceback(), "Material Issue Creation Error")
#         return {
#             "success": 0,
#             "error": str(frappe.get_traceback())
#         }


@frappe.whitelist()
def create_material_issue(stock_entry_data, child_doctype=None, child_name=None, rma_id=None):
    try:
        if isinstance(stock_entry_data, str):
            stock_entry_data = json.loads(stock_entry_data)

        # Check stock BEFORE creating Material Issue
        shortage_items = []

        for item in stock_entry_data.get("items", []):
            warehouse = item.get("s_warehouse")
            item_code = item.get("item_code")
            qty = float(item.get("qty") or 0)

            available_qty = frappe.db.get_value(
                "Bin",
                {"item_code": item_code, "warehouse": warehouse},
                "actual_qty"
            ) or 0

            available_qty = float(available_qty)

            if available_qty < qty:
                shortage_items.append(
                    f"Item: {item_code}<br>Warehouse: {warehouse}<br>Available Qty: {available_qty}<br>Required Qty: {qty}<br>"
                )

        if shortage_items:
            return {
                "success": 0,
                "stock_error": 1,
                "error": (
                    "<b>Material Issue cannot be created due to insufficient stock.</b><br><br>"
                    + "<hr>".join(shortage_items)
                )
            }

        stock_entry = frappe.get_doc(stock_entry_data)
        stock_entry.insert(ignore_permissions=True)
        stock_entry.submit()

        # Update database fields directly to bypass ORM validation type-casting issues
        if rma_id:
            frappe.db.set_value("RMA BIN", rma_id, "material_issue", stock_entry.name)
            
        if child_doctype and child_name:
            frappe.db.set_value(child_doctype, child_name, "material_issue", stock_entry.name)

        frappe.db.commit()

        return {
            "success": 1,
            "stock_entry": stock_entry.name
        }

    except Exception:
        frappe.log_error(frappe.get_traceback(), "Material Issue Creation Error")
        return {
            "success": 0,
            "error": str(frappe.get_traceback())
        }

@frappe.whitelist()
def validate_component_stock(item_code, warehouse, qty):
    frappe.logger().info(
        f"[validate_component_stock] item_code={item_code}, warehouse={warehouse}, qty={qty}"
    )

    available_qty = frappe.db.get_value(
        "Bin",
        {"item_code": item_code, "warehouse": warehouse},
        "actual_qty"
    ) or 0

    available_qty = float(available_qty)
    qty = float(qty)

    frappe.logger().info(
        f"[validate_component_stock] available_qty={available_qty}"
    )

    if available_qty < qty:
        frappe.throw(
            f"""
            Insufficient Stock
            <br><br>
            Item: {item_code}
            <br>
            Warehouse: {warehouse}
            <br>
            Available Qty: {available_qty}
            <br>
            Required Qty: {qty}
            """
        )

    return True