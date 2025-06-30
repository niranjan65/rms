# # Copyright (c) 2025, Anantdv and contributors
# # For license information, please see license.txt


import frappe
from frappe.model.document import Document

class RMA(Document):
    def before_save(self):
        if self.workflow_state == "Serial No. Updated":
            for rma_item in self.get("rma_details" , []):
                batch_no = rma_item.get("batch_no")
                rma_no = rma_item.get("id")
                serial_number = rma_item.get("sl_no")
                if serial_number:
                    batch_doc = frappe.get_doc("Batch", batch_no)
                    batch_doc.custom_rma_id = self.name
                    for child in batch_doc.get("custom_rma_no", []):
                        if child.rma_no == rma_no and child.batch_no == batch_no:
                            child.serial_no = serial_number
                            batch_doc.save(ignore_permissions=True)
                            # batch_doc.save()
            
                # batch_doc.append("custom_rma_no", {
                #     "serial_no": serial_number
                # })

                # if batch_no and rma_no:
                #     self.update_single_batch(batch_no, rma_no, rma_item, serial_number)

    # def update_single_batch(self, batch_no, rma_no, rma_item, serial_number):
    #     batch_doc = frappe.get_doc("Batch", batch_no)
    #     self.name = batch_doc.custom_rma_id

    #     found = False

    #     for row in batch_doc.custom_rma_no:
    #         if row.rma_no == rma_no:
    #             row.serial_no = serial_number
    #             found = True
    #             break

    #     if found:
    #         batch_doc.save(ignore_permissions=True)
    #         frappe.db.commit()
    #         batch_doc.reload()



@frappe.whitelist()
def custom_save(batchNo, serialNumber, rmaNo):
    if not serialNumber:
        return
    batch_doc = frappe.get_doc("Batch", batchNo)
    # frm.doc.name = batch_doc.custom_rma_id
    found = False

    for row in batch_doc.custom_rma_no:
        if row.rma_no == rmaNo:
            row.serial_no = serialNumber
            found = True
            break
        

    if found:
        batch_doc.save(ignore_permissions=True)
        frappe.db.commit()  
        batch_doc.reload()
        frappe.msgprint(f"Batch {batchNo} updated successfully with RMA {rmaNo} and Serial No {serialNumber}.")





    # def before_save(self):
    #     if self.workflow_state == "Serial No. Generated":
            
    #         self.update_batch_serial_numbers()

    

    # def update_single_batch(self, batch_no, rma_no, rma_item, serial_number):
    #     batch_doc = frappe.get_doc("Batch", batch_no)
    #     self.name = batch_doc.custom_rma_id

    #     found = False

    #     for row in batch_doc.custom_rma_no:
    #         if row.rma_no == rma_no:
    #             row.serial_no = serial_number
    #             found = True
    #             break

    #     if found:
    #         batch_doc.save(ignore_permissions=True)
    #         frappe.db.commit()
    #         batch_doc.reload()


         
            


# @frappe.whitelist()
# def create_batches(items_by_batch, batch_to_item_mapping):
#     import json
#     items_by_batch = json.loads(items_by_batch)
#     batch_to_item_mapping = json.loads(batch_to_item_mapping)

#     created_batches = []
#     for batch_no in items_by_batch:
#         batch_doc = frappe.new_doc('Batch')

#         batch_doc.batch_name = batch_no
#         batch_doc.batch_id = batch_no 


#         if batch_no in batch_to_item_mapping:
#             batch_doc.item = batch_to_item_mapping[batch_no].get("item_code")
#             batch_doc.custom_total_quantity = batch_to_item_mapping[batch_no].get("quantity")


#         batch_doc.custom_rma_no = []
#         for item in items_by_batch[batch_no]:
#             batch_doc.append("custom_rma_no", {
#                 "doctype": "Batch No List",
#                 "rma_no": item.get("batch_id"),
#                 "batch_no": item.get("batch_no")
#             })

#         batch_doc.insert()
#         created_batches.append(batch_no)

#     return {"status": "success", "created_batches": created_batches}
# def update_rma(batch,row,col):
#     pass






# import frappe
# from frappe.model.document import Document
# from frappe import _

# class RMA(Document):
#     def before_save(self):
#         if self.workflow_state == "Serial No. Generated":
            
#             self.update_batch_serial_numbers()

#     def update_batch_serial_numbers(self):
#         for rma_item in self.get("rma_details" , []):
#             batch_no = rma_item.get("batch_no")
#             rma_no = rma_item.get("id")
#             serial_number = rma_item.get("sl_no")

#             if batch_no and rma_no:
                
#                 self.update_single_batch(batch_no, rma_no, rma_item, serial_number)

#     def update_single_batch(self, batch_no, rma_no, rma_item, serial_number):
#         batch_doc = frappe.get_doc("Batch", batch_no)
#         self.name = batch_doc.custom_rma_id

#         found = False

#         for row in batch_doc.custom_rma_no:
#             if row.rma_no == rma_no:
#                 row.serial_no = serial_number
#                 found = True
#                 break

#         if found:
#             batch_doc.save(ignore_permissions=True)
#             frappe.db.commit()
#             batch_doc.reload()


#     def generate_batches(self):
#         """Convert JavaScript generateBatches function to Python"""
        
#         # Step 1: Map item types to quantities
#         items_map = {}
#         if self.get("rma_features"):
#             for feature in self.get("rma_features"):
#                 items_map[feature.unit_type] = {
#                     "quantity": int(feature.quantity or 0),
#                     "isbulk": feature.isbulk
#                 }
        
#         frappe.logger().info(f"Items map: {items_map}")

#         # Step 2: Group RMA IDs by batch number
#         items_by_batch = {}
#         for item in self.get("rma_details", []):
#             batch_no = item.batch_no
#             if batch_no not in items_by_batch:
#                 items_by_batch[batch_no] = []
#             items_by_batch[batch_no].append(item)

#         completed_batches = 0
#         batch_exists_count = 0
#         frappe.logger().info(f"Items grouped by batch: {items_by_batch}")

#         # Step 3: Map batch numbers to unit types from rma_features
#         batch_to_item_mapping = {}
#         batch_numbers = sorted(items_by_batch.keys())
        
#         for index, feature in enumerate(self.get("rma_features", [])):
#             if index < len(batch_numbers):
#                 batch_no = batch_numbers[index]
#                 batch_to_item_mapping[batch_no] = {
#                     "item_code": feature.unit_type,
#                     "quantity": int(feature.quantity or 0),
#                     "isbulk": feature.isbulk
#                 }

#         frappe.logger().info(f"Batch to item mapping: {batch_to_item_mapping}")

#         # Step 4: Create Batch documents
#         total_batches = len(items_by_batch)
#         created_batches = []
#         existing_batches = []
        
#         for batch_no, items in items_by_batch.items():
#             frappe.logger().info(f"Processing batch: {batch_no}")
            
#             # Check if batch already exists
#             if frappe.db.exists("Batch", batch_no):
#                 batch_exists_count += 1
#                 existing_batches.append(batch_no)
#                 frappe.logger().info(f"Batch already exists for: {batch_no}, skipping creation.")
#                 continue

#             try:
#                 # Create new Batch document
#                 batch_doc = frappe.new_doc("Batch")
#                 frappe.logger().info(f"Creating Batch for: {batch_no}")

#                 # Set basic batch fields
#                 batch_doc.custom_customer = self.customer
#                 batch_doc.batch_name = batch_no
#                 batch_doc.batch_id = batch_no
#                 batch_doc.id = batch_no

#                 # Add item and quantity from rma_features mapping
#                 if batch_no in batch_to_item_mapping:
#                     mapping = batch_to_item_mapping[batch_no]
#                     frappe.logger().info(f"Batch to item mapping found for: {mapping.get('isbulk')}")
                    
#                     batch_doc.item = mapping["item_code"]
#                     batch_doc.custom_is_bulk = mapping.get("isbulk")
#                     batch_doc.custom_total_quantity = mapping["quantity"]
#                     batch_doc.batch_qty = mapping["quantity"]

#                 # Add RMA numbers to the batch
#                 for item in items:
#                     batch_doc.append("custom_rma_no", {
#                         "rma_no": item.id,
#                         "batch_no": item.batch_no,
#                         "serial_no": getattr(item, 'sl_no', None)
#                     })

#                 # Save the batch document
#                 batch_doc.insert(ignore_permissions=True)
#                 frappe.db.commit()
                
#                 completed_batches += 1
#                 created_batches.append(batch_no)
#                 frappe.logger().info(f"✅ Batch created for: {batch_no}")
                
#             except Exception as e:
#                 frappe.logger().error(f"❌ Error creating batch {batch_no}: {str(e)}")
#                 frappe.throw(_("An error occurred while creating batch {0}: {1}").format(batch_no, str(e)))

#         # Set form properties
#         self.db_set("guic", 1)
        
#         # Return results for feedback
#         result = {
#             "total_batches": total_batches,
#             "created_batches": len(created_batches),
#             "existing_batches": len(existing_batches),
#             "created_batch_list": created_batches,
#             "existing_batch_list": existing_batches
#         }
        
#         # Log completion status
#         if existing_batches:
#             if len(existing_batches) == total_batches:
#                 frappe.logger().info("All batches already exist")
#                 frappe.msgprint(
#                     _("All batches for this RMA already exist."),
#                     title=_("Batches Already Exist"),
#                     indicator="orange"
#                 )
#             else:
#                 frappe.logger().info(f"Created {len(created_batches)} new batches, {len(existing_batches)} already existed")
#                 frappe.msgprint(
#                     _("Created {0} new batches. {1} batches already existed.").format(
#                         len(created_batches), len(existing_batches)
#                     ),
#                     title=_("Batch Creation Complete"),
#                     indicator="blue"
#                 )
#         else:
#             frappe.logger().info(f"Successfully created all {len(created_batches)} batches")
#             frappe.msgprint(
#                 _("Successfully created {0} batches.").format(len(created_batches)),
#                 title=_("Batch Creation Complete"),
#                 indicator="green"
#             )
        
#         return result

#     def filter_rma_features_with_created_batches(self):
#         """Python equivalent of filterRMAFeaturesWithCreatedBatches"""
        
#         if not self.get("rma_details"):
#             return

#         # Get all unique batch numbers from rma_details
#         batch_numbers = list(set([item.batch_no for item in self.get("rma_details", [])]))
        
#         # Map batch numbers to unit types from rma_details
#         batch_to_unit_type = {}
#         for item in self.get("rma_details", []):
#             if item.batch_no not in batch_to_unit_type and item.unit_type:
#                 batch_to_unit_type[item.batch_no] = item.unit_type

#         # Check which batches exist
#         created_batches = []
#         for batch_no in batch_numbers:
#             if frappe.db.exists("Batch", batch_no):
#                 created_batches.append(batch_no)

#         if not created_batches:
#             return

#         # Get unit types that have created batches
#         unit_types_with_batches = [
#             batch_to_unit_type[batch] for batch in created_batches 
#             if batch in batch_to_unit_type
#         ]

#         if not unit_types_with_batches:
#             return

#         # Filter rma_features to show only rows with created batches
#         original_features = self.get("rma_features", [])
#         filtered_features = [
#             feature for feature in original_features 
#             if feature.unit_type in unit_types_with_batches
#         ]

#         # Clear and repopulate the table
#         self.set("rma_features", [])
        
#         for feature in filtered_features:
#             self.append("rma_features", {
#                 "unit_type": feature.unit_type,
#                 "quantity": feature.quantity,
#                 "isbulk": getattr(feature, 'isbulk', None),
#                 # Add other fields as needed
#             })

#         frappe.logger().info(f"Filtered RMA features: showing {len(filtered_features)} rows with created batches")
        
#         return len(filtered_features)

# # Method to call from client-side (JavaScript)
# @frappe.whitelist()
# def generate_batches_for_rma(rma_name):
#     """Server method to generate batches for RMA"""
    
#     if not rma_name:
#         frappe.throw(_("RMA name is required"))
    
#     try:
#         rma_doc = frappe.get_doc("RMA", rma_name)
#         result = rma_doc.generate_batches()
        
#         # Also filter the features table
#         rma_doc.filter_rma_features_with_created_batches()
#         rma_doc.save(ignore_permissions=True)
        
#         return result
        
#     except Exception as e:
#         frappe.logger().error(f"Error in generate_batches_for_rma: {str(e)}")
#         frappe.throw(_("Failed to generate batches: {0}").format(str(e)))

# # Alternative: Direct method call from button
# @frappe.whitelist()
# def create_rma_batches(doc, method=None):
#     """Method that can be called from a custom button or workflow action"""
    
#     if isinstance(doc, str):
#         doc = frappe.get_doc("RMA", doc)
    
#     return doc.generate_batches()
