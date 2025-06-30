import frappe

@frappe.whitelist()
def get_rma_allocation(batch_no):
        # data = frappe.db.sql(f""" 
        #     SELECT * 
        #     FROM `tabRMA Allocation` 
        #     WHERE batch_no = %s
        # """, (batch_no,), as_dict=True)

        data = frappe.get_doc("RMA Allocation", {"batch_no": batch_no})

        return data