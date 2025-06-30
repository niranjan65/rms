# Copyright (c) 2025, Anantdv and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class PhysicalScreening(Document):
    def before_save(self):
        self.update_physical_screening_done()

    def update_physical_screening_done(self):
        
        # Check if we have screening items
        if not self.screening_items:
            return

        # Get batch document
        if not self.batch_no:
            return

        batch_doc = frappe.get_doc("Batch", self.batch_no)

        # Skip bulk batches
        if batch_doc.custom_is_bulk == 1:
            return

        updated = False

        # Check each screening item
        for item in self.screening_items:
            # If status is OK
            
            if item.status == "Ok" or item.status == "Not Ok":

                # Find matching RMA in batch
                for rma in batch_doc.custom_rma_no:
                    # Match by serial number
                    if rma.serial_no == item.serial_number:
                        # Set physical screening done
                        if int(rma.physical_screening_done) == 0:
                            
                            if item.status == "Ok":
                                rma.physical_screening_done = 1
                                updated = True
                                

                            elif item.status == "Not Ok":
                                rma.physical_screening_done = 2
                                updated = True
                        # If already done, skip
                        elif rma.physical_screening_done in (1, 2):
                            frappe.msgprint(
                                f"Physical Screening already done for serial number: {item.serial_number} with status: {rma.physical_screening_done}"
                            )
                        break


        # Save batch if updated
        if updated:
            # Check if all physical screenings are done
            if batch_doc.custom_rma_no and len(batch_doc.custom_rma_no) > 0:
                done_count = len([row for row in batch_doc.custom_rma_no if row.physical_screening_done in (1, 2)])
                total_count = len(batch_doc.custom_rma_no)
                expected_value = 1 if done_count == total_count else 0
                batch_doc.custom_physical_screening_check = expected_value

            batch_doc.save(ignore_permissions=True)
            frappe.db.commit()
            batch_doc.reload()
