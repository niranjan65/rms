# # Copyright (c) 2025, Anantdv and contributors
# # For license information, please see license.txt

# import frappe
# from frappe.model.document import Document
# from frappe import _

# class RMA(Document):
#     def validate(self):
#         # Any validation logic can go here
#         pass
    
#     def on_submit(self):
       
#         if not self.material_receipt_created:
#             self.create_material_receipt()
#     # def before_save(self):
#     #     if(self.workflow_state == "Approved") and not self.get_db_value("material_receipt_created"):
#     #         self.create_material_receipt()
   

#     def create_material_receipt(self):
#         """Create Material Receipt when RMA is approved"""
#         try:
#             # Validate required fields - THROW ERRORS if missing
#             if not self.rma_features:
#                 frappe.throw(_("No items found in RMA Features to create Material Receipt"))
            
#             if not self.warehouse:
#                 frappe.throw(_("Warehouse is required to create Material Receipt"))
            
#             if not self.customer:
#                 frappe.throw(_("Customer is required to create Material Receipt"))
            
#             # Create new Stock Entry document
#             stock_entry = frappe.new_doc("Stock Entry")
#             stock_entry.stock_entry_type = "Material Receipt"
#             stock_entry.company = "Ductus Technologies Pvt. Ltd."
#             stock_entry.custom_customer = self.customer
#             stock_entry.posting_date = frappe.utils.today()
#             stock_entry.posting_time = frappe.utils.nowtime()
#             stock_entry.custom_rma_reference = self.name
#             stock_entry.lod_no = self.name
#             stock_entry.remarks = f"Material Receipt created from RMA: {self.name}"
            
#             # Add items from RMA Features
#             valid_items = 0
#             for feature in self.rma_features:
#                 if feature.model:  # Using Model field as requested
#                     try:
#                         # Get item details - this will throw error if item doesn't exist
#                         item_details = frappe.get_doc("Item", feature.model)
                        
#                         # Create stock entry detail
#                         stock_entry.append("items", {
#                             "item_code": feature.model,
#                             "item_name": item_details.item_name,
#                             "description": item_details.description,
#                             "uom": "Pack",  
#                             "stock_uom": item_details.stock_uom,
#                             "qty": 1,  
#                             "basic_rate": 0,  
#                             "basic_amount": 0,
#                             "t_warehouse": self.warehouse,  # Target warehouse from RMA
#                             # "serial_no": feature.serial_no if feature.serial_no else "",
#                             "conversion_factor": 1,
#                             "allow_zero_valuation_rate": 1,  # This is the key fix
#                         })
#                         valid_items += 1
                        
#                     except frappe.DoesNotExistError:
#                         frappe.throw(_("Item {0} does not exist in the system").format(feature.model))
#                 else:
#                     frappe.throw(_("Model field is empty in RMA Features row {0}").format(feature.idx))
            
#             # Validate that we have items to add
#             if valid_items == 0:
#                 frappe.throw(_("No valid items found from Model field in RMA Features"))
            
#             # Validate warehouse exists
#             if not frappe.db.exists("Warehouse", self.warehouse):
#                 frappe.throw(_("Warehouse {0} does not exist").format(self.warehouse))
            
#             # Insert the stock entry first
#             stock_entry.insert()
            
#             # Try to submit, but handle valuation rate errors gracefully
#             try:
#                 stock_entry.submit()
#                 status_msg = "created and submitted"
#             except Exception as submit_error:
#                 # If submit fails due to valuation rate, that's okay - leave it in draft
#                 if "Valuation Rate" in str(submit_error):
#                     status_msg = "created in draft status (please set valuation rates and submit manually)"
#                 else:
#                     # For other submission errors, throw them
#                     frappe.throw(_("Failed to submit Material Receipt: {0}").format(str(submit_error)))
            
#             # Update RMA to mark material receipt as created
#             self.db_set("material_receipt_created", stock_entry.name)

#             # Create RMA BIN documents for each row in RMA Features
#             self.create_rma_bin_documents()
            
#             # # Show success message
#             # frappe.msgprint(
#             #     _("Material Receipt {0} {1}!").format(stock_entry.name, status_msg),
#             #     title=_("Success"),
#             #     indicator="green"
#             # )
            
#             return stock_entry.name
            
#         except Exception as e:
#             # Log the detailed error
#             frappe.log_error(f"Material Receipt creation failed for RMA {self.name}", str(e))
            
#             # Re-throw the error to stop the workflow
#             frappe.throw(_("Failed to create Material Receipt: {0}").format(str(e)))

#     def create_rma_bin_documents(self):
#         """Create RMA BIN documents for each row in RMA Features"""
#         try:
#             # Check if RMA BIN doctype exists
#             if not frappe.db.exists("DocType", "RMA BIN"):
#                 frappe.msgprint("RMA BIN doctype not found. Please create the doctype first.", indicator="red")
#                 return
            
#             rma_bin_count = 0
#             failed_count = 0
            
#             # Loop through each row in RMA Features child table
#             for feature in self.rma_features:
#                 try:
#                     # Check if this feature has rma_id (required for naming)
#                     rma_id = getattr(feature, 'rma_id', '')
#                     if not rma_id:
#                         # frappe.msgprint(f"Row {feature.idx}: No RMA ID found. Skipping.", indicator="orange")
#                         failed_count += 1
#                         continue
                    
#                     # Check if RMA BIN with this rma_id already exists
#                     if frappe.db.exists("RMA BIN", rma_id):
#                         # frappe.msgprint(f"RMA BIN {rma_id} already exists. Skipping.", indicator="orange")
#                         failed_count += 1
#                         continue
                    
#                     # Create new RMA BIN document
#                     rma_bin = frappe.new_doc("RMA BIN")
                    
#                     # Set fields safely - avoid any object assignment issues
#                     if rma_id:
#                         rma_bin.rma_id = str(rma_id)

#                     # if repair_status:
#                     #     rma_bin.fault_found = repair_status
                    
#                     if self.customer:
#                         rma_bin.customer = str(self.customer)
                    
#                     rma_bin.lot_no = self.name
                    
#                     # Set other fields from RMA Features safely
#                     # make_val = getattr(feature, 'make', '')
#                     make_val = getattr(feature, 'brand', '')
#                     if make_val:
#                         rma_bin.make = str(make_val)
                    
#                     model_val = getattr(feature, 'model', '')
#                     if model_val:
#                         rma_bin.model_no = str(model_val)
                    
#                     part_no_val = getattr(feature, 'part_no', '')
#                     if part_no_val:
#                         rma_bin.part_no = str(part_no_val)
                    
#                     serial_no_val = getattr(feature, 'serial_no', '')
#                     if serial_no_val:
#                         rma_bin.serial_no = str(serial_no_val)
                    
#                     warranty_val = getattr(feature, 'warranty_status', '')
#                     if warranty_val:
#                         rma_bin.warranty_status = str(warranty_val)
                    
#                     remarks_val = getattr(feature, 'receiving_remarks', '')
#                     if remarks_val:
#                         rma_bin.receiving_remarks = str(remarks_val)
                    
#                     repair_val = getattr(feature, 'repair_status', '')
#                     if repair_val:
#                         rma_bin.repair_status = str(repair_val)
                    
#                     # Set dates and other fields
#                     rma_bin.receiving_date = frappe.utils.today()
                    
#                     # Set reference fields safely
#                     material_receipt_ref = getattr(self, 'material_receipt_created', '')
#                     if material_receipt_ref:
#                         rma_bin.material_receipt = str(material_receipt_ref)
                    
#                     customer_addr = getattr(self, 'customer_address', '')
#                     if customer_addr:
#                         rma_bin.customer_address = str(customer_addr)
                    
#                     challan_no = getattr(self, 'delivery_challan_no', '')
#                     if challan_no:
#                         rma_bin.delivery_challan_no = str(challan_no)

#                     lr_no = getattr(self, 'lr_no', '')
#                     if lr_no:
#                         rma_bin.lr_no = str(lr_no)

#                     circle_location = getattr(self, 'location', '')
#                     if circle_location:
#                         rma_bin.circle = str(circle_location)

#                     warehouse = getattr(self, 'warehouse', '')
#                     if warehouse:
#                         rma_bin.warehouse = str(warehouse)

#                     if feature.repair_status:
#                         rma_bin.rma_id_status = feature.repair_status


#                     if feature.repair_status:
#                         rma_bin.append('rma_status', {
#                             'repair_status': feature.repair_status,
#                             'timestamp': feature.modified
#                         })

#                     # rma_bin.append('rma_status', {
#                     #     'repair_status': feature.repair_status,
#                     #     'timestamp': feature.modified
#                     #     })

#                     if feature.remarks:
#                         rma_bin.append('remarks', {
#                             'repair_remarks': feature.remarks,
#                             'timestamp': feature.modified
#                         })
#                     # Insert the document
#                     rma_bin.insert(ignore_permissions=True)
#                     rma_bin_count += 1
                    
#                     # frappe.msgprint(f"Created RMA BIN: {rma_bin.name} for row {feature.idx}", indicator="green")
                    
#                 except Exception as row_error:
#                     failed_count += 1
#                     error_type = type(row_error).__name__
#                     error_message = str(row_error)
                    
#                     # Show detailed error information
#                     # frappe.msgprint(f"Row {feature.idx}: Failed to create RMA BIN - {error_type}: {error_message}", indicator="red")
                    
#                     # Handle specific error types
#                     if "UniqueValidationError" in error_type or "IntegrityError" in str(row_error):
#                         if "customer" in str(row_error):
#                             frappe.msgprint(f"Row {feature.idx}: Customer constraint issue. Please remove unique constraint from Customer field.", indicator="red")
#                         else:
#                             frappe.msgprint(f"Row {feature.idx}: Duplicate entry detected. Skipping.", indicator="orange")
#                     elif "TypeError" in error_type:
#                         frappe.msgprint(f"Row {feature.idx}: Field type mismatch. Check if all required fields exist in RMA BIN doctype.", indicator="red")
#                     else:
#                         frappe.msgprint(f"Row {feature.idx}: Failed to create RMA BIN - {error_type}", indicator="orange")
                    
#                     continue  # Skip this row and continue with others
            
#             # Show final summary message
#             total_rows = len(self.rma_features)
#             # if rma_bin_count > 0:
#             #     frappe.msgprint(
#             #         f"Successfully created {rma_bin_count} out of {total_rows} RMA BIN documents.",
#             #         title="RMA BIN Creation Summary",
#             #         indicator="green" if failed_count == 0 else "blue"
#             #     )
#             # elif failed_count > 0:
#             #     frappe.msgprint(
#             #         f"Failed to create all {total_rows} RMA BIN documents. Check for issues above.",
#             #         title="RMA BIN Creation Failed",
#             #         indicator="orange"
#             #     )
                
#         except Exception as e:
#             frappe.msgprint(
#                 "Failed to create RMA BIN documents. Check console for details.",
#                 title="RMA BIN Creation Error",
#                 indicator="orange"
#             )

    






# Copyright (c) 2025, Anantdv and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe import _

class RMA(Document):
    def validate(self):
        # Any validation logic can go here
        pass
    
    def on_submit(self):
        # Set the date to current date/time when document is submitted
        self.db_set('date', frappe.utils.today())
        
        if not self.material_receipt_created:
            self.create_material_receipt()
   
    def create_material_receipt(self):
        """Create Material Receipt when RMA is approved"""
        try:
            # Validate required fields - THROW ERRORS if missing
            if not self.rma_features:
                frappe.throw(_("No items found in RMA Features to create Material Receipt"))
            
            if not self.warehouse:
                frappe.throw(_("Warehouse is required to create Material Receipt"))
            
            if not self.customer:
                frappe.throw(_("Customer is required to create Material Receipt"))
            
            # Create new Stock Entry document
            stock_entry = frappe.new_doc("Stock Entry")
            stock_entry.stock_entry_type = "Material Receipt"
            stock_entry.company = "Ductus Technologies Pvt. Ltd."
            stock_entry.custom_customer = self.customer
            stock_entry.posting_date = frappe.utils.today()
            stock_entry.posting_time = frappe.utils.nowtime()
            stock_entry.custom_rma_reference = self.name
            stock_entry.lod_no = self.name
            stock_entry.remarks = f"Material Receipt created from RMA: {self.name}"
            
            # Add items from RMA Features
            valid_items = 0
            for feature in self.rma_features:
                if feature.model:  # Using Model field as requested
                    try:
                        # Get item details - this will throw error if item doesn't exist
                        item_details = frappe.get_doc("Item", feature.model)
                        
                        # Create stock entry detail
                        stock_entry.append("items", {
                            "item_code": feature.model,
                            "item_name": item_details.item_name,
                            "description": item_details.description,
                            "uom": "Pack",  
                            "stock_uom": item_details.stock_uom,
                            "qty": 1,  
                            "basic_rate": 0,  
                            "basic_amount": 0,
                            "t_warehouse": self.warehouse,  # Target warehouse from RMA
                            # "serial_no": feature.serial_no if feature.serial_no else "",
                            "conversion_factor": 1,
                            "allow_zero_valuation_rate": 1,  # This is the key fix
                        })
                        valid_items += 1
                        
                    except frappe.DoesNotExistError:
                        frappe.throw(_("Item {0} does not exist in the system").format(feature.model))
                else:
                    frappe.throw(_("Model field is empty in RMA Features row {0}").format(feature.idx))
            
            # Validate that we have items to add
            if valid_items == 0:
                frappe.throw(_("No valid items found from Model field in RMA Features"))
            
            # Validate warehouse exists
            if not frappe.db.exists("Warehouse", self.warehouse):
                frappe.throw(_("Warehouse {0} does not exist").format(self.warehouse))
            
            # Insert the stock entry first
            stock_entry.insert()
            
            # Try to submit, but handle valuation rate errors gracefully
            try:
                stock_entry.submit()
                status_msg = "created and submitted"
            except Exception as submit_error:
                # If submit fails due to valuation rate, that's okay - leave it in draft
                if "Valuation Rate" in str(submit_error):
                    status_msg = "created in draft status (please set valuation rates and submit manually)"
                else:
                    # For other submission errors, throw them
                    frappe.throw(_("Failed to submit Material Receipt: {0}").format(str(submit_error)))
            
            # Update RMA to mark material receipt as created
            self.db_set("material_receipt_created", stock_entry.name)

            # Create RMA BIN documents for each row in RMA Features
            self.create_rma_bin_documents()
            
            return stock_entry.name
            
        except Exception as e:
            # Log the detailed error
            frappe.log_error(f"Material Receipt creation failed for RMA {self.name}", str(e))
            
            # Re-throw the error to stop the workflow
            frappe.throw(_("Failed to create Material Receipt: {0}").format(str(e)))

    def create_rma_bin_documents(self):
        """Create RMA BIN documents for each row in RMA Features"""
        try:
            # Check if RMA BIN doctype exists
            if not frappe.db.exists("DocType", "RMA BIN"):
                frappe.msgprint("RMA BIN doctype not found. Please create the doctype first.", indicator="red")
                return
            
            rma_bin_count = 0
            failed_count = 0
            
            # Loop through each row in RMA Features child table
            for feature in self.rma_features:
                try:
                    # Check if this feature has rma_id (required for naming)
                    rma_id = getattr(feature, 'rma_id', '')
                    if not rma_id:
                        failed_count += 1
                        continue
                    
                    # Check if RMA BIN with this rma_id already exists
                    if frappe.db.exists("RMA BIN", rma_id):
                        failed_count += 1
                        continue
                    
                    # Create new RMA BIN document
                    rma_bin = frappe.new_doc("RMA BIN")
                    
                    # Set fields safely - avoid any object assignment issues
                    if rma_id:
                        rma_bin.rma_id = str(rma_id)
                    
                    if self.customer:
                        rma_bin.customer = str(self.customer)
                    
                    rma_bin.lot_no = self.name
                    
                    # Set other fields from RMA Features safely
                    make_val = getattr(feature, 'brand', '')
                    if make_val:
                        rma_bin.make = str(make_val)
                    
                    model_val = getattr(feature, 'model', '')
                    if model_val:
                        rma_bin.model_no = str(model_val)
                    
                    part_no_val = getattr(feature, 'part_no', '')
                    if part_no_val:
                        rma_bin.part_no = str(part_no_val)
                    
                    serial_no_val = getattr(feature, 'serial_no', '')
                    if serial_no_val:
                        rma_bin.serial_no = str(serial_no_val)
                    
                    warranty_val = getattr(feature, 'warranty_status', '')
                    if warranty_val:
                        rma_bin.warranty_status = str(warranty_val)
                    
                    remarks_val = getattr(feature, 'receiving_remarks', '')
                    if remarks_val:
                        rma_bin.receiving_remarks = str(remarks_val)
                    
                    repair_val = getattr(feature, 'repair_status', '')
                    if repair_val:
                        rma_bin.repair_status = str(repair_val)
                    
                    # Set receiving_date to the submission date (today when submitted)
                    rma_bin.receiving_date = frappe.utils.today()
                    
                    # Set reference fields safely
                    material_receipt_ref = getattr(self, 'material_receipt_created', '')
                    if material_receipt_ref:
                        rma_bin.material_receipt = str(material_receipt_ref)
                    
                    customer_addr = getattr(self, 'customer_address', '')
                    if customer_addr:
                        rma_bin.customer_address = str(customer_addr)
                    
                    challan_no = getattr(self, 'delivery_challan_no', '')
                    if challan_no:
                        rma_bin.delivery_challan_no = str(challan_no)

                    lr_no = getattr(self, 'lr_no', '')
                    if lr_no:
                        rma_bin.lr_no = str(lr_no)

                    circle_location = getattr(self, 'location', '')
                    if circle_location:
                        rma_bin.circle = str(circle_location)

                    warehouse = getattr(self, 'warehouse', '')
                    if warehouse:
                        rma_bin.warehouse = str(warehouse)

                    if feature.repair_status:
                        rma_bin.rma_id_status = feature.repair_status

                    if feature.repair_status:
                        rma_bin.append('rma_status', {
                            'repair_status': feature.repair_status,
                            'timestamp': frappe.utils.now_datetime()
                        })

                    if feature.remarks:
                        rma_bin.append('remarks', {
                            'repair_remarks': feature.remarks,
                            'timestamp': frappe.utils.now_datetime()
                        })
                    
                    # Insert the document
                    rma_bin.insert(ignore_permissions=True)
                    rma_bin_count += 1
                    
                except Exception as row_error:
                    failed_count += 1
                    error_type = type(row_error).__name__
                    error_message = str(row_error)
                    continue  # Skip this row and continue with others
                
        except Exception as e:
            frappe.msgprint(
                "Failed to create RMA BIN documents. Check console for details.",
                title="RMA BIN Creation Error",
                indicator="orange"
            )
