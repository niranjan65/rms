# import frappe
# import json

# @frappe.whitelist()
# def get_hierarchical_dashboard_data(filters=None):
#     conditions = "docstatus < 2"
    
#     if filters:
#         filters = json.loads(filters)
#         if filters.get("customer"):
#             conditions += f" AND customer = '{filters.get('customer')}'"
#         if filters.get("circle"):
#             conditions += f" AND circle = '{filters.get('circle')}'"
#         if filters.get("lot_no"):
#             conditions += f" AND lot_no = '{filters.get('lot_no')}'"

#     # 1. Fetch Main RMA Data (Now fetching all Receiving Model fields)
#     rmas = frappe.db.sql(f"""
#         SELECT 
#             name as rma_id, customer, circle, lot_no, receiving_date, 
#             make, model_no, part_no, serial_no, warranty_status, receiving_remarks,
#             rma_id_status, repair_status, total_tat_dispatch as total_tat, 
#             material_receipt, component_used_init, items, delivery_note_id,
#             repaired_by, total_repair_time,
#             quality_check_assigned_to, quality_check_pass, 
#             quality_check_assigned_date, quality_check_done_date, total_quality_time,
#             dispatch_date, delivery_challan_no, docket_no, delivery_date, courier_name
#         FROM `tabRMA BIN`
#         WHERE {conditions}
#         ORDER BY customer ASC, lot_no DESC, creation DESC
#     """, as_dict=True)

#     rma_names = [r.rma_id for r in rmas]
#     issues_map = {}
#     receipts_map = {}
#     tracking_map = {}
#     se_owner_map = {}
#     se_items_map = {}
    
#     if rma_names:
#         # 2. Extract Table MultiSelect Data
#         multiselect_data = frappe.db.sql("""
#             SELECT parent, parentfield, stock_entry 
#             FROM `tabFor Material Request Multiselect`
#             WHERE parent IN %s
#         """, (tuple(rma_names),), as_dict=True)
        
#         # 3. Fetch Approver/Owner AND ITEMS of the Stock Entries
#         stock_entry_names = [r.stock_entry for r in multiselect_data if r.stock_entry]
#         if stock_entry_names:
#             se_owners = frappe.db.sql("""
#                 SELECT name, owner FROM `tabStock Entry` WHERE name IN %s
#             """, (tuple(stock_entry_names),), as_dict=True)
#             for row in se_owners:
#                 se_owner_map[row.name] = row.owner
            
#             se_items = frappe.db.sql("""
#                 SELECT parent, item_code, qty FROM `tabStock Entry Detail` WHERE parent IN %s
#             """, (tuple(stock_entry_names),), as_dict=True)
#             for item in se_items:
#                 se_items_map.setdefault(item.parent, []).append({
#                     "item_code": item.item_code,
#                     "qty": item.qty
#                 })

#         for row in multiselect_data:
#             entry_data = {
#                 "id": row.stock_entry, 
#                 "owner": se_owner_map.get(row.stock_entry, "System"),
#                 "items": se_items_map.get(row.stock_entry, [])
#             }
#             if row.parentfield == 'material_issue' and row.stock_entry:
#                 issues_map.setdefault(row.parent, []).append(entry_data)
#             elif row.parentfield == 'submitted_material_receipt' and row.stock_entry:
#                 receipts_map.setdefault(row.parent, []).append(entry_data)

#         # 4. Extract RMA Tracking Status
#         tracking_data = frappe.db.sql("""
#             SELECT parent, status, timestamp, remarks, modified_by1 as owner
#             FROM `tabRMA Status Update`
#             WHERE parent IN %s
#             ORDER BY timestamp DESC
#         """, (tuple(rma_names),), as_dict=True)
        
#         for track in tracking_data:
#             time_str = track.timestamp.strftime('%d %b %Y, %I:%M %p') if track.timestamp else "Unknown Time"
#             tracking_map.setdefault(track.parent, []).append({
#                 "status": track.status or "Updated",
#                 "time": time_str,
#                 "remarks": track.remarks or "",
#                 "user": track.owner or "System"
#             })

#     # 5. Fetch Employee Names for Techs
#     emp_ids = set()
#     for r in rmas:
#         if r.repaired_by: emp_ids.add(r.repaired_by)
#         if r.quality_check_assigned_to: emp_ids.add(r.quality_check_assigned_to)
        
#     emp_map = {}
#     if emp_ids:
#         emps = frappe.db.sql("SELECT name, employee_name FROM `tabEmployee` WHERE name IN %s", (tuple(emp_ids),), as_dict=True)
#         for e in emps:
#             emp_map[e.name] = e.employee_name

#     # 6. Clean and Map Data
#     for rma in rmas:
#         rma.total_tat = str(rma.total_tat).split('.')[0] if rma.total_tat else "00:00:00"
#         rma.total_repair_time = str(rma.total_repair_time).split('.')[0] if rma.total_repair_time else "00:00:00"
#         rma.total_quality_time = str(rma.total_quality_time).split('.')[0] if rma.total_quality_time else "00:00:00"
        
#         rma.stock_outs = issues_map.get(rma.rma_id, [])
#         rma.material_requests = receipts_map.get(rma.rma_id, [])
#         rma.tracking_history = tracking_map.get(rma.rma_id, [])
        
#         rma.receiving_date = rma.receiving_date.strftime('%Y-%m-%d') if rma.receiving_date else "No Date"
        
#         rma.repaired_by_name = emp_map.get(rma.repaired_by, "") if rma.repaired_by else ""
#         rma.qc_by_name = emp_map.get(rma.quality_check_assigned_to, "") if rma.quality_check_assigned_to else ""

#         comps = rma.component_used_init or ""
#         rma.component_list = [c.strip() for c in comps.split(',') if c.strip()]

#     return rmas

import frappe
import json

@frappe.whitelist()
def get_hierarchical_dashboard_data(filters=None):
    conditions = "docstatus < 2"
    
    if filters:
        filters = json.loads(filters)
        if filters.get("customer"):
            conditions += f" AND customer = '{filters.get('customer')}'"
        if filters.get("circle"):
            conditions += f" AND circle = '{filters.get('circle')}'"
        if filters.get("lot_no"):
            conditions += f" AND lot_no = '{filters.get('lot_no')}'"

    # 1. Fetch Main RMA Data
    rmas = frappe.db.sql(f"""
        SELECT 
            name as rma_id, customer, circle, lot_no, receiving_date, 
            make, model_no, part_no, serial_no, warranty_status, receiving_remarks,
            rma_id_status, repair_status, total_tat_dispatch as total_tat, 
            material_receipt, component_used_init, items, delivery_note_id,
            repaired_by, total_repair_time,
            quality_check_assigned_to, quality_check_pass, 
            quality_check_assigned_date, quality_check_done_date, total_quality_time,
            dispatch_date, delivery_challan_no, docket_no, delivery_date, courier_name
        FROM `tabRMA BIN`
        WHERE {conditions}
        ORDER BY customer ASC, lot_no DESC, creation DESC
    """, as_dict=True)

    rma_names = [r.rma_id for r in rmas]
    issues_map = {}
    receipts_map = {}
    tracking_map = {}
    se_owner_map = {}
    se_items_map = {}
    
    if rma_names:
        # 2. Extract Table MultiSelect Data
        multiselect_data = frappe.db.sql("""
            SELECT parent, parentfield, stock_entry 
            FROM `tabFor Material Request Multiselect`
            WHERE parent IN %s
        """, (tuple(rma_names),), as_dict=True)
        
        # 3. Fetch Approver/Owner AND ITEMS of the Stock Entries
        stock_entry_names = [r.stock_entry for r in multiselect_data if r.stock_entry]
        if stock_entry_names:
            se_owners = frappe.db.sql("""
                SELECT name, owner FROM `tabStock Entry` WHERE name IN %s
            """, (tuple(stock_entry_names),), as_dict=True)
            for row in se_owners:
                se_owner_map[row.name] = row.owner
            
            se_items = frappe.db.sql("""
                SELECT parent, item_code, qty FROM `tabStock Entry Detail` WHERE parent IN %s
            """, (tuple(stock_entry_names),), as_dict=True)
            for item in se_items:
                se_items_map.setdefault(item.parent, []).append({
                    "item_code": item.item_code,
                    "qty": item.qty
                })

        for row in multiselect_data:
            entry_data = {
                "id": row.stock_entry, 
                "owner": se_owner_map.get(row.stock_entry, "System"),
                "items": se_items_map.get(row.stock_entry, [])
            }
            if row.parentfield == 'material_issue' and row.stock_entry:
                issues_map.setdefault(row.parent, []).append(entry_data)
            elif row.parentfield == 'submitted_material_receipt' and row.stock_entry:
                receipts_map.setdefault(row.parent, []).append(entry_data)

        # 4. Extract RMA Tracking Status
        tracking_data = frappe.db.sql("""
            SELECT parent, status, timestamp, remarks, modified_by1 as owner, quality_check_pass
            FROM `tabRMA Status Update`
            WHERE parent IN %s
            ORDER BY timestamp DESC
        """, (tuple(rma_names),), as_dict=True)
        
        for track in tracking_data:
            time_str = track.timestamp.strftime('%d %b %Y, %I:%M %p') if track.timestamp else "Unknown Time"
            
            # --- START OF STATUS MAPPING LOGIC ---
            mapped_status = track.status or "Updated"
            
            if mapped_status == "RMA Assign":
                mapped_status = "Repair Technician Assign"
            elif mapped_status == "Dispatch Completed":
                mapped_status = "Delivered"
            elif mapped_status == "RMA Q/C Done":
                # Convert "Yes"/"No" directly into "Pass"/"failed"
                if track.quality_check_pass == "Yes":
                    mapped_status = "Q/C Pass"
                else:
                    mapped_status = "Q/C failed"
            # --- END OF STATUS MAPPING LOGIC ---

            tracking_map.setdefault(track.parent, []).append({
                "status": mapped_status,
                "time": time_str,
                "remarks": track.remarks or "",
                "user": track.owner or "System"
            })

    # 5. Fetch Employee Names for Techs
    emp_ids = set()
    for r in rmas:
        if r.repaired_by: emp_ids.add(r.repaired_by)
        if r.quality_check_assigned_to: emp_ids.add(r.quality_check_assigned_to)
        
    emp_map = {}
    if emp_ids:
        emps = frappe.db.sql("SELECT name, employee_name FROM `tabEmployee` WHERE name IN %s", (tuple(emp_ids),), as_dict=True)
        for e in emps:
            emp_map[e.name] = e.employee_name

    # 6. Clean and Map Data
    for rma in rmas:
        rma.total_tat = str(rma.total_tat).split('.')[0] if rma.total_tat else "00:00:00"
        rma.total_repair_time = str(rma.total_repair_time).split('.')[0] if rma.total_repair_time else "00:00:00"
        rma.total_quality_time = str(rma.total_quality_time).split('.')[0] if rma.total_quality_time else "00:00:00"
        
        rma.stock_outs = issues_map.get(rma.rma_id, [])
        rma.material_requests = receipts_map.get(rma.rma_id, [])
        rma.tracking_history = tracking_map.get(rma.rma_id, [])
        
        rma.receiving_date = rma.receiving_date.strftime('%Y-%m-%d') if rma.receiving_date else "No Date"
        
        rma.repaired_by_name = emp_map.get(rma.repaired_by, "") if rma.repaired_by else ""
        rma.qc_by_name = emp_map.get(rma.quality_check_assigned_to, "") if rma.quality_check_assigned_to else ""

        comps = rma.component_used_init or ""
        rma.component_list = [c.strip() for c in comps.split(',') if c.strip()]

    return rmas