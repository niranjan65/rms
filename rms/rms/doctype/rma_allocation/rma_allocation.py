# Copyright (c) 2025, Anantdv and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class RMAAllocation(Document):
    def before_save(self):
        self.update_rma_allocation_done()

    def update_rma_allocation_done(self):
        # Ensure batch is provided
        if not self.batch_no:
            return

        batch_doc = frappe.get_doc("Batch", self.batch_no)

        # Skip bulk batches
        if getattr(batch_doc, "custom_is_bulk", 0) == 1:
            return

        updated = False

        # Go through the RMA Allocated List in RMA Allocation
        for allocation in self.rma_allocated_list:
            serial = allocation.serial_number
            technician = allocation.technician

            # Only update if both serial and technician are set
            if serial and technician:
                for rma in batch_doc.custom_rma_no:
                    if rma.serial_no == serial and not rma.rma_allocation_done:
                        rma.rma_allocation_done = 1
                        if self.isbulk == 0:
                            rma.technician = allocation.technician
                        updated = True

        # Save batch if any rows were updated
        if updated:
            if batch_doc.custom_rma_no and len(batch_doc.custom_rma_no) > 0:
                done_count = len([row for row in batch_doc.custom_rma_no if row.rma_allocation_done])
                total_count = len(batch_doc.custom_rma_no)
                expected_value = 1 if done_count == total_count else 0
                batch_doc.custom_rma_allocation_check = expected_value

            batch_doc.save(ignore_permissions=True)
            frappe.db.commit()
            batch_doc.reload()
