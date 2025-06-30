# Copyright (c) 2025, Anantdv and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class FinalQualityCheck(Document):
    def before_save(self):
        for item in self.fqc_item:
            if item.quality_check_done == 1 and item.working_date == 1:
                # Fetch the batch document
                batch = frappe.get_doc("Batch", self.batch_no)
                updated = False

                # Loop through the child table `custom_rma_no`
                for row in batch.custom_rma_no:
                    if row.rma_no == item.rma_item and row.serial_no == item.serial_number:
                        row.final_quality_check_done = 1
                        updated = True

                if updated:
                    if batch.custom_rma_no and len(batch.custom_rma_no) > 0:
                        done_count = len([row for row in batch.custom_rma_no if row.final_quality_check_done])
                        total_count = len(batch.custom_rma_no)
                        expected_value = 1 if done_count == total_count else 0
                        batch.custom_final_quality_check = expected_value

                    batch.save(ignore_permissions=True)
                    frappe.db.commit()
                    batch.reload()
